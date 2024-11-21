var express = require('express');
var router = express.Router();
var productSchema = require('../models/product.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');

//create product
router.post('/', tokenMiddleware, async function (req, res, next) {

    const { name, price, quantity, description } = req.body;
    if (!name || !price || !quantity) {
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }

    try {
        const product = await productSchema.create({
            name,
            price,
            quantity,
            description
        });
        return res.status(200).json({
            message: 'Product created successfully',
            product
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
});

//get all products
router.get('/', tokenMiddleware, async function (req, res, next) {
    try {
        const products = await productSchema.find();
        return res.status(200).json({
            message: 'Products fetched successfully',
            products
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
});

//get product by id
router.get('/:id', tokenMiddleware, async function (req, res, next) {

    if (!req.params.id) {
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }

    try {
        const product = await productSchema.findById(req.params.id);
        return res.status(200).json({
            message: 'Product fetched successfully',
            product
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
});

//update product by id 
router.put('/:id', tokenMiddleware, async function (req, res, next) {
    if (!req.params.id) {
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }

    const { name, price, quantity } = req.body;

    if (!name || !price || !quantity || !description) {
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }
    try {
        const product = await productSchema.findByIdAndUpdate(req.params.id, {
            name,
            price,
            quantity,
            description
        }, { new: true });
        return res.status(200).json({
            message: 'Product updated successfully',
            product
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
});

//deele product by id
router.delete('/:id', tokenMiddleware, async function (req, res, next) {
    if (!req.params.id) {
        return res.status(400).json({
            message: 'Missing required fields'
        })
    }
    try {
        const product = await productSchema.findByIdAndDelete(req.params.id);
        return res.status(200).json({
            message: 'Product deleted successfully',
            product
        })
    } catch (error) {
        return res.status(500).json({
            message: 'Internal server error'
        })
    }
});

module.exports = router;
