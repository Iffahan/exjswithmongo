const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSchema = new Schema({
    user_id: { type: Number, unique: true },
    username: { type: String, unique: true },
    firstname: { type: String },
    email: { type: String, unique: true },
    lastname: { type: String },
    password: { type: String },
    age: {
        type: Number,
        min: 7,
        max: 120,
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
    },
    role: {
        type: String,
        enum: ['member', 'admin'],
        default: 'member',
    },
}, {
    timestamps: true
});

userSchema.plugin(mongooseSequence, { inc_field: 'user_id' });

module.exports = mongoose.model('users', userSchema);
