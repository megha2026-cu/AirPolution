/**
 * controllers/readingsController.js — Air quality readings resource handlers
 * Exposes filtered raw readings, latest snapshot, hourly/daily aggregations,
 * peak-hour breakdown, and AQI category distribution for dashboard charts.
 * All date/ID inputs are pre-validated by Joi before reaching these handlers.
 */
const { pool } = require('../config/db');

// Returns raw time-series readings for a city filtered by date range and optional pollutant.
async function getReadings(req, res) {
    const { location_id, from, to, pollutant } = req.validatedQuery;
    try {
        const [rows] = await pool.query(
            `SELECT recorded_at, aqi, pm25, pm10, co, no2, so2, o3, temperature, humidity, aqi_category
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at BETWEEN ? AND ?
             ORDER BY recorded_at ASC`,
            [location_id, from, to]
        );
        res.json({ location_id, from, to, pollutant, total: rows.length, data: rows });
    } catch (err) {
        console.error('getReadings error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Returns the single most-recent reading per city, joined with city name and state.
async function getLatestReading(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT r.*, l.city, l.state
             FROM air_quality_readings r
             JOIN locations l ON r.location_id = l.id
             WHERE r.recorded_at = (
                 SELECT MAX(recorded_at) FROM air_quality_readings WHERE location_id = r.location_id
             )
             ORDER BY l.city`
        );
        res.json({ data: rows });
    } catch (err) {
        console.error('getLatestReading error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Aggregates readings by hour bucket (YYYY-MM-DD HH:00:00) for the hourly pattern chart.
async function getHourlyAverage(req, res) {
    const { location_id, from, to } = req.validatedQuery;
    try {
        const [rows] = await pool.query(
            `SELECT DATE_FORMAT(recorded_at, '%Y-%m-%d %H:00:00') AS hour,
                    ROUND(AVG(aqi), 1) AS avg_aqi,
                    ROUND(AVG(pm25), 2) AS avg_pm25,
                    ROUND(AVG(pm10), 2) AS avg_pm10,
                    COUNT(*) AS sample_count
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at BETWEEN ? AND ?
             GROUP BY hour
             ORDER BY hour ASC`,
            [location_id, from, to]
        );
        res.json({ location_id, data: rows });
    } catch (err) {
        console.error('getHourlyAverage error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Returns avg, max, and min AQI per calendar day — drives the daily summary bar chart and KPI cards.
async function getDailySummary(req, res) {
    const { location_id, from, to } = req.validatedQuery;
    try {
        const [rows] = await pool.query(
            `SELECT DATE(recorded_at) AS date,
                    ROUND(AVG(aqi), 1) AS avg_aqi,
                    MAX(aqi) AS max_aqi,
                    MIN(aqi) AS min_aqi,
                    ROUND(AVG(pm25), 2) AS avg_pm25,
                    ROUND(AVG(pm10), 2) AS avg_pm10,
                    COUNT(*) AS readings_count
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at BETWEEN ? AND ?
             GROUP BY DATE(recorded_at)
             ORDER BY date ASC`,
            [location_id, from, to]
        );
        res.json({ location_id, data: rows });
    } catch (err) {
        console.error('getDailySummary error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Groups readings by hour-of-day (0–23) ordered by avg AQI descending to identify peak hours.
async function getPeakPollutionHours(req, res) {
    const { location_id, from, to } = req.validatedQuery;
    try {
        const [rows] = await pool.query(
            `SELECT HOUR(recorded_at) AS hour_of_day,
                    ROUND(AVG(aqi), 1) AS avg_aqi,
                    COUNT(*) AS count
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at BETWEEN ? AND ?
             GROUP BY HOUR(recorded_at)
             ORDER BY avg_aqi DESC`,
            [location_id, from, to]
        );
        res.json({ location_id, data: rows });
    } catch (err) {
        console.error('getPeakPollutionHours error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Calculates percentage distribution across AQI categories using a window function for the doughnut chart.
async function getCategoryBreakdown(req, res) {
    const { location_id, from, to } = req.validatedQuery;
    try {
        const [rows] = await pool.query(
            `SELECT aqi_category,
                    COUNT(*) AS count,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) AS pct
             FROM air_quality_readings
             WHERE location_id = ? AND recorded_at BETWEEN ? AND ?
             GROUP BY aqi_category
             ORDER BY FIELD(aqi_category,'Good','Satisfactory','Moderate','Poor','Very Poor','Severe')`,
            [location_id, from, to]
        );
        res.json({ location_id, data: rows });
    } catch (err) {
        console.error('getCategoryBreakdown error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getReadings,
    getLatestReading,
    getHourlyAverage,
    getDailySummary,
    getPeakPollutionHours,
    getCategoryBreakdown
};
