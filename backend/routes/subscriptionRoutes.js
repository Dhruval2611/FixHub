const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscriptionController = require('../controllers/subscriptionController');

// @route   GET /api/subscriptions/plans
router.get('/plans', subscriptionController.getAllPlans);

// @route   GET /api/subscriptions/plan/:planName
router.get('/plan/:planName', subscriptionController.getPlanDetails);

// @route   GET /api/subscriptions/my-subscription
router.get('/my-subscription', auth, subscriptionController.getUserSubscription);

// @route   GET /api/subscriptions/discount
router.get('/discount', auth, subscriptionController.getUserDiscount);

// @route   POST /api/subscriptions/calculate-upgrade
router.post('/calculate-upgrade', auth, subscriptionController.calculateUpgradePrice);

// @route   POST /api/subscriptions/request-otp
// @desc    Request an OTP for subscription purchase or cancellation
router.post('/request-otp', auth, subscriptionController.requestSubscriptionOtp);

// @route   POST /api/subscriptions/verify-otp
// @desc    Pre-flight verify an OTP before charging payment
router.post('/verify-otp', auth, subscriptionController.verifyOtp);

// @route   POST /api/subscriptions/purchase
router.post('/purchase', auth, subscriptionController.purchasePlan);

// @route   POST /api/subscriptions/cancel
// @desc    Cancel the current subscription
router.post('/cancel', auth, subscriptionController.cancelSubscription);

module.exports = router;
