const userSchema = require('../models/user.model');

const adminCheck = async (req, res, next) => {
    try {
        const user = await userSchema.findById(req.user.id);

        if (user && user.role === 'admin') {
            return next();
        }

        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    } catch (error) {
        return res.status(500).json({ message: 'Error checking admin privileges', error: error.message });
    }
};

module.exports = adminCheck;
