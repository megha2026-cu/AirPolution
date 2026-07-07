/**
 * config/db.js — MySQL connection pool
 * Creates a shared pool using credentials from environment variables.
 * All controllers import { pool } from here — never create ad-hoc connections.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const caPath = path.join(__dirname, '..', 'certs', 'aiven-ca.pem');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'air_quality_db',
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+05:30',
    ssl: process.env.DB_SSL === 'true'
        ? { ca: fs.readFileSync(caPath, 'utf8'), rejectUnauthorized: true }
        : undefined
});

async function testConnection() {
    try {
        const conn = await pool.getConnection();
        console.log('Database connected successfully');
        conn.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

module.exports = { pool, testConnection };
