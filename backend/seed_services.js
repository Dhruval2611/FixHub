const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./models/Service');

const newServices = [
  // Home Services
  {
    name: 'Premium Furniture Assembly',
    description: 'Expert assembly of all furniture types with a 100% satisfaction guarantee and no-damage promise.',
    category: 'Home Services',
    price: 899,
    duration: 120, // 2 hours
    rating: 4.8
  },
  {
    name: 'Smart Home Installation',
    description: 'Complete setup and integration of smart locks, thermostats, cameras, and lighting systems.',
    category: 'Home Services',
    price: 1499,
    duration: 180,
    rating: 4.9
  },
  {
    name: 'HVAC Diagnostics & Repair',
    description: 'Advanced troubleshooting and certified repairs for all residential heating and cooling systems.',
    category: 'Home Services',
    price: 1299,
    duration: 90,
    rating: 4.7
  },
  {
    name: 'Luxury Flooring Polish',
    description: 'Deep cleaning, buffing, and sealing for hardwood and premium tile floors to restore showroom shine.',
    category: 'Home Services',
    price: 1999,
    duration: 240,
    rating: 4.9
  },

  // Car Services
  {
    name: 'Ceramic Coating Package',
    description: 'Multi-layer hydrophobic ceramic coating offering years of unbeatable paint protection and shine.',
    category: 'Car Services',
    price: 4999,
    duration: 360,
    rating: 5.0
  },
  {
    name: 'Interior Odor Eradication',
    description: 'Ozone treatment and deep steam cleaning that permanently destroys smoke, pet, and mildew smells.',
    category: 'Car Services',
    price: 899,
    duration: 120,
    rating: 4.8
  },
  {
    name: 'Engine Bay Detailing',
    description: 'Meticulous grease removal and conditioning of engine bay components for a factory-new appearance.',
    category: 'Car Services',
    price: 699,
    duration: 60,
    rating: 4.7
  },
  {
    name: 'Headlight Restoration',
    description: 'Three-stage sanding, polishing, and UV sealing to restore perfect clarity to yellowed headlights.',
    category: 'Car Services',
    price: 499,
    duration: 45,
    rating: 4.9
  }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB connected for seeding.');
    try {
      await Service.insertMany(newServices);
      console.log('Successfully seeded ' + newServices.length + ' new services!');
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
