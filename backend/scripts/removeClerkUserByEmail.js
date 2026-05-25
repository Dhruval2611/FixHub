require('dotenv').config();
const { clerkClient } = require('@clerk/express');

const run = async () => {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error('Usage: node scripts/removeClerkUserByEmail.js <email>');
    process.exit(1);
  }

  const email = String(emailArg).toLowerCase();

  try {
    console.log(`Looking up Clerk users with email ${email}...`);
    // Clerk API supports listing users with query filters. We'll try email_address filter.
    const users = await clerkClient.users.getUserList({ email_address: [email] });

    if (!users || users.length === 0) {
      console.log('No Clerk users found for that email.');
      process.exit(0);
    }

    for (const u of users) {
      console.log(`Deleting Clerk user ${u.id} (${u.emailAddresses?.map(e=>e.emailAddress).join(',')})`);
      try {
        await clerkClient.users.deleteUser(u.id);
        console.log(`Deleted Clerk user ${u.id}`);
      } catch (err) {
        console.error(`Failed to delete Clerk user ${u.id}:`, err);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error querying Clerk:', err);
    process.exit(1);
  }
};

run();
