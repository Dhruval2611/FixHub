require('dotenv').config();
const { clerkClient } = require('@clerk/express');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust if path is different

async function clearUser(email) {
  if (!email) {
    console.error('Please provide an email address.');
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase();
  console.log(`Starting cleanup for: ${normalizedEmail}`);

  let hasErrors = false;

  try {
    // 1. Delete from Clerk
    console.log('Searching Clerk for user...');
    
    // Using Clerk backend API to list users by email
    const users = await clerkClient.users.getUserList({
      emailAddress: [normalizedEmail]
    });

    if (users.data && users.data.length > 0) {
      for (const clerkUser of users.data) {
        console.log(`Found Clerk user with ID: ${clerkUser.id}. Deleting...`);
        await clerkClient.users.deleteUser(clerkUser.id);
        console.log(`✅ Deleted user ${clerkUser.id} from Clerk.`);
      }
    } else {
      console.log('User not found in Clerk.');
    }
  } catch (error) {
    console.error('❌ Error hitting Clerk API:', error);
    hasErrors = true;
  }

  try {
    // 2. Delete from MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Searching MongoDB for user...');
    const dbUser = await User.findOne({ email: normalizedEmail });
    
    if (dbUser) {
      console.log(`Found MongoDB user with ID: ${dbUser._id}. Deleting...`);
      await User.deleteOne({ email: normalizedEmail });
      console.log(`✅ Deleted user from MongoDB.`);
    } else {
      console.log('User not found in MongoDB.');
    }
  } catch (error) {
    console.error('❌ Error handling MongoDB:', error);
    hasErrors = true;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }

  if (!hasErrors) {
    console.log(`\n🎉 Successfully freed up the email: ${normalizedEmail}`);
  } else {
    console.log(`\n⚠️ Finished with some errors.`);
  }
  process.exit(hasErrors ? 1 : 0);
}

const args = process.argv.slice(2);
clearUser(args[0]);
