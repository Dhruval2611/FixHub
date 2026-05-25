const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'Axitpatel890@gmail.com';
    const normalizedEmail = email && String(email).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    user.role = 'admin';
    await user.save();
    console.log(`${email} is now an admin.`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

makeAdmin();
