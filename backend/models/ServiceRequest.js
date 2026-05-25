const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'vendor_accepted', 'assigned', 'expired'],
    default: 'open',
  },
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
  },
  interestedVendors: [{
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
    name: String,
    businessName: String,
    phone: String,
    rating: Number,
    totalReviews: Number,
    isVerified: Boolean,
    certifications: [String],
    acceptedAt: { type: Date, default: Date.now },
  }],
  respondedVendors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
