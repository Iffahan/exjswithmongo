var express = require('express');
var router = express.Router();
var cartSchema = require('../models/cart.model');  // Assuming cart model is created
var userSchema = require('../models/user.model');
var productSchema = require('../models/product.model');
var tokenMiddleware = require('../middleware/token.middleware');
var mongoose = require('mongoose');

// GET /mycart - Get all items in the user's cart
router.get('/me', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id; // Extract user ID from the token

        // Find the user's cart
        const cart = await cartSchema
            .findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price image',  // Include additional fields you might need
            });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
    }
});

// GET a specific cart item by product ID for a user
router.get('/:productId', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const cart = await cartSchema
            .findOne({ user: userId })
            .populate({
                path: 'items.product',
                select: 'name price',
            });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        res.status(200).json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch cart item', error: error.message });
    }
});

// POST add product to cart
router.post('/', tokenMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // Validate input
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        // Check if the product exists
        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find or create the user's cart
        let cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            cart = new cartSchema({ user: userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);

        if (existingItem) {
            // If product exists, update the quantity
            existingItem.quantity += quantity;
        } else {
            // If not, add it as a new item
            cart.items.push({ product: productId, quantity });
        }

        // Save the cart
        await cart.save();

        res.status(201).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add product to cart', error: error.message });
    }
});

// PUT update quantity of a cart item
router.put('/:productId', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { quantity } = req.body; // New absolute quantity value
        const productId = req.params.productId;

        // Validate input
        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        // Find the user's cart
        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Set the quantity to the exact value
        cart.items[itemIndex].quantity = quantity;

        await cart.save();

        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update cart item', error: error.message });
    }
});


// DELETE remove a product from the cart
router.delete('/:productId', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Remove the item from the cart
        cart.items.splice(itemIndex, 1);
        await cart.save();

        res.status(200).json({ success: true, message: 'Product removed from cart', data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to remove product from cart', error: error.message });
    }
});

// DELETE clear the entire cart
router.delete('/', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;

        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Clear all items from the cart
        cart.items = [];
        await cart.save();

        res.status(200).json({ success: true, message: 'Cart cleared', data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to clear cart', error: error.message });
    }
});

module.exports = router;
