/**
 * Seed sample air quality readings for the last 30 days.
 * Usage: node data/seed_sample_data.js
 * Requires DB env vars — copy .env.example to .env first.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const mysql = require('mysql2/promise');
const fs = require('fs');

const caPath = path.join(__dirname, '..', 'backend', 'certs', 'aiven-ca.pem');

const pool = mysql.createPool({
    host:     process.env.DB_HOST || 'localhost',
    port:     process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'air_quality_db',
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    connectionLimit: 5,
    ssl: process.env.DB_SSL === 'true'
        ? { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
        : undefined
});

// Realistic AQI baselines per city, keyed by city name (matches locations.city)
const CITY_PROFILES = [
    { city: 'Delhi',               base_aqi: 250, variance: 80 }, // very poor
    { city: 'Mumbai',              base_aqi: 120, variance: 50 },
    { city: 'Bengaluru',           base_aqi:  80, variance: 30 },
    { city: 'Kolkata',             base_aqi: 160, variance: 60 },
    { city: 'Chennai',             base_aqi:  90, variance: 35 },
    { city: 'Hyderabad',           base_aqi: 110, variance: 45 },
    { city: 'Noida',               base_aqi: 220, variance: 70 },
    { city: 'Gurugram',            base_aqi: 200, variance: 75 },
    { city: 'Pune',                base_aqi:  95, variance: 40 },
    { city: 'Ahmedabad',           base_aqi: 130, variance: 55 },
    { city: 'Jaipur',              base_aqi: 170, variance: 60 },
    { city: 'Lucknow',             base_aqi: 230, variance: 75 },
    { city: 'Patna',               base_aqi: 240, variance: 80 },
    { city: 'Bhopal',              base_aqi: 140, variance: 50 },
    { city: 'Chandigarh',          base_aqi: 150, variance: 55 },
    { city: 'Kanpur',              base_aqi: 260, variance: 85 }, // very poor
    { city: 'Raipur',              base_aqi: 180, variance: 60 },
    { city: 'Guwahati',            base_aqi: 150, variance: 55 },
    { city: 'Bhubaneswar',         base_aqi: 120, variance: 45 },
    { city: 'Thiruvananthapuram',  base_aqi:  60, variance: 25 }, // good/satisfactory
    { city: 'Amritsar',            base_aqi: 190, variance: 65 },
    { city: 'Dehradun',            base_aqi: 100, variance: 40 },
    { city: 'Ranchi',              base_aqi: 160, variance: 55 },
    { city: 'Shimla',              base_aqi:  55, variance: 20 }, // hill station, cleaner air
    { city: 'Panaji',              base_aqi:  70, variance: 25 }
];

function rand(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

async function seed() {
    const [locationRows] = await pool.query('SELECT id, city FROM locations');
    const cityIdByName = new Map(locationRows.map(r => [r.city, r.id]));

    const rows = [];
    const now  = new Date();

    for (const profile of CITY_PROFILES) {
        const locationId = cityIdByName.get(profile.city);
        if (!locationId) {
            console.warn(`Skipping "${profile.city}" — no matching row in locations table`);
            continue;
        }
        const city = { id: locationId, base_aqi: profile.base_aqi, variance: profile.variance };
        for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
            // 4 readings per day (00:00, 06:00, 12:00, 18:00)
            for (const hour of [0, 6, 12, 18]) {
                const ts = new Date(now);
                ts.setDate(ts.getDate() - dayOffset);
                ts.setHours(hour, 0, 0, 0);

                const jitter = rand(-city.variance, city.variance);
                // Peak-hour effect: morning + evening rush → higher AQI
                const rushBoost = (hour === 6 || hour === 18) ? rand(10, 30) : 0;
                const aqi = clamp(Math.round(city.base_aqi + jitter + rushBoost), 10, 500);

                const pm25 = clamp(rand(aqi * 0.4, aqi * 0.7), 1, 300);
                const pm10 = clamp(rand(aqi * 0.6, aqi * 1.0), 1, 500);
                const co   = clamp(rand(0.3, 3.5), 0.1, 50);
                const no2  = clamp(rand(10, 80), 0, 200);
                const so2  = clamp(rand(5, 40), 0, 100);
                const o3   = clamp(rand(20, 100), 0, 300);
                const temp = clamp(rand(18, 42), 5, 50);
                const hum  = clamp(rand(30, 90), 10, 100);

                rows.push([city.id, ts, aqi, pm25, pm10, co, no2, so2, o3, temp, hum]);
            }
        }
    }

    const sql = `INSERT IGNORE INTO air_quality_readings
        (location_id, recorded_at, aqi, pm25, pm10, co, no2, so2, o3, temperature, humidity)
        VALUES ?`;

    try {
        const [result] = await pool.query(sql, [rows]);
        console.log(`Inserted ${result.affectedRows} rows across ${CITY_PROFILES.length} cities.`);
    } catch (err) {
        console.error('Seed error:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
