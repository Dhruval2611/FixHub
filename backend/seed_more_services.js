const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/Service');

const moreServices = [
  // Home Services (2)
  {
    name: 'Advanced Leak Detection',
    description: 'Non-invasive thermal imaging and acoustic detection to locate and isolate hidden plumbing leaks instantly.',
    category: 'Home Services',
    price: 1199,
    duration: 90,
    rating: 4.8
  },
  {
    name: 'Premium Wall Texturing',
    description: 'Custom plastering, Venetian finishes, and high-end textural applications for luxury interior walls.',
    category: 'Home Services',
    price: 2499,
    duration: 360,
    rating: 4.9
  },

  // Car Services (5)
  {
    name: 'Full Paint Correction',
    description: 'Intensive multi-stage compound and polish to completely remove swirl marks, scratches, and oxidation.',
    category: 'Car Services',
    price: 3499,
    duration: 300,
    rating: 4.9
  },
  {
    name: 'Leather Seat Restoration',
    description: 'Deep conditioning, color re-dyeing, and premium UV sealing for worn out or faded luxury leather car seats.',
    category: 'Car Services',
    price: 1299,
    duration: 150,
    rating: 4.8
  },
  {
    name: 'Glass Coating / Rain Repellent',
    description: 'Application of high-end hydrophobic nano-coating on all windows for unbeatable visibility in heavy rain.',
    category: 'Car Services',
    price: 599,
    duration: 45,
    rating: 4.9
  },
  {
    name: 'Undercarriage Rust Protection',
    description: 'Thorough cleaning and application of heavy-duty rust inhibitor to protect your vehicles frame and chassis.',
    category: 'Car Services',
    price: 1499,
    duration: 120,
    rating: 4.7
  },
  {
    name: 'Premium Wheel & Caliper Polish',
    description: 'Acid-free deep clean and ceramic seal for high-performance alloy wheels and painted brake calipers.',
    category: 'Car Services',
    price: 899,
    duration: 90,
    rating: 4.8
  }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected for second seeding run.');
    try {
      await Service.insertMany(moreServices);
      console.log('Successfully seeded ' + moreServices.length + ' additional services!');
      process.exit(0);
    } catch (err) {
      console.error('Seeding error:', err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
