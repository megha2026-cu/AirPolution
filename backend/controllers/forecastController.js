/**
 * controllers/forecastController.js — 7-day AQI forecast handlers
 * getForecast serves stored predictions from aqi_forecasts table.
 * generateShortTermForecast computes a 14-day moving average with ±10 AQI jitter
 * and writes next 7 days into aqi_forecasts; called by the daily cron job at 01:00.
 */
const { pool } = require('../config/db');

// Serves the next 7 days of stored AQI predictions for a given city from aqi_forecasts.
async function getForecast(req, res) {
    const location_id = parseInt(req.query.location_id);
    if (!location_id || location_id < 1) {
        return res.status(400).json({ error: 'Valid location_id is required' });
    }
    try {
        const [rows] = await pool.query(
            `SELECT forecast_date, predicted_aqi, confidence_pct, model_version
             FROM aqi_forecasts
             WHERE location_id = ? AND forecast_date >= CURDATE()
             ORDER BY forecast_date ASC
             LIMIT 7`,
            [location_id]
        );
        res.json({ location_id, data: rows });
    } catch (err) {
        console.error('getForecast error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Computes a 7-day forecast using a 14-day moving average with ±10 AQI jitter.
// Confidence decreases 5% per day from 90% (day 1) to ~55% (day 7).
// Uses ON DUPLICATE KEY UPDATE so it is safe to call repeatedly (idempotent).
async function generateShortTermForecast(location_id) {
    try {
        const [history] = await pool.query(
            `SELECT DATE(recorded_at) AS date, ROUND(AVG(aqi), 0) AS avg_aqi
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
             GROUP BY DATE(recorded_at)
             ORDER BY date DESC
             LIMIT 7`,
            [location_id]
        );

        if (history.length < 3) return;

        const avgAqi = Math.round(history.reduce((s, r) => s + r.avg_aqi, 0) / history.length);

        for (let d = 1; d <= 7; d++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + d);
            const dateStr = forecastDate.toISOString().slice(0, 10);

            const jitter = Math.round((Math.random() - 0.5) * 20);
            const predicted = Math.max(0, avgAqi + jitter);
            const confidence = Math.max(50, 90 - d * 5);

            await pool.query(
                `INSERT INTO aqi_forecasts (location_id, forecast_date, predicted_aqi, confidence_pct)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE predicted_aqi = VALUES(predicted_aqi), confidence_pct = VALUES(confidence_pct)`,
                [location_id, dateStr, predicted, confidence]
            );
        }
    } catch (err) {
        console.error('generateShortTermForecast error:', err.message);
    }
}

module.exports = { getForecast, generateShortTermForecast };
