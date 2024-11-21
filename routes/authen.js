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
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // Return user data along with the token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                userId: user._id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
                token: token,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
    }
});

module.exports = router;
