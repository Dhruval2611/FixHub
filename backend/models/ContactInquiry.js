const mongoose = require('mongoose');

const contactInquirySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  adminReply: {
    type: String,
    default: null
  },
  repliedAt: {
    type: Date,
    default: null
  },
  replySeen: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ContactInquiry', contactInquirySchema);
