var express = require('express');
var router = express.Router();
var userSchema = require('../models/user.model');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var dotenv = require('dotenv');

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY;

// POST route for user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        // Find user by username
        const user = await userSchema.findOne({ username: username });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username },
            secretKey,
            { expiresIn: '3h' } // Token expires in 3 hours
        );

        // Set token in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,         // Prevents JavaScript access
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'strict',     // Protects against CSRF
            maxAge: 3 * 60 * 60 * 1000, // Cookie expires in 3 hours
        });

        // Send user details (without token)
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user._id,
                role: user.role,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                image: user.image
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
    }
});

// POST route for user logout
router.post('/logout', (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            secure: process.env.NODE_ENV === 'production', // Only clear if the app is in production
            sameSite: 'strict',     // Same security features as the login cookie
        });

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout failed', error: error.message });
    }
});

module.exports = router;
