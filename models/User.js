const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: String,
    role: {
        type: String,
        enum: ['staff', 'student'],
        required: true,
        default: 'student'
    }
});

module.exports = mongoose.model('User', userSchema);
