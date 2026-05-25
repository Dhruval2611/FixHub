const express = require('express');
const router = express.Router();
const vendorAuthController = require('../controllers/vendorAuthController');
const vendorController = require('../controllers/vendorController');
const { vendorAuth, vendorAuthAny } = require('../middleware/vendorAuth');
const { vendorUpload } = require('../middleware/upload');
const upload = require('../middleware/upload');

// Auth Routes (public)
router.post('/register', vendorUpload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'businessCertificate', maxCount: 1 },
]), vendorAuthController.register);

router.post('/login', vendorAuthController.login);

// Profile (any authenticated vendor, even pending)
router.get('/profile', vendorAuthAny, vendorAuthController.getProfile);
router.put('/profile', vendorAuth, upload.single('profilePicture'), vendorAuthController.updateProfile);

// Protected Routes (approved vendors only)
router.get('/requests', vendorAuth, vendorController.getRequests);
router.post('/accept/:id', vendorAuth, vendorController.acceptRequest);
router.post('/reject/:id', vendorAuth, vendorController.rejectRequest);
router.get('/jobs', vendorAuth, vendorController.getJobs);
router.post('/complete/:id', vendorAuth, vendorController.completeJob);
router.get('/dashboard', vendorAuth, vendorController.getDashboardStats);

module.exports = router;
