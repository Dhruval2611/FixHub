const ServiceRequest = require('../models/ServiceRequest');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');

// Get matching service requests for vendor
const getRequests = async (req, res) => {
  try {
    const vendor = req.vendor;

    const requests = await ServiceRequest.find({
      status: { $in: ['open', 'vendor_accepted'] },
      category: { $regex: new RegExp(vendor.serviceCategory, 'i') },
      respondedVendors: { $nin: [vendor._id] },
      'interestedVendors.vendorId': { $ne: vendor._id },
    })
      .populate('user', 'name email phone')
      .populate('service', 'name price icon category')
      .populate('booking', 'date time address notes status')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching vendor requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept a service request — multi-vendor flow: multiple vendors can express interest
const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = req.vendor;

    // Find the request — must be open or already have other interested vendors
    const request = await ServiceRequest.findOne({
      _id: id,
      status: { $in: ['open', 'vendor_accepted'] },
    });

    if (!request) {
      return res.status(409).json({ message: 'This request is no longer available.' });
    }

    // Check if vendor already expressed interest
    const alreadyInterested = request.interestedVendors.some(
      v => v.vendorId.toString() === vendor._id.toString()
    );
    if (alreadyInterested) {
      return res.status(400).json({ message: 'You have already accepted this request.' });
    }

    // Push vendor into interestedVendors array
    const vendorEntry = {
      vendorId: vendor._id,
      name: vendor.name,
      businessName: vendor.businessName,
      phone: vendor.phone,
      rating: vendor.rating || 0,
      totalReviews: vendor.totalReviews || 0,
      isVerified: vendor.isVerified || false,
      certifications: vendor.certifications || [],
      acceptedAt: new Date(),
    };

    request.interestedVendors.push(vendorEntry);
    request.status = 'vendor_accepted'; // At least one vendor interested
    await request.save();

    // Update the booking to reflect vendor interest (keep as pending until user selects)
    await Booking.findByIdAndUpdate(request.booking, {
      vendorStatus: 'vendor_accepted',
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      // Notify the user that another vendor is interested
      io.to(`user:${request.user}`).emit('vendor-interested', {
        bookingId: request.booking,
        requestId: request._id,
        vendor: vendorEntry,
        totalInterested: request.interestedVendors.length,
      });

      // Notify admin
      io.to('admin-room').emit('booking-update', {
        bookingId: request.booking,
        status: 'vendor_accepted',
        vendorName: vendor.businessName,
        totalInterested: request.interestedVendors.length,
      });
    }

    res.json({
      message: 'Interest expressed! Waiting for customer to select you.',
      request,
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject a service request
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = req.vendor;

    const request = await ServiceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'open') {
      return res.status(400).json({ message: 'This request is no longer open.' });
    }

    // Add vendor to responded list
    if (!request.respondedVendors.includes(vendor._id)) {
      request.respondedVendors.push(vendor._id);
      await request.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('vendor-rejected', {
        requestId: request._id,
        vendorName: vendor.businessName,
      });
    }

    res.json({ message: 'Request rejected.' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get vendor's assigned jobs (interested + confirmed)
const getJobs = async (req, res) => {
  try {
    const vendor = req.vendor;

    const jobs = await ServiceRequest.find({
      $or: [
        { 'interestedVendors.vendorId': vendor._id, status: 'vendor_accepted' },
        { assignedVendor: vendor._id, status: 'assigned' },
      ],
    })
      .populate('user', 'name email phone')
      .populate('service', 'name price icon category')
      .populate('booking', 'date time address notes status vendorStatus userAccepted vendorFeedback')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching vendor jobs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark job as completed
const completeJob = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = req.vendor;

    const request = await ServiceRequest.findOne({
      _id: id,
      assignedVendor: vendor._id,
      status: 'assigned',
    }).populate('user', 'name email')
      .populate('service', 'name price')
      .populate('booking');

    if (!request) {
      return res.status(404).json({ message: 'Job not found or not assigned to you.' });
    }

    // Update booking
    await Booking.findByIdAndUpdate(request.booking._id, {
      vendorStatus: 'completed',
      status: 'completed',
    });

    // Emit socket events
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${request.user._id}`).emit('job-completed', {
        bookingId: request.booking._id,
        vendorName: vendor.name,
        vendorBusinessName: vendor.businessName,
        serviceName: request.service?.name,
      });

      io.to('admin-room').emit('booking-update', {
        bookingId: request.booking._id,
        status: 'completed',
        vendorName: vendor.businessName,
      });
    }

    res.json({ message: 'Job marked as completed!' });
  } catch (error) {
    console.error('Error completing job:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const vendor = req.vendor;

    const [totalRequests, acceptedJobs, completedJobs] = await Promise.all([
      ServiceRequest.countDocuments({
        status: 'open',
        category: { $regex: new RegExp(vendor.serviceCategory, 'i') },
        respondedVendors: { $nin: [vendor._id] },
      }),
      ServiceRequest.countDocuments({
        assignedVendor: vendor._id,
        status: { $in: ['vendor_accepted', 'assigned'] },
      }),
      Booking.countDocuments({
        assignedVendor: vendor._id,
        vendorStatus: 'completed',
      }),
    ]);

    res.json({
      totalRequests,
      acceptedJobs,
      completedJobs,
      rating: vendor.rating || 0,
      totalReviews: vendor.totalReviews || 0,
    });
  } catch (error) {
    console.error('Error fetching vendor dashboard stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getRequests,
  acceptRequest,
  rejectRequest,
  getJobs,
  completeJob,
  getDashboardStats,
};
