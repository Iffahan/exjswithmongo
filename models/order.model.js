const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true }, // Reference to the user
    products: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'products', required: true }, // Reference to the product
            quantity: { type: Number, required: true },
            price: { type: Number, required: true }, 
        }
    ],
    total_price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('orders', orderSchema);
