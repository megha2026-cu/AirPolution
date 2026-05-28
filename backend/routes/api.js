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

const { validateQuery, validateBody, readingsQuerySchema, locationSchema } = require('../middleware/validate');

// Locations
router.get('/locations', getAllLocations);
router.post('/locations', validateBody(locationSchema), createLocation);

// Readings
router.get('/readings', validateQuery(readingsQuerySchema), getReadings);
router.get('/readings/latest', getLatestReading);
router.get('/readings/hourly', validateQuery(readingsQuerySchema), getHourlyAverage);
router.get('/readings/daily', validateQuery(readingsQuerySchema), getDailySummary);
router.get('/readings/peak-hours', validateQuery(readingsQuerySchema), getPeakPollutionHours);
router.get('/readings/category-breakdown', validateQuery(readingsQuerySchema), getCategoryBreakdown);

// Alerts
router.get('/alerts', getAlerts);

// Forecast
router.get('/forecast', getForecast);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

module.exports = router;
