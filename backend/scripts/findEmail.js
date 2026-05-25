require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
let Newsletter;
try { Newsletter = require('../models/Newsletter'); } catch (e) { Newsletter = null; }

const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const run = async () => {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('Usage: node scripts/findEmail.js <email>');
    process.exit(1);
  }

  const email = String(emailArg).toLowerCase();
  const regex = new RegExp('^' + escapeRegex(email) + '$', 'i');

  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log(`Searching for email: ${email}`);

  const users = await User.find({ email: { $regex: regex } });
  console.log(`Users found: ${users.length}`);
  users.forEach(u => console.log(JSON.stringify({ id: u._id, email: u.email, name: u.name, clerkId: u.clerkId, createdAt: u.createdAt }, null, 2)));

  if (Newsletter) {
    const subs = await Newsletter.find({ email: { $regex: regex } });
    console.log(`Newsletter records found: ${subs.length}`);
    subs.forEach(s => console.log(JSON.stringify(s, null, 2)));
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
