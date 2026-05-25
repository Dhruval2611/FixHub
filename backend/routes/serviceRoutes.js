const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/', optionalAuth, serviceController.getAllServices);
router.get('/:id', optionalAuth, serviceController.getServiceById);

module.exports = router;
