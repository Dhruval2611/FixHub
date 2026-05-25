const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  businessName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'vendor',
    enum: ['vendor'],
  },
  serviceCategory: {
    type: String,
    required: true,
    enum: ['Electrician', 'AC Technician', 'Plumber', 'Mechanic', 'Home Cleaner', 'Sofa Cleaner', 'Home Painter'],
  },
  location: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: 'pending',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  idProof: {
    type: String,
    default: '',
  },
  businessCertificate: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  certifications: {
    type: [String],
    default: [],
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Vendor', vendorSchema);
