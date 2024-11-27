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
router.post('/', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { productId, quantity } = req.body;

        // Validate input
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Invalid product' });
        }
        // Validate input
        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const product = await productSchema.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Find the user's cart
        let cart = await cartSchema.findOne({ user: userId });

        if (!cart) {
            // If cart doesn't exist, create a new one
            cart = new cartSchema({ user: userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

        if (existingItemIndex > -1) {
            // If the product already exists in the cart, update the quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // If the product is not in the cart, add it
            cart.items.push({ product: productId, quantity: quantity });
        }

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
        const { quantity } = req.body;
        const productId = req.params.productId;

        if (!quantity || quantity < 1) {
            return res.status(400).json({ success: false, message: 'Invalid quantity' });
        }

        const cart = await cartSchema.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        // Update the quantity of the item
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
