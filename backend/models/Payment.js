const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    bookingIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
    }],
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Service', 'Card', 'UPI', 'Net Banking', 'Plan Purchase', 'Plan Upgrade'],
        default: 'Cash on Service',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    customerInfo: {
        name: String,
        email: String,
        phone: String,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Payment', paymentSchema);
