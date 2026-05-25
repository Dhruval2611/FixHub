const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { sendSubscriptionOtpEmail, sendSubscriptionSuccessEmail, sendSubscriptionCancelledEmail } = require('../utils/emailService');
const crypto = require('crypto');

// Plan configurations
const PLAN_CONFIGS = {
  Basic: {
    price: 0,
    discountPercentage: 0,
    durationMonths: 0,
    benefits: {
      discountOnServices: 0,
      priorityBooking: false,
      freeEmergencyCallouts: 0,
      supportType: 'email',
      warrantyCoverage: 'basic',
    },
    description: 'Access to all service categories, standard booking, limited support.',
    features: [
      'Access to all service categories',
      'Standard booking',
      'Normal service charges',
      'Limited support',
      'No priority booking',
      'No discounts on services',
    ],
  },
  Premium: {
    price: 49,
    discountPercentage: 15,
    durationMonths: 1,
    benefits: {
      discountOnServices: 15,
      priorityBooking: true,
      freeEmergencyCallouts: 2,
      supportType: 'phone',
      warrantyCoverage: 'extended',
    },
    description: 'Everything in Basic, plus priority booking & scheduling, 15% discount on all services, 24/7 phone support, extended warranty coverage, free emergency callouts, dedicated account manager.',
    features: [
      'Everything in Basic',
      'Priority booking & scheduling',
      '15% discount on all services',
      '24/7 phone support',
      'Extended warranty coverage',
      'Free emergency callouts (2/month)',
      'Dedicated account manager',
    ],
  },
  Elite: {
    price: 99,
    discountPercentage: 25,
    durationMonths: 1,
    benefits: {
      discountOnServices: 25,
      priorityBooking: true,
      freeEmergencyCallouts: -1, // Unlimited
      supportType: 'concierge',
      warrantyCoverage: 'lifetime',
    },
    description: 'Everything in Premium, plus VIP priority service, 25% discount on all services, concierge support, lifetime warranty on all work, unlimited free emergency visits, personal service coordinator, exclusive access to new services.',
    features: [
      'Everything in Premium',
      'VIP priority service',
      '25% discount on all services',
      'Concierge support',
      'Lifetime warranty on all work',
      'Unlimited free emergency visits',
      'Personal service coordinator',
      'Exclusive access to new services',
    ],
  },
  'Premium Yearly': {
    price: 499, // yearly plan
    discountPercentage: 15,
    durationMonths: 12,
    benefits: {
      discountOnServices: 15,
      priorityBooking: true,
      freeEmergencyCallouts: 2,
      supportType: 'phone',
      warrantyCoverage: 'extended',
    },
    description: 'Everything in Premium, billed annually. Includes 7 days free trial for new subscribers.',
    features: [
      'Everything in Basic',
      'Priority booking & scheduling',
      '15% discount on all services',
      '24/7 phone support',
      'Extended warranty coverage',
      'Free emergency callouts (24/year)',
      'Dedicated account manager',
    ],
  },
  'Elite Yearly': {
    price: 999, // yearly plan
    discountPercentage: 25,
    durationMonths: 12,
    benefits: {
      discountOnServices: 25,
      priorityBooking: true,
      freeEmergencyCallouts: -1, // Unlimited
      supportType: 'concierge',
      warrantyCoverage: 'lifetime',
    },
    description: 'Everything in Elite, billed annually. Includes 7 days free trial for new subscribers.',
    features: [
      'Everything in Premium',
      'VIP priority service',
      '25% discount on all services',
      'Concierge support',
      'Lifetime warranty on all work',
      'Unlimited free emergency visits',
      'Personal service coordinator',
      'Exclusive access to new services',
    ],
  },
};

// Get plan details
exports.getPlanDetails = async (req, res) => {
  try {
    const { planName } = req.params;
    if (!PLAN_CONFIGS[planName]) {
      return res.status(400).json({ message: 'Invalid plan name' });
    }
    res.json({ success: true, plan: PLAN_CONFIGS[planName] });
  } catch (error) {
    console.error('Error fetching plan details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all plans
exports.getAllPlans = async (req, res) => {
  try {
    res.json({ success: true, plans: PLAN_CONFIGS });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Calculate upgrade price (prorated)
exports.calculateUpgradePrice = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { targetPlan } = req.body;

    if (!PLAN_CONFIGS[targetPlan]) {
      return res.status(400).json({ message: 'Invalid target plan' });
    }

    const planOrder = { Basic: 0, Premium: 1, 'Premium Yearly': 2, Elite: 3, 'Elite Yearly': 4 };
    const currentPlanName = user.subscription?.planName || 'Basic';
    const targetPlanConfig = PLAN_CONFIGS[targetPlan];

    if (planOrder[targetPlan] <= planOrder[currentPlanName]) {
      return res.status(400).json({ message: 'Can only upgrade to a higher plan' });
    }

    // If current plan is Basic, full price applies
    if (!user.subscription || currentPlanName === 'Basic') {
      return res.json({
        success: true,
        amount: targetPlanConfig.price,
        originalPrice: targetPlanConfig.price,
        previousPlan: 'Basic',
        targetPlan,
        prorated: false,
        message: 'Upgrading from Basic. Full price applies.',
      });
    }

    const currentPlan = PLAN_CONFIGS[currentPlanName];
    const now = new Date();
    const expiryDate = user.subscription.planExpiryDate;
    const totalDays = Math.ceil((expiryDate - user.subscription.planStartDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return res.json({
        success: true,
        amount: targetPlanConfig.price,
        originalPrice: targetPlanConfig.price,
        previousPlan: currentPlanName,
        targetPlan,
        prorated: false,
        message: 'Subscription expired. Full price applies.',
      });
    }

    const remainingValue = (currentPlan.price * remainingDays) / totalDays;
    const upgradeAmount = Math.max(0, Math.round(targetPlanConfig.price - remainingValue));

    res.json({
      success: true,
      amount: upgradeAmount,
      originalPrice: targetPlanConfig.price,
      previousPlan: currentPlanName,
      targetPlan,
      prorated: true,
      remainingDays,
      discount: Math.round(targetPlanConfig.price - upgradeAmount),
    });
  } catch (error) {
    console.error('Error calculating upgrade price:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Request Subscription OTP (for purchase or cancellation)
exports.requestSubscriptionOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.subscriptionOtp = otp;
    user.subscriptionOtpExpiry = expiry;
    await user.save();

    const action = req.body.action || 'subscription';
    await sendSubscriptionOtpEmail(user.email, user.name, otp, action);

    res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Error requesting subscription OTP:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Pre-flight OTP Verification
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!otp) return res.status(400).json({ message: 'Verification code is required' });
    if (!user.subscriptionOtp || !user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    if (new Date() > user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    if (user.subscriptionOtp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }
    
    // We don't wipe it here, because purchasePlan will wipe it. This is just a pre-check.
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Purchase a new plan or upgrade
exports.purchasePlan = async (req, res) => {
  try {
    console.log('=== PURCHASE PLAN REQUEST ===');
    const { planName, paymentId, planType = 'new', otp } = req.body;

    if (!PLAN_CONFIGS[planName]) {
      return res.status(400).json({ message: 'Invalid plan name' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate OTP
    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required' });
    }
    if (!user.subscriptionOtp || !user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    if (new Date() > user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    if (user.subscriptionOtp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // Clear OTP after successful validation
    user.subscriptionOtp = undefined;
    user.subscriptionOtpExpiry = undefined;

    const planConfig = PLAN_CONFIGS[planName];
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + planConfig.durationMonths);

    // Apply 7-day trial for first time buyers
    const isFirstTime = !user.hasUsedTrial && planName !== 'Basic';
    const trialDays = isFirstTime ? 7 : 0;
    
    if (trialDays > 0) {
      expiryDate.setDate(expiryDate.getDate() + trialDays);
      user.hasUsedTrial = true;
    }

    let previousPlan = 'Basic';
    if (user.subscription && user.subscription.planName !== 'Basic') {
      previousPlan = user.subscription.planName;
      if (planType === 'upgrade' && user.subscription.planStatus === 'active') {
        const currentExpiry = user.subscription.planExpiryDate;
        if (currentExpiry > now) {
          expiryDate.setTime(currentExpiry.getTime() + (planConfig.durationMonths * 30 * 24 * 60 * 60 * 1000));
        }
      }
    }

    user.subscription = {
      planName,
      planStatus: 'active',
      planStartDate: now,
      planExpiryDate: expiryDate,
      planPrice: planConfig.price,
      trialEndDate: trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : undefined,
    };

    await user.save();
    console.log('User subscription updated:', user.subscription);

    const subscription = new Subscription({
      user: user._id,
      planName,
      planType,
      previousPlan: previousPlan !== 'Basic' ? previousPlan : null,
      amount: planConfig.price,
      discountPercentage: planConfig.discountPercentage,
      status: 'active',
      startDate: now,
      expiryDate: expiryDate,
      paymentId: paymentId || null,
      benefits: planConfig.benefits,
    });

    await subscription.save();

    // Send success email (non-blocking)
    sendSubscriptionSuccessEmail(user.email, user.name, planName, expiryDate, planConfig.price).catch(() => {});

    res.json({
      success: true,
      message: `Successfully ${planType === 'upgrade' ? 'upgraded to' : 'purchased'} ${planName} plan!${trialDays > 0 ? ' Your 7-day free trial starts now.' : ''}`,
      subscription: {
        planName: user.subscription.planName,
        planStatus: user.subscription.planStatus,
        planStartDate: user.subscription.planStartDate,
        planExpiryDate: user.subscription.planExpiryDate,
        trialEndDate: user.subscription.trialEndDate,
        discountPercentage: planConfig.discountPercentage,
        benefits: planConfig.benefits,
      },
    });
  } catch (error) {
    console.error('=== ERROR IN PURCHASE PLAN ===', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const { otp, reason } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Validate OTP
    if (!otp) {
      return res.status(400).json({ message: 'Verification code is required' });
    }
    if (!user.subscriptionOtp || !user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
    }
    if (new Date() > user.subscriptionOtpExpiry) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }
    if (user.subscriptionOtp !== String(otp)) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    const cancelledPlan = user.subscription?.planName || 'Basic';
    if (cancelledPlan === 'Basic') {
      return res.status(400).json({ message: 'You are already on the Basic plan.' });
    }

    let isRefunded = false;
    if (user.subscription?.trialEndDate && new Date() <= user.subscription.trialEndDate) {
      isRefunded = true;
    }

    // Clear OTP & revert subscription
    user.subscriptionOtp = undefined;
    user.subscriptionOtpExpiry = undefined;
    user.subscriptionCancelReason = reason || '';

    user.subscription = {
      planName: 'Basic',
      planStatus: 'active',
      planStartDate: null,
      planExpiryDate: null,
      planPrice: 0,
    };

    await user.save();

    // Update existing Subscription record
    await Subscription.findOneAndUpdate(
      { user: user._id, planName: cancelledPlan, status: 'active' },
      { status: 'cancelled' }
    );

    // Send cancellation email (non-blocking)
    sendSubscriptionCancelledEmail(user.email, user.name, cancelledPlan, reason).catch(() => {});

    res.json({
      success: true,
      message: `Your subscription has been successfully cancelled.${isRefunded ? ' A full refund will be initiated since you cancelled within your 7-day trial period.' : ''}`,
      subscription: {
        planName: 'Basic',
        planStatus: 'active',
      },
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's current subscription and benefits
exports.getUserSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const subscription = user.subscription || {
      planName: 'Basic',
      planStatus: 'active',
      planStartDate: null,
      planExpiryDate: null,
      planPrice: 0,
    };

    const planConfig = PLAN_CONFIGS[subscription.planName] || PLAN_CONFIGS.Basic;

    let isExpired = false;
    if (subscription.planExpiryDate && new Date() > subscription.planExpiryDate) {
      isExpired = true;
      if (subscription.planStatus === 'active') {
        subscription.planStatus = 'expired';
        await user.save();
      }
    }

    res.json({
      success: true,
      subscription: {
        ...subscription,
        benefits: planConfig.benefits,
        features: planConfig.features,
        description: planConfig.description,
        isExpired,
        canUpgrade: subscription.planName !== 'Elite' && subscription.planStatus === 'active',
        availableUpgrades: subscription.planName === 'Basic'
          ? ['Premium', 'Elite']
          : subscription.planName === 'Premium'
            ? ['Elite']
            : [],
      },
    });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get applicable discount for user
exports.getUserDiscount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const planName = user.subscription?.planName || 'Basic';
    const planConfig = PLAN_CONFIGS[planName];

    res.json({
      success: true,
      discountPercentage: planConfig.discountPercentage,
      planName,
    });
  } catch (error) {
    console.error('Error fetching user discount:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getPlanDetails: exports.getPlanDetails,
  getAllPlans: exports.getAllPlans,
  calculateUpgradePrice: exports.calculateUpgradePrice,
  requestSubscriptionOtp: exports.requestSubscriptionOtp,
  purchasePlan: exports.purchasePlan,
  cancelSubscription: exports.cancelSubscription,
  getUserSubscription: exports.getUserSubscription,
  getUserDiscount: exports.getUserDiscount,
  verifyOtp: exports.verifyOtp,
};
