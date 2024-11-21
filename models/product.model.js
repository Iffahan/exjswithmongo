const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    description: { type: String },
}, {
    timestamps: true
})



module.exports = mongoose.model('products', productSchema);