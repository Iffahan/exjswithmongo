const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true }, // Reference to the user
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'products', required: true }, // Reference to the product
            quantity: { type: Number, required: true }, // Quantity of this product
            price: { type: Number, required: true }, // Price per unit of this product
        }
    ],
    total_price: { type: Number, required: true }, // Total price of the order
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('orders', orderSchema);
