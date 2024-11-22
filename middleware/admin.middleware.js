const userSchema = require('../models/user.model');  // Assuming you have the user model

// Admin Check Middleware
const adminCheck = async (req, res, next) => {
    try {
        // Assuming that the decoded token contains the user's ID
        const user = await userSchema.findById(req.user.id);

        // Check if the user is an admin
        if (user && user.role === 'admin') {
            return next(); // Proceed to the next middleware or route handler
        }

        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error checking admin privileges', error: error.message });
    }
};

module.exports = adminCheck;
