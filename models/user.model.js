const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: { type: String },
    age: { type: Number },
    password: { type: String },
}, {
    timestamps: true
})

module.exports = mongoose.model('users', userSchema);