const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// @route   POST /api/payments/initiate
// @desc    Initiate a payment
// @access  Private
router.post('/initiate', auth, paymentController.initiatePayment);

// @route   POST /api/payments/process
// @desc    Process payment (mock simulation)
// @access  Private
router.post('/process', auth, paymentController.processPayment);

// @route   POST /api/payments/create-bookings
// @desc    Create bookings after successful payment
// @access  Private
router.post('/create-bookings', auth, paymentController.createBookingsAfterPayment);

// @route   GET /api/payments/:id
// @desc    Get payment details
// @access  Private
router.get('/:id', auth, paymentController.getPaymentDetails);

// @route   GET /api/payments/receipt/:paymentId/pdf
// @desc    Download receipt as PDF
// @access  Private
router.get('/receipt/:paymentId/pdf', auth, paymentController.downloadReceiptPDF);


module.exports = router;
