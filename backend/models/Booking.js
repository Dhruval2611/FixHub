const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  statusSeen: {
    type: Boolean,
    default: true,
  },
  adminSeen: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  assignedVendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    default: null,
  },
  vendorStatus: {
    type: String,
    enum: ['unassigned', 'vendor_accepted', 'assigned', 'in_progress', 'completed'],
    default: 'unassigned',
  },
  userAccepted: {
    type: Boolean,
    default: false,
  },
  vendorFeedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String, default: '' },
    createdAt: { type: Date },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Booking', bookingSchema);
