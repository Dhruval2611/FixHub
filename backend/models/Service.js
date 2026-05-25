const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Electrician', 'AC Technician', 'Plumber', 'Mechanic', 'Home Cleaner', 'Sofa Cleaner', 'Home Painter'],
  },
  icon: {
    type: String,
    default: '🛠️',
  },
  rating: {
    type: Number,
    default: 4.5,
  },
  duration: {
    type: String,
    default: 'Flexible',
  },
  inclusions: {
    type: [String],
    default: [],
  },
  highlights: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Service', serviceSchema);
