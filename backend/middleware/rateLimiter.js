/**
 * middleware/rateLimiter.js — API rate limiting
 * Restricts each IP to RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS window.
 * Defaults: 100 requests per 15 minutes. Configured via environment variables.
 */
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

// Stricter limit on login attempts to blunt brute-force/credential-guessing.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again later.' }
});

module.exports = apiLimiter;
module.exports.loginLimiter = loginLimiter;
