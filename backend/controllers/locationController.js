/**
 * controllers/locationController.js — Location (city) resource handlers
 * Provides read and create operations for the locations table.
 * All queries use parameterized statements to prevent SQL injection.
 */
const { pool } = require('../config/db');

// Returns all location records sorted alphabetically by city name.
async function getAllLocations(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id, city, state, country, latitude, longitude FROM locations ORDER BY city'
        );
        res.json({ data: rows });
    } catch (err) {
        console.error('getAllLocations error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Inserts a new city record; body is pre-validated by locationSchema middleware.
async function createLocation(req, res) {
    const { city, state, country, latitude, longitude } = req.validatedBody;
    try {
        const [result] = await pool.query(
            'INSERT INTO locations (city, state, country, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
            [city, state || null, country, latitude || null, longitude || null]
        );
        res.status(201).json({ id: result.insertId, city });
    } catch (err) {
        console.error('createLocation error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { getAllLocations, createLocation };
