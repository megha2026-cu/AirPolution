/**
 * server.js — Express application entry point
 * Initialises middleware, mounts the API router, and starts scheduled cron jobs
 * for hazard alert detection and 7-day AQI forecast regeneration.
 */
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cron = require('node-cron');

const { testConnection } = require('./config/db');
const apiRouter = require('./routes/api');
const rateLimiter = require('./middleware/rateLimiter');
const { checkAndCreateAlerts } = require('./controllers/alertController');
const { generateShortTermForecast } = require('./controllers/forecastController');
const { pool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', rateLimiter);
app.use('/api', apiRouter);

const projectRoot = path.join(__dirname, '..');
app.use('/css', express.static(path.join(projectRoot, 'css')));
app.use('/js', express.static(path.join(projectRoot, 'js')));
app.get('/', (req, res) => res.sendFile(path.join(projectRoot, 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(projectRoot, 'login.html')));

// Scheduled: check for hazard alerts every 30 minutes
cron.schedule('*/30 * * * *', () => {
    checkAndCreateAlerts();
});

// Scheduled: regenerate 7-day forecasts daily at 01:00
cron.schedule('0 1 * * *', async () => {
    try {
        const [locations] = await pool.query('SELECT id FROM locations');
        for (const loc of locations) {
            await generateShortTermForecast(loc.id);
        }
        console.log('Forecasts regenerated for all locations');
    } catch (err) {
        console.error('Forecast cron error:', err.message);
    }
});

async function start() {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`Air Quality API running on port ${PORT}`);
    });
}

start();
