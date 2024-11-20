const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        let token = req.headers.authorization
        if (!token) {
            return res.status(401).json({
                message: 'No token provided'
            })
        }
        req.auth = token
        next()
    }
    catch (error) {
        return res.status(500).json({
            message: 'Auth failed'
        })
    }
}