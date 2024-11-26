const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    product_id: { type: String },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    description: { type: String },
    image: { type: String },
}, {
    timestamps: true
})



module.exports = mongoose.model('products', productSchema);