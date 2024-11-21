const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String },
    firstname: { type: String },
    lastname: { type: String },
    password: { type: String },
}, {
    timestamps: true
});

module.exports = mongoose.model('users', userSchema);