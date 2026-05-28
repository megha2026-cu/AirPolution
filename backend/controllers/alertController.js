/**
 * controllers/alertController.js — Hazard alert handlers
 * getAlerts serves all unresolved alerts joined with city names.
 * checkAndCreateAlerts is invoked by the 30-minute cron job; it queries
 * readings from the past hour with AQI > 300 and inserts a new alert record
 * only if no unresolved alert exists for that city within the last 3 hours.
 */
const { pool } = require('../config/db');

// Returns all unresolved alerts (resolved_at IS NULL) joined with city name, newest first.
async function getAlerts(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT a.*, l.city, l.state
             FROM alerts a
             JOIN locations l ON a.location_id = l.id
             WHERE a.resolved_at IS NULL
             ORDER BY a.triggered_at DESC
             LIMIT 50`
        );
        res.json({ data: rows });
    } catch (err) {
        console.error('getAlerts error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Scans readings from the past hour for AQI > 300 and inserts a new alert record
// only if no unresolved alert exists for that city within the last 3 hours.
async function checkAndCreateAlerts() {
    try {
        const [latest] = await pool.query(
            `SELECT r.location_id, r.aqi, r.recorded_at, l.city
             FROM air_quality_readings r
             JOIN locations l ON r.location_id = l.id
             WHERE r.aqi > 300
             AND r.recorded_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
             AND NOT EXISTS (
                 SELECT 1 FROM alerts a
                 WHERE a.location_id = r.location_id
                 AND a.resolved_at IS NULL
                 AND a.triggered_at >= DATE_SUB(NOW(), INTERVAL 3 HOUR)
             )`
        );

        for (const row of latest) {
            await pool.query(
                `INSERT INTO alerts (location_id, triggered_at, aqi_threshold, actual_aqi, message)
                 VALUES (?, NOW(), 300, ?, ?)`,
                [row.location_id, row.aqi, `Hazardous AQI level detected in ${row.city}: ${row.aqi}`]
            );
            console.log(`Alert created for ${row.city} — AQI: ${row.aqi}`);
        }
    } catch (err) {
        console.error('checkAndCreateAlerts error:', err.message);
    }
}

module.exports = { getAlerts, checkAndCreateAlerts };
