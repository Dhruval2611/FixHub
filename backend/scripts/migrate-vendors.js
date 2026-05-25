const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const col = db.collection('servicerequests');

  // Find all service requests that have old acceptedVendorDetails but empty/missing interestedVendors
  const docs = await col.find({
    status: { $in: ['vendor_accepted', 'assigned'] },
  }).toArray();

  console.log('Found', docs.length, 'service requests with vendor_accepted/assigned status');

  let migrated = 0;
  for (const doc of docs) {
    const hasOldData = doc.acceptedVendorDetails && doc.acceptedVendorDetails.vendorId;
    const hasNewData = doc.interestedVendors && doc.interestedVendors.length > 0;

    console.log('---');
    console.log('ID:', doc._id, '| Status:', doc.status);
    console.log('  assignedVendor:', doc.assignedVendor);
    console.log('  Old acceptedVendorDetails:', hasOldData ? JSON.stringify(doc.acceptedVendorDetails) : 'EMPTY');
    console.log('  New interestedVendors count:', doc.interestedVendors ? doc.interestedVendors.length : 0);

    if (hasOldData && !hasNewData) {
      // Migrate old data to new format
      const vendorEntry = {
        vendorId: doc.acceptedVendorDetails.vendorId,
        name: doc.acceptedVendorDetails.name || '',
        businessName: doc.acceptedVendorDetails.businessName || '',
        phone: doc.acceptedVendorDetails.phone || '',
        rating: doc.acceptedVendorDetails.rating || 0,
        totalReviews: doc.acceptedVendorDetails.totalReviews || 0,
        isVerified: doc.acceptedVendorDetails.isVerified || false,
        certifications: doc.acceptedVendorDetails.certifications || [],
        acceptedAt: doc.updatedAt || new Date(),
      };

      await col.updateOne(
        { _id: doc._id },
        { $set: { interestedVendors: [vendorEntry] } }
      );
      console.log('  ✅ MIGRATED to interestedVendors');
      migrated++;
    } else if (hasNewData) {
      console.log('  Already has interestedVendors, skipping');
    } else {
      console.log('  No vendor data to migrate');
    }
  }

  console.log('\n=== Migration complete:', migrated, 'records updated ===');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
