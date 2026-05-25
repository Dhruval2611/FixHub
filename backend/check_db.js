const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const users = await User.find();
    console.log('\n--- USERS ---');
    users.forEach(u => {
      console.log(`Name: ${u.name}, Email: ${u.email}`);
      console.log(`Subscription:`, JSON.stringify(u.subscription, null, 2));
      console.log('---');
    });

    const services = await Service.find();
    console.log('\n--- SERVICES ---');
    services.forEach(s => {
      console.log(`Name: ${s.name}, Category: ${s.category}, Price: ${s.price}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

checkDb();
