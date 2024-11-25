var express = require('express');
var router = express.Router();
var orderSchema = require('../models/order.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');
var adminMiddleware = require('../middleware/admin.middleware');
var userSchema = require('../models/user.model')
var productSchema = require('../models/product.model');
const mongoose = require('mongoose');

//GET All Order
router.get('/', tokenMiddleware, async (req, res, next) => {
    try {
        const { username, productName } = req.query;

        // Build the query
        const query = {};

        if (username) {
            const user = await userSchema.findOne({ username });
            if (user) query.user = user._id;
        }

        if (productName) {
            const product = await productSchema.findOne({ name: productName });
            if (product) query['products.product'] = product._id;
        }

        const orders = await orderSchema
            .find(query)
            .populate({
                path: 'user',
                select: 'username',
            })
            .populate({
                path: 'products.product',
                select: 'name',
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
    }
});

//GET Order by id
router.get('/:id', tokenMiddleware, async (req, res, next) => {
    try {
        const order = await orderSchema
            .findById(req.params.id)
            .populate({
                path: 'user',
                select: 'username',
            })
            .populate({
                path: 'products.product',
                select: 'name',
            });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.status(200).json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
    }
});


// Get Order by username
router.get('/username/:username', tokenMiddleware, async (req, res, next) => {
    try {
        const username = req.params.username;
        const user = await userSchema.findOne({ username });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Ensure the user object contains a valid _id
        const orders = await orderSchema
            .find({ user: user._id }) // Correctly use user._id, which is an ObjectId
            .populate({
                path: 'user',
                select: 'username',
            })
            .populate({
                path: 'products.product',
                select: 'name',
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
    }
});

router.post('/', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Validate user
        const user = await userSchema.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { products } = req.body;
        if (!products || typeof products !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid products format' });
        }

        let totalPrice = 0;
        let outOfStockProducts = [];
        const productArray = Object.values(products);
        const productDetails = [];

        // First, validate all products
        for (const item of productArray) {
            const { productId, quantity } = item;

            if (!productId || !quantity) {
                throw new Error('Each product must have a productId and quantity');
            }

            const product = await productSchema.findById(productId);
            if (!product) {
                throw new Error(`Product with ID ${productId} not found`);
            }

            if (typeof quantity !== 'number' || quantity < 1) {
                throw new Error(`Invalid quantity for product ID ${productId}: Quantity must be a positive number`);
            }

            if (product.quantity < quantity) {
                outOfStockProducts.push(product.name);
            } else {
                // Prepare product details without updating stock yet
                productDetails.push({
                    product: product._id,
                    quantity: quantity,
                    price: product.price,
                });
                totalPrice += product.price * quantity;
            }
        }

        // If any product is out of stock, return an error
        if (outOfStockProducts.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock for some products',
                error: outOfStockProducts, // Return the array of product names
            });
        }

        // Deduct stock only after all validations are successful
        for (const item of productArray) {
            const { productId, quantity } = item;
            const product = await productSchema.findById(productId);
            product.quantity -= quantity;
            await product.save();
        }

        // Create the order
        const order = new orderSchema({
            user: user._id,
            products: productDetails,
            total_price: totalPrice,
        });

        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

//PUT update status by admin
router.put('/:id', [tokenMiddleware, adminMiddleware], async (req, res, next) => {
    try {
        const { status } = req.body;
        const order = await orderSchema.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Order is already completed' });
        }
        if (order.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Order is already cancelled' });
        }
        if (status === 'cancelled') {
            order.status = 'cancelled';
            await order.save();
            return res.status(200).json({ success: true, message: 'Order cancelled successfully' });
        }
        if (status === 'completed') {
            order.status = 'completed';
            await order.save();
            return res.status(200).json({ success: true, message: 'Order completed successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
    }
});

//Canclel order by user
router.put('/cancel/:id', tokenMiddleware, async (req, res, next) => {
    // Ensure the user data is available in req.user
    const userId = req.user.id.toString();  // Ensure _id from the decoded token is being used
    const orderId = req.params.id;
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID format' });
    }

    // Find the order by ID
    const order = await orderSchema.findById(req.params.id);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check if the order belongs to the authenticated user
    if (order.user.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'You are not authorized to cancel this order' });
    }

    try {
        // Update the order status to 'cancelled'
        const updatedOrder = await orderSchema.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
    }
});

//Delete order by admin
router.delete('/:id', [tokenMiddleware, adminMiddleware], async (req, res, next) => {
    try {
        const order = await orderSchema.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.status(200).json({ success: true, data: order });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete order', error: error.message });
    }
});


module.exports = router;
