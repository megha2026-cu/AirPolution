/**
 * routes/api.js — Central API router
 * Mounts all resource routes under /api with Joi validation middleware.
 * Rate limiting is applied upstream in server.js before this router is reached.
 */
const express = require('express');
const router = express.Router();

const { getAllLocations, createLocation } = require('../controllers/locationController');
const {
    getReadings,
    getLatestReading,
    getHourlyAverage,
    getDailySummary,
    getPeakPollutionHours,
    getCategoryBreakdown
} = require('../controllers/readingsController');
const { getAlerts } = require('../controllers/alertController');
const { getForecast } = require('../controllers/forecastController');
const { login } = require('../controllers/authController');

const { validateQuery, validateBody, readingsQuerySchema, locationSchema, loginSchema } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

// Auth
router.post('/login', loginLimiter, validateBody(loginSchema), login);

// Locations
router.get('/locations', requireAuth, getAllLocations);
router.post('/locations', requireAuth, validateBody(locationSchema), createLocation);

// Readings
router.get('/readings', requireAuth, validateQuery(readingsQuerySchema), getReadings);
router.get('/readings/latest', requireAuth, getLatestReading);
router.get('/readings/hourly', requireAuth, validateQuery(readingsQuerySchema), getHourlyAverage);
router.get('/readings/daily', requireAuth, validateQuery(readingsQuerySchema), getDailySummary);
router.get('/readings/peak-hours', requireAuth, validateQuery(readingsQuerySchema), getPeakPollutionHours);
router.get('/readings/category-breakdown', requireAuth, validateQuery(readingsQuerySchema), getCategoryBreakdown);

// Alerts
router.get('/alerts', requireAuth, getAlerts);

// Forecast
router.get('/forecast', requireAuth, getForecast);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

module.exports = router;
