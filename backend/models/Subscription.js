const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  planName: {
    type: String,
    enum: ['Basic', 'Premium', 'Elite', 'Premium Yearly', 'Elite Yearly'],
    required: true,
  },
  planType: {
    type: String,
    enum: ['new', 'upgrade', 'renewal'],
    default: 'new',
  },
  previousPlan: {
    type: String,
    enum: ['Basic', 'Premium', 'Elite', 'Premium Yearly', 'Elite Yearly'],
  },
  amount: {
    type: Number,
    required: true,
  },
  discountPercentage: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  benefits: {
    discountOnServices: {
      type: Number,
      default: 0,
    },
    priorityBooking: {
      type: Boolean,
      default: false,
    },
    freeEmergencyCallouts: {
      type: Number,
      default: 0,
    },
    supportType: {
      type: String,
      enum: ['email', 'phone', 'concierge'],
      default: 'email',
    },
    warrantyCoverage: {
      type: String,
      enum: ['basic', 'extended', 'lifetime'],
      default: 'basic',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
