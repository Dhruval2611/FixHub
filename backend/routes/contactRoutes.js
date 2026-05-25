const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Logged-in users can submit a query
router.post('/send', auth, contactController.sendInquiry);

// Logged-in users can view their own queries
router.get('/my-queries', auth, contactController.getMyInquiries);

// User notification routes
router.get('/unseen-replies-count', auth, contactController.getUnseenRepliesCount);
router.put('/mark-replies-seen', auth, contactController.markRepliesSeen);

// Admin routes (protected)
router.get('/inquiries', auth, contactController.getAllInquiries);
router.post('/inquiries/:inquiryId/reply', auth, contactController.replyToInquiry);
router.put('/inquiries/:inquiryId/read', auth, contactController.markAsRead);
router.delete('/inquiries/:inquiryId', auth, contactController.deleteInquiry);

module.exports = router;
