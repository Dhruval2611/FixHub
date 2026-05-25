const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  clerkId: {
    type: String,
    sparse: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
  smsReminders: {
    type: Boolean,
    default: true,
  },
  marketingEmails: {
    type: Boolean,
    default: false,
  },
  resetOtp: {
    type: String,
  },
  resetOtpExpiry: {
    type: Date,
  },
  deleteOtp: {
    type: String,
  },
  deleteOtpExpiry: {
    type: Date,
  },
  subscriptionOtp: {
    type: String,
  },
  subscriptionOtpExpiry: {
    type: Date,
  },
  subscriptionCancelReason: {
    type: String,
  },
  hasUsedTrial: {
    type: Boolean,
    default: false,
  },
  purchasedServices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  }],
  // Subscription fields
  subscription: {
    planName: {
      type: String,
      enum: ['Basic', 'Premium', 'Elite', 'Premium Yearly', 'Elite Yearly'],
      default: 'Basic',
    },
    planStatus: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    planStartDate: {
      type: Date,
    },
    planExpiryDate: {
      type: Date,
    },
    planPrice: {
      type: Number,
      default: 0,
    },
    trialEndDate: {
      type: Date,
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
