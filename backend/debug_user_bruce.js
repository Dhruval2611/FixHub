const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: /bruce/i });
    if (user) {
      console.log('USER_DEBUG_START');
      console.log(JSON.stringify({
        name: user.name,
        email: user.email,
        subscription: user.subscription
      }, null, 2));
      console.log('USER_DEBUG_END');
    } else {
      console.log('User not found');
    }
    await mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};
checkUser();
