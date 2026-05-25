const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// All routes require authentication
// Admin check is done in the controller

// Dashboard Stats
router.get('/stats', auth, adminController.getStats);

// User Management
router.get('/users', auth, adminController.getAllUsers);
router.put('/users/:userId', auth, adminController.updateUser);
router.delete('/users/:userId', auth, adminController.deleteUser);
router.get('/users/export-csv', auth, adminController.exportUsersCSV);

// Service Management
router.get('/services', auth, adminController.getAllServices);
router.post('/services', auth, adminController.createService);
router.put('/services/:serviceId', auth, adminController.updateService);
router.delete('/services/:serviceId', auth, adminController.deleteService);

// Booking Management
router.get('/bookings', auth, adminController.getAllBookings);
router.get('/bookings/new-count', auth, adminController.getNewBookingsCount);
router.put('/bookings/mark-seen', auth, adminController.markBookingsAdminSeen);
router.put('/bookings/:bookingId', auth, adminController.updateBooking);
router.delete('/bookings/:bookingId', auth, adminController.deleteBooking);

// Subscription Management
router.get('/subscriptions', auth, adminController.getSubscriptions);
router.get('/subscriptions/stats', auth, adminController.getSubscriptionStats);
router.get('/subscriptions/export-csv', auth, adminController.exportSubscriptionsCSV);
router.put('/subscriptions/:subscriptionId/cancel', auth, adminController.adminCancelSubscription);
router.put('/subscriptions/:subscriptionId/extend', auth, adminController.adminExtendSubscription);

// Vendor Management
router.get('/vendors', auth, adminController.getAllVendors);
router.put('/vendors/:vendorId/approve', auth, adminController.approveVendor);
router.put('/vendors/:vendorId/reject', auth, adminController.rejectVendor);
router.put('/vendors/:vendorId/block', auth, adminController.blockVendor);
router.get('/vendors/:vendorId/documents', auth, adminController.getVendorDocuments);

module.exports = router;
