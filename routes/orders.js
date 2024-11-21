var express = require('express');
var router = express.Router();
var orderSchema = require('../models/order.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');

//GET All Order
router.get('/', tokenMiddleware, async (req, res, next) => {
    try {
        const users = await orderSchema.find({});
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
});
