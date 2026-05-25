const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const auth = require('../middleware/auth');

router.post('/', auth, bookingController.createBooking);
router.get('/', auth, bookingController.getUserBookings);
router.get('/unseen-count', auth, bookingController.getUnseenCount);
router.put('/mark-seen', auth, bookingController.markBookingsSeen);
router.post('/:id/accept-vendor', auth, bookingController.acceptVendor);
router.post('/:id/reject-vendor', auth, bookingController.rejectVendor);
router.get('/:id/interested-vendors', auth, bookingController.getInterestedVendors);
router.post('/:id/feedback', auth, bookingController.submitFeedback);
router.delete('/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router;
