const mongoose = require('mongoose');
const User = require('./models/User');
const Payment = require('./models/Payment');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkPayments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const payments = await Payment.find().sort({ createdAt: -1 }).limit(5);
    console.log('PAYMENTS_DEBUG_START');
    console.log(JSON.stringify(payments, null, 2));
    console.log('PAYMENTS_DEBUG_END');
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};
checkPayments();
