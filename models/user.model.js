const mongoose = require('mongoose');
const { Schema } = mongoose;
const mongooseSequence = require('mongoose-sequence')(mongoose);

const userSchema = new Schema({
    user_id: { type: Number, unique: true },
    username: { type: String, unique: true },
    firstname: { type: String },
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
        enum: ['member', 'admin'], // changed normal_user to member
        default: 'member', // default role is member
    },
}, {
    timestamps: true
});

// Apply the auto-increment plugin to the `user_id` field
userSchema.plugin(mongooseSequence, { inc_field: 'user_id' });

module.exports = mongoose.model('users', userSchema);
