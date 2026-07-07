/**
 * controllers/authController.js — Admin login
 * Verifies credentials against ADMIN_USERNAME / ADMIN_PASSWORD_HASH (bcrypt) from env
 * and issues a signed JWT on success. No credentials are ever stored in source control.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function login(req, res) {
    const { username, password } = req.validatedBody;

    try {
        const usernameMatches = username === process.env.ADMIN_USERNAME;
        const passwordMatches = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');

        if (!usernameMatches || !passwordMatches) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { sub: username, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
        );

        res.json({ token, expiresIn: process.env.JWT_EXPIRES_IN || '2h' });
    } catch (err) {
        console.error('login error:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { login };
