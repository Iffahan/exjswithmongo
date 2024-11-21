var express = require('express');
var router = express.Router();
var orderSchema = require('../models/order.model');
var multer = require('multer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var tokenMiddleware = require('../middleware/token.middleware');
var userSchema = require('../models/user.model')
var productSchema = require('../models/product.model');

//GET All Order
router.get('/', tokenMiddleware, async (req, res, next) => {
    try {
        const orders = await orderSchema.find({});
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
});

router.post('/', tokenMiddleware, async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Validate user
        const user = await userSchema.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const { products } = req.body;
        if (!products || typeof products !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid products format' });
        }

        let totalPrice = 0;
        let outOfStockProducts = [];

        // Transform indexed `products` object into an array
        const productArray = Object.values(products);

        // Validate products and calculate total price
        const productDetails = await Promise.all(
            productArray.map(async (item) => {
                const { productId, quantity } = item;

                if (!productId || !quantity) {
                    throw new Error('Each product must have a productId and quantity');
                }

                const product = await productSchema.findById(productId);
                if (!product) throw new Error(`Product with ID ${productId} not found`);

                if (product.quantity < quantity) {
                    // Collect the name of the out-of-stock product
                    outOfStockProducts.push(product.name);
                } else {
                    const price = product.price * quantity;
                    totalPrice += price;

                    // Deduct stock (optional)
                    product.quantity -= quantity;
                    await product.save();

                    return {
                        product: product._id,
                        quantity: quantity,
                        price: product.price,
                    };
                }
            })
        );

        // If there are out-of-stock products, throw an error with product names
        if (outOfStockProducts.length > 0) {
            const error = new Error('Not enough stock for some products');
            error.statusCode = 400;
            error.outOfStockProducts = outOfStockProducts;
            throw error;
        }

        // Create the order if all products are available
        const order = new orderSchema({
            user: user._id,
            products: productDetails,
            total_price: totalPrice,
        });

        await order.save();
        res.status(201).json({ success: true, data: order });
    } catch (error) {
        // Handle out-of-stock error
        if (error.outOfStockProducts) {
            return res.status(error.statusCode || 400).json({
                success: false,
                message: error.message,
                error: error.outOfStockProducts, // Return the array of product names
            });
        }

        // Handle other errors
        res.status(400).json({ success: false, message: error.message });
    }
});


module.exports = router;
