const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'users', required: true }, // Reference to the user
    items: [
        {
            product: { type: Schema.Types.ObjectId, ref: 'products', required: true }, // Reference to the product
            quantity: { type: Number, required: true }, // Quantity of the product in the cart
        }
    ],
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model('carts', cartSchema);
