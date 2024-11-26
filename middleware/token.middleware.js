const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY;

const authenticateJWT = (req, res, next) => {
    // Retrieve the token from cookies
    const token = req.cookies.token; // Requires cookie-parser middleware

    if (!token) {
        return res.status(403).json({ message: 'Access denied. No token provided.' });
    }

    // Verify the token
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token is invalid or expired.' });
        }

        // Attach the decoded user information to the request object
        req.user = decoded;

        next();
    });
};

module.exports = authenticateJWT;
