'use strict';

/**
 * ETL Pipeline — Air Quality CSV Importer
 * Supports CPCB / WHO style CSV files
 *
 * Usage:
 *   node etl_import.js --file=<path_to_csv> [--dry-run]
 *
 * Expected CSV columns (any order):
 *   city, state, recorded_at (YYYY-MM-DD HH:mm:ss or YYYY-MM-DD),
 *   aqi, pm25, pm10, co, no2, so2, o3, temperature, humidity, source
 */

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const mysql = require(path.join(__dirname, '../backend/node_modules/mysql2/promise'));

const REQUIRED   = ['city', 'recorded_at'];
const BATCH_SIZE = 200;

const args    = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='));
const dryRun  = args.includes('--dry-run');

if (!fileArg) {
  console.error('Usage: node etl_import.js --file=<csv_path> [--dry-run]');
  process.exit(1);
}

const csvPath = fileArg.split('=')[1];
if (!fs.existsSync(csvPath)) {
  console.error('File not found:', csvPath);
  process.exit(1);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur.trim());
  return result;
}

function cleanFloat(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function cleanInt(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function validateDate(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : v;
}

function detectOutlier(row) {
  const issues = [];
  if (row.aqi !== null && (row.aqi < 0 || row.aqi > 500))          issues.push('aqi out of range');
  if (row.pm25 !== null && (row.pm25 < 0 || row.pm25 > 999))       issues.push('pm25 out of range');
  if (row.pm10 !== null && (row.pm10 < 0 || row.pm10 > 999))       issues.push('pm10 out of range');
  if (row.co   !== null && (row.co < 0 || row.co > 100))           issues.push('co out of range');
  if (row.no2  !== null && (row.no2 < 0 || row.no2 > 2000))        issues.push('no2 out of range');
  if (row.so2  !== null && (row.so2 < 0 || row.so2 > 2000))        issues.push('so2 out of range');
  if (row.o3   !== null && (row.o3  < 0 || row.o3  > 500))         issues.push('o3 out of range');
  if (row.temperature !== null && (row.temperature < -20 || row.temperature > 60)) issues.push('temperature out of range');
  if (row.humidity    !== null && (row.humidity < 0 || row.humidity > 100))        issues.push('humidity out of range');
  return issues;
}

async function run() {
  const pool = mysql.createPool({
    host:               process.env.DB_HOST || 'localhost',
    port:               process.env.DB_PORT || 3306,
    user:               process.env.DB_USER,
    password:           process.env.DB_PASS,
    database:           process.env.DB_NAME || 'air_quality_db',
    waitForConnections: true,
    connectionLimit:    5
  });

  const locationCache = {};
  let headers  = null;
  let lineNo   = 0;
  let inserted = 0;
  let skipped  = 0;
  let outliers = 0;
  const batch  = [];

  async function getOrCreateLocation(city, state) {
    const key = (city + '|' + (state || '')).toLowerCase();
    if (locationCache[key]) return locationCache[key];
    const [rows] = await pool.execute('SELECT id FROM locations WHERE LOWER(city)=?', [city.toLowerCase()]);
    if (rows.length) { locationCache[key] = rows[0].id; return rows[0].id; }
    const [res] = await pool.execute(
      'INSERT INTO locations (city, state, country) VALUES (?,?,?)',
      [city, state || null, 'India']
    );
    locationCache[key] = res.insertId;
    console.log(`  [NEW CITY] ${city} → id=${res.insertId}`);
    return res.insertId;
  }

  async function flushBatch() {
    if (!batch.length || dryRun) { batch.length = 0; return; }
    const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
    const values = [];
    for (const r of batch) {
      values.push(r.location_id, r.recorded_at, r.aqi, r.pm25, r.pm10,
                  r.co, r.no2, r.so2, r.o3, r.temperature, r.humidity, r.source);
    }
    await pool.execute(
      `INSERT IGNORE INTO air_quality_readings
       (location_id,recorded_at,aqi,pm25,pm10,co,no2,so2,o3,temperature,humidity,source)
       VALUES ${placeholders}`,
      values
    );
    inserted += batch.length;
    batch.length = 0;
  }

  const rl = readline.createInterface({ input: fs.createReadStream(csvPath), crlfDelay: Infinity });

  console.log(`\nETL Pipeline starting — file: ${csvPath}${dryRun ? ' [DRY RUN]' : ''}\n`);

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;

    if (!headers) {
      headers = parseCSVLine(line).map(h => h.toLowerCase().replace(/\s+/g, '_'));
      const missing = REQUIRED.filter(r => !headers.includes(r));
      if (missing.length) { console.error('Missing required columns:', missing.join(', ')); process.exit(1); }
      console.log('Columns detected:', headers.join(', '));
      continue;
    }

    const vals = parseCSVLine(line);
    const raw  = {};
    headers.forEach((h, i) => { raw[h] = vals[i] !== undefined ? vals[i] : null; });

    if (!raw.city || !raw.recorded_at) {
      console.warn(`  [SKIP] Line ${lineNo}: missing city or recorded_at`);
      skipped++; continue;
    }

    const recAt = validateDate(raw.recorded_at);
    if (!recAt) {
      console.warn(`  [SKIP] Line ${lineNo}: invalid date "${raw.recorded_at}"`);
      skipped++; continue;
    }

    const row = {
      location_id: await getOrCreateLocation(raw.city, raw.state || null),
      recorded_at: recAt,
      aqi:         cleanInt(raw.aqi),
      pm25:        cleanFloat(raw.pm25),
      pm10:        cleanFloat(raw.pm10),
      co:          cleanFloat(raw.co),
      no2:         cleanFloat(raw.no2),
      so2:         cleanFloat(raw.so2),
      o3:          cleanFloat(raw.o3),
      temperature: cleanFloat(raw.temperature),
      humidity:    cleanFloat(raw.humidity),
      source:      raw.source || 'csv_import'
    };

    const issues = detectOutlier(row);
    if (issues.length) {
      console.warn(`  [OUTLIER] Line ${lineNo} (${raw.city}): ${issues.join(', ')} — clamped & imported`);
      if (row.aqi !== null) row.aqi = Math.max(0, Math.min(500, row.aqi));
      outliers++;
    }

    batch.push(row);
    if (batch.length >= BATCH_SIZE) await flushBatch();
  }

  await flushBatch();
  await pool.end();

  console.log('\n── ETL Summary ─────────────────────────────');
  console.log(`  Lines processed : ${lineNo - 1}`);
  console.log(`  Rows inserted   : ${dryRun ? '0 (dry run)' : inserted}`);
  console.log(`  Rows skipped    : ${skipped}`);
  console.log(`  Outliers found  : ${outliers}`);
  console.log('────────────────────────────────────────────\n');
}

run().catch(err => { console.error('ETL error:', err.message); process.exit(1); });
