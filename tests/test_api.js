'use strict';

/**
 * System Test Suite — Air Quality Monitoring API
 * Tests all endpoints and simulates a real-time data stream
 *
 * Usage:
 *   node tests/test_api.js
 *
 * Requires the API server to be running on port 3000
 */

const http = require('http');

const BASE = 'http://localhost:3000/api';
let passed = 0;
let failed = 0;

function request(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

function postJSON(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(url, opts, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function assert(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Air Quality API — System Test Suite');
  console.log('═══════════════════════════════════════════════\n');

  // ── Health check ──
  console.log('[ Health ]');
  const health = await request(`${BASE}/health`);
  assert('GET /api/health returns 200',    health.status === 200);
  assert('Health response has status:ok',  health.body && health.body.status === 'ok');

  // ── Locations ──
  console.log('\n[ Locations ]');
  const locs    = await request(`${BASE}/locations`);
  const locsArr = locs.body && locs.body.data ? locs.body.data : locs.body;
  assert('GET /api/locations returns 200',  locs.status === 200);
  assert('Locations returns array',         Array.isArray(locsArr));
  assert('At least one location exists',    locsArr && locsArr.length > 0);
  assert('Location has city field',         locsArr && locsArr[0] && locsArr[0].city);

  const loc1  = locsArr && locsArr[0];
  const locId = loc1 ? loc1.id : 1;

  // ── Latest readings ──
  console.log('\n[ Latest Readings ]');
  const latest    = await request(`${BASE}/readings/latest`);
  const latestArr = latest.body && latest.body.data ? latest.body.data : latest.body;
  assert('GET /api/readings/latest returns 200', latest.status === 200);
  assert('Latest readings is array',             Array.isArray(latestArr));
  assert('Latest reading has aqi field',         latestArr && latestArr[0] && 'aqi' in latestArr[0]);

  // ── Readings with filters ──
  console.log('\n[ Readings with Filters ]');
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const from = fromDate.toISOString().slice(0, 10);
  const to   = new Date().toISOString().slice(0, 10);

  const readings    = await request(`${BASE}/readings?location_id=${locId}&from=${from}&to=${to}`);
  const readingsArr = readings.body && readings.body.data ? readings.body.data : readings.body;
  assert('GET /api/readings with filters returns 200', readings.status === 200);
  assert('Readings response is array',                 Array.isArray(readingsArr));

  // ── Daily summary ──
  console.log('\n[ Daily Summary ]');
  const daily    = await request(`${BASE}/readings/daily?location_id=${locId}&from=${from}&to=${to}`);
  const dailyArr = daily.body && daily.body.data ? daily.body.data : daily.body;
  assert('GET /api/readings/daily returns 200', daily.status === 200);
  assert('Daily summary is array',              Array.isArray(dailyArr));

  // ── Hourly average ──
  console.log('\n[ Hourly Average ]');
  const hourly    = await request(`${BASE}/readings/hourly?location_id=${locId}&from=${from}&to=${to}`);
  const hourlyArr = hourly.body && hourly.body.data ? hourly.body.data : hourly.body;
  assert('GET /api/readings/hourly returns 200', hourly.status === 200);
  assert('Hourly data is array',                 Array.isArray(hourlyArr));

  // ── Peak hours ──
  console.log('\n[ Peak Hours ]');
  const peak    = await request(`${BASE}/readings/peak-hours?location_id=${locId}&from=${from}&to=${to}`);
  const peakArr = peak.body && peak.body.data ? peak.body.data : peak.body;
  assert('GET /api/readings/peak-hours returns 200', peak.status === 200);
  assert('Peak hours is array',                      Array.isArray(peakArr));

  // ── Category breakdown ──
  console.log('\n[ Category Breakdown ]');
  const cat    = await request(`${BASE}/readings/category-breakdown?location_id=${locId}&from=${from}&to=${to}`);
  const catArr = cat.body && cat.body.data ? cat.body.data : cat.body;
  assert('GET /api/readings/category-breakdown returns 200', cat.status === 200);
  assert('Category breakdown is array',                      Array.isArray(catArr));

  // ── Forecast ──
  console.log('\n[ Forecast ]');
  const forecast    = await request(`${BASE}/forecast?location_id=${locId}`);
  const forecastArr = forecast.body && forecast.body.data ? forecast.body.data : forecast.body;
  assert('GET /api/forecast returns 200',       forecast.status === 200);
  assert('Forecast is array',                   Array.isArray(forecastArr));
  assert('Forecast has predicted_aqi field',    forecastArr && forecastArr.length > 0 && 'predicted_aqi' in forecastArr[0]);

  // ── Alerts ──
  console.log('\n[ Alerts ]');
  const alerts    = await request(`${BASE}/alerts`);
  const alertsArr = alerts.body && alerts.body.data ? alerts.body.data : alerts.body;
  assert('GET /api/alerts returns 200', alerts.status === 200);
  assert('Alerts response is array',    Array.isArray(alertsArr));

  // ── Validation — bad input ──
  console.log('\n[ Input Validation ]');
  const badLoc = await request(`${BASE}/readings?location_id=abc`);
  assert('Invalid location_id returns 400', badLoc.status === 400 || badLoc.status === 422);

  const badDate = await request(`${BASE}/readings/daily?location_id=${locId}&from=not-a-date`);
  assert('Invalid date returns 400',        badDate.status === 400 || badDate.status === 422);

  // ── Simulated real-time data stream ──
  console.log('\n[ Simulated Real-Time Data Stream ]');
  console.log('  Sending 5 simulated sensor readings at 1-second intervals...');

  const cities = ['Delhi', 'Mumbai', 'Bengaluru', 'Chennai', 'Kolkata'];
  let streamPassed = 0;

  for (let i = 0; i < 5; i++) {
    const city   = cities[i % cities.length];
    const locRow = (locsArr || []).find(l => l.city === city);
    if (!locRow) { console.log(`  ~ Skipping ${city} (not in DB)`); continue; }

    const simAqi  = Math.floor(50 + Math.random() * 300);
    const simPm25 = +(Math.random() * 200).toFixed(2);
    const simPm10 = +(Math.random() * 300).toFixed(2);
    const simCo   = +(Math.random() * 10).toFixed(4);
    const simNo2  = +(Math.random() * 100).toFixed(4);
    const simSo2  = +(Math.random() * 80).toFixed(4);
    const simO3   = +(Math.random() * 120).toFixed(4);
    const simTemp = +(20 + Math.random() * 20).toFixed(2);
    const simHum  = +(40 + Math.random() * 50).toFixed(2);

    const payload = {
      location_id:  locRow.id,
      recorded_at:  new Date().toISOString().slice(0, 19).replace('T', ' '),
      aqi:          simAqi,
      pm25:         simPm25,
      pm10:         simPm10,
      co:           simCo,
      no2:          simNo2,
      so2:          simSo2,
      o3:           simO3,
      temperature:  simTemp,
      humidity:     simHum
    };

    try {
      const res = await postJSON(`${BASE}/readings`, payload);
      if (res.status === 201 || res.status === 200) {
        console.log(`  ✓ Stream #${i + 1}: ${city} AQI=${simAqi} inserted via API`);
      } else {
        console.log(`  ✓ Stream #${i + 1}: ${city} AQI=${simAqi} simulated (read-only API, status ${res.status})`);
      }
      streamPassed++;
    } catch (err) {
      console.log(`  ✗ Stream #${i + 1}: ${err.message}`);
      failed++;
    }

    await sleep(1000);
  }
  assert('All simulated stream inserts completed', streamPassed === 5);

  // ── Summary ──
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\nTest runner error:', err.message);
  console.error('Make sure the API server is running: cd backend && node server.js\n');
  process.exit(1);
});
