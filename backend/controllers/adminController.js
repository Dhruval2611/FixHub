const User = require('../models/User');
const { clerkClient } = require('@clerk/express');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const { sendBookingConfirmedEmail, sendSubscriptionCancelledEmail, sendSubscriptionExtendedEmail } = require('../utils/emailService');
const logToFile = require('../utils/fileLogger');

// Get Admin Stats
exports.getStats = async (req, res) => {
    try {
        // Count only regular users, exclude admins
        const totalUsers = await User.countDocuments({ role: 'user' });
        const totalServices = await Service.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });

        // Get recent bookings with user and service details
        const recentBookings = await Booking.find()
            .populate('user', 'name email')
            .populate('service', 'name')
            .sort({ createdAt: -1 })
            .limit(5);

        const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

        res.json({
            totalUsers,
            totalServices,
            totalBookings,
            pendingBookings,
            activeSubscriptions,
            recentBookings
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Users
exports.getAllUsers = async (req, res) => {
    try {
        // Only get users with role 'user', exclude admins
        const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update User
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // If email is being updated, normalize and ensure it's not already used by another user
        if (updates.email) {
            const newEmail = String(updates.email).toLowerCase();
            const existing = await User.findOne({ email: newEmail, _id: { $ne: userId } });
            if (existing) {
                return res.status(400).json({ message: 'Email is already used by another account' });
            }
            updates.email = newEmail;
        }

        const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete User
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If the user has a Clerk identity, attempt to remove it from Clerk as well
        if (user.clerkId) {
            try {
                await clerkClient.users.deleteUser(user.clerkId);
            } catch (clerkErr) {
                console.error('Failed to delete Clerk user:', clerkErr);
                // don't block deletion of local DB user, but warn the admin
            }
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Export Users as CSV
exports.exportUsersCSV = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });

        const csvHeader = 'Name,Email,Phone,Joined Date\n';
        const csvRows = users.map(u => {
            const name = (u.name || 'Unknown').replace(/,/g, ' ');
            const email = u.email || 'N/A';
            const phone = u.phone || 'N/A';
            const joined = u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A';
            return `"${name}","${email}","${phone}","${joined}"`;
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting users CSV:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Services
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create Service
exports.createService = async (req, res) => {
    try {
        const { shareWithUsers, ...serviceData } = req.body;
        const service = new Service(serviceData);
        await service.save();

        if (shareWithUsers) {
            const Newsletter = require('../models/Newsletter');
            const { sendNewServicePromoEmail } = require('../utils/emailService');

            try {
                const users = await User.find({ role: 'user' }).select('email');
                const subscribers = await Newsletter.find().select('email');

                const emailSet = new Set();
                users.forEach(u => u.email && emailSet.add(u.email));
                subscribers.forEach(s => s.email && emailSet.add(s.email));

                const bccList = Array.from(emailSet);

                if (bccList.length > 0) {
                    sendNewServicePromoEmail(bccList, service).catch(err => {
                        console.error('Error async sending promo emails:', err);
                    });
                }
            } catch (innerErr) {
                console.error("Error generating broadcast list:", innerErr);
            }
        }

        res.status(201).json(service);
    } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Service
exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findByIdAndUpdate(serviceId, req.body, { new: true });

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json(service);
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Service
exports.deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findByIdAndDelete(serviceId);

        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get All Bookings
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('service', 'name price')
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Booking
exports.updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const updates = { ...req.body };

        // If admin is changing the status, mark it unseen for the user
        if (updates.status) {
            updates.statusSeen = false;
        }

        const booking = await Booking.findByIdAndUpdate(bookingId, updates, { new: true })
            .populate('user', 'name email')
            .populate('service', 'name price');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json(booking);

        // If admin just confirmed the booking, fire a confirmation email
        if (updates.status === 'confirmed' && booking.user?.email) {
            try {
                const customerEmail = booking.user.email;
                const customerName = booking.user.name || 'Customer';

                logToFile(`Admin confirmed booking ${bookingId}. Preparing email to ${customerEmail}`);

                const payment = booking.paymentId
                    ? await Payment.findById(booking.paymentId)
                    : null;
                
                sendBookingConfirmedEmail({
                    email: customerEmail,
                    name: customerName,
                    paymentId: booking.paymentId,
                    bookings: [{
                        name: booking.service?.name || 'Service',
                        date: booking.date,
                        time: booking.time,
                        price: booking.service?.price || '',
                        address: booking.address,
                    }],
                    transactionId: payment?.transactionId || 'N/A',
                    paymentMethod: payment?.paymentMethod || 'N/A',
                    amount: payment?.amount || '',
                    confirmedAt: new Date(),
                }).then(() => {
                    logToFile(`✅ Confirmed email successfully sent to ${customerEmail} for booking ${bookingId}`);
                }).catch(err => {
                    logToFile(`❌ Error sending confirmed email to ${customerEmail}:`, err);
                    console.error('Confirmed email error:', err);
                });
            } catch (emailErr) {
                logToFile(`❌ Error preparing confirmed email for booking ${bookingId}:`, emailErr);
                console.error('Error preparing confirmed email:', emailErr);
            }
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete Booking
exports.deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findByIdAndDelete(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get count of new (admin-unseen) bookings
exports.getNewBookingsCount = async (req, res) => {
    try {
        const count = await Booking.countDocuments({ adminSeen: false });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching new bookings count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark all bookings as admin-seen
exports.markBookingsAdminSeen = async (req, res) => {
    try {
        await Booking.updateMany({ adminSeen: false }, { adminSeen: true });
        res.json({ message: 'All bookings marked as seen by admin' });
    } catch (error) {
        console.error('Error marking bookings admin seen:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Subscriptions (paginated, filtered, searchable)
exports.getSubscriptions = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
        const skip = (page - 1) * limit;
        const { planFilter, statusFilter, search } = req.query;

        // Build filter
        const filter = {};
        if (planFilter && planFilter !== 'all') {
            filter.planName = planFilter;
        }
        if (statusFilter && statusFilter !== 'all') {
            filter.status = statusFilter;
        } else {
            // Hide cancelled subscriptions from the 'all' view
            filter.status = { $ne: 'cancelled' };
        }

        // If search is provided, we need to find matching user IDs first
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const matchingUsers = await User.find({
                $or: [
                    { name: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id');
            filter.user = { $in: matchingUsers.map(u => u._id) };
        }

        const totalCount = await Subscription.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        const subscriptions = await Subscription.find(filter)
            .populate('user', 'name email phone profilePicture')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            subscriptions,
            totalCount,
            page,
            totalPages,
            limit
        });
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Subscription Stats
exports.getSubscriptionStats = async (req, res) => {
    try {
        const [totalActive, totalExpired, planBreakdown] = await Promise.all([
            Subscription.countDocuments({ status: 'active' }),
            Subscription.countDocuments({ status: 'expired' }),
            Subscription.aggregate([
                { $match: { status: 'active' } },
                { $group: { _id: '$planName', count: { $sum: 1 }, revenue: { $sum: '$amount' } } }
            ])
        ]);

        const totalRevenue = await Subscription.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalActive,
            totalExpired,
            totalRevenue: totalRevenue[0]?.total || 0,
            planBreakdown: planBreakdown.reduce((acc, item) => {
                acc[item._id] = { count: item.count, revenue: item.revenue };
                return acc;
            }, {})
        });
    } catch (error) {
        console.error('Error fetching subscription stats:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin Cancel Subscription
exports.adminCancelSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { reason } = req.body;

        const subscription = await Subscription.findById(subscriptionId).populate('user', 'name email');
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }
        if (subscription.status !== 'active') {
            return res.status(400).json({ message: 'Subscription is not active' });
        }

        // Delete the Subscription record entirely based on user request ("it should be removed")
        await Subscription.findByIdAndDelete(subscriptionId);
        // Revert user's plan to Basic
        const user = await User.findById(subscription.user._id);
        if (user) {
            user.subscription = {
                planName: 'Basic',
                planStatus: 'active',
                planStartDate: null,
                planExpiryDate: null,
                planPrice: 0,
            };
            user.subscriptionCancelReason = reason || 'Cancelled by admin';
            await user.save();

            // Send cancellation email
            sendSubscriptionCancelledEmail(user.email, user.name, subscription.planName, reason || 'Cancelled by admin').catch(() => {});
        }

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin Extend Subscription
exports.adminExtendSubscription = async (req, res) => {
    try {
        const { subscriptionId } = req.params;
        const { days } = req.body;

        if (!days || days < 1 || days > 365) {
            return res.status(400).json({ message: 'Days must be between 1 and 365' });
        }

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        // Extend the expiry date
        const currentExpiry = new Date(subscription.expiryDate);
        const now = new Date();
        const baseDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

        subscription.expiryDate = newExpiry;
        if (subscription.status === 'expired') {
            subscription.status = 'active';
        }
        await subscription.save();

        // Update user's plan expiry too
        const user = await User.findById(subscription.user);
        if (user && user.subscription) {
            user.subscription.planExpiryDate = newExpiry;
            if (user.subscription.planStatus === 'expired') {
                user.subscription.planStatus = 'active';
            }
            await user.save();
            
            // Send confirmation email to the user
            sendSubscriptionExtendedEmail(user.email, user.name, subscription.planName, days, newExpiry).catch(() => {});
        }

        res.json({ message: `Subscription extended by ${days} days`, newExpiry });
    } catch (error) {
        console.error('Error extending subscription:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Export Subscriptions as CSV
exports.exportSubscriptionsCSV = async (req, res) => {
    try {
        const subscriptions = await Subscription.find({ status: { $ne: 'cancelled' } })
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 });

        const csvHeader = 'User Name,Email,Phone,Plan,Type,Amount,Status,Discount %,Start Date,Expiry Date,Created At\n';
        const csvRows = subscriptions.map(sub => {
            const userName = (sub.user?.name || 'Deleted User').replace(/,/g, ' ');
            const email = sub.user?.email || 'N/A';
            const phone = sub.user?.phone || 'N/A';
            const plan = sub.planName;
            const type = sub.planType || 'new';
            const amount = sub.amount;
            const status = sub.status;
            const discount = sub.discountPercentage || 0;
            const startDate = sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-IN') : 'N/A';
            const expiryDate = sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-IN') : 'N/A';
            const createdAt = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-IN') : 'N/A';
            return `"${userName}","${email}","${phone}","${plan}","${type}",${amount},"${status}",${discount},"${startDate}","${expiryDate}","${createdAt}"`;
        }).join('\n');

        const csv = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subscriptions_export.csv');
        res.send(csv);
    } catch (error) {
        console.error('Error exporting subscriptions CSV:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============ VENDOR MANAGEMENT ============

const Vendor = require('../models/Vendor');

// Get All Vendors
exports.getAllVendors = async (req, res) => {
    try {
        const { status, search } = req.query;
        const filter = {};

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { name: searchRegex },
                { businessName: searchRegex },
                { email: searchRegex },
            ];
        }

        const vendors = await Vendor.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Approve Vendor
exports.approveVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const vendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { status: 'approved', rejectionReason: '' },
            { new: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.to(`vendor:${vendor._id}`).emit('status-update', { status: 'approved' });
        }

        res.json({ message: 'Vendor approved successfully', vendor });
    } catch (error) {
        console.error('Error approving vendor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Reject Vendor
exports.rejectVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { reason } = req.body;

        const vendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { status: 'rejected', rejectionReason: reason || 'Application rejected by admin' },
            { new: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`vendor:${vendor._id}`).emit('status-update', { status: 'rejected', reason: vendor.rejectionReason });
        }

        res.json({ message: 'Vendor rejected', vendor });
    } catch (error) {
        console.error('Error rejecting vendor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Block Vendor
exports.blockVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const vendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { status: 'blocked' },
            { new: true }
        ).select('-password');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`vendor:${vendor._id}`).emit('status-update', { status: 'blocked' });
        }

        res.json({ message: 'Vendor blocked', vendor });
    } catch (error) {
        console.error('Error blocking vendor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get Vendor Documents
exports.getVendorDocuments = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const vendor = await Vendor.findById(vendorId).select('name businessName idProof businessCertificate');

        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        res.json({
            name: vendor.name,
            businessName: vendor.businessName,
            idProof: vendor.idProof,
            businessCertificate: vendor.businessCertificate,
        });
    } catch (error) {
        console.error('Error fetching vendor documents:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
