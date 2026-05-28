/**
 * middleware/validate.js — Joi input validation schemas and middleware factories
 * validateQuery wraps GET query params; validateBody wraps POST request bodies.
 * Returns HTTP 400 with a descriptive message on validation failure.
 */
const Joi = require('joi');

const readingsQuerySchema = Joi.object({
    location_id: Joi.number().integer().positive().required(),
    from: Joi.date().iso().required(),
    to: Joi.date().iso().min(Joi.ref('from')).required(),
    pollutant: Joi.string().valid('aqi', 'pm25', 'pm10', 'co', 'no2', 'so2', 'o3').default('aqi')
});

const locationSchema = Joi.object({
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).optional(),
    country: Joi.string().max(100).default('India'),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional()
});

function validateQuery(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query);
        if (error) return res.status(400).json({ error: error.details[0].message });
        req.validatedQuery = value;
        next();
    };
}

function validateBody(schema) {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });
        req.validatedBody = value;
        next();
    };
}

module.exports = { readingsQuerySchema, locationSchema, validateQuery, validateBody };
