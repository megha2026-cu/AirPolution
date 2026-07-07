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

// Realistic AQI baselines per city
const CITY_PROFILES = [
    { id: 1, base_aqi: 250, variance: 80  }, // Delhi — very poor
    { id: 2, base_aqi: 120, variance: 50  }, // Mumbai
    { id: 3, base_aqi:  80, variance: 30  }, // Bengaluru
    { id: 4, base_aqi: 160, variance: 60  }, // Kolkata
    { id: 5, base_aqi:  90, variance: 35  }, // Chennai
    { id: 6, base_aqi: 110, variance: 45  }, // Hyderabad
    { id: 7, base_aqi: 220, variance: 70  }, // Noida
    { id: 8, base_aqi: 200, variance: 75  }, // Gurugram
    { id: 9, base_aqi:  95, variance: 40  }, // Pune
    { id:10, base_aqi: 130, variance: 55  }  // Ahmedabad
];

function rand(min, max) { return +(Math.random() * (max - min) + min).toFixed(2); }
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

async function seed() {
    const rows = [];
    const now  = new Date();

    for (const city of CITY_PROFILES) {
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
