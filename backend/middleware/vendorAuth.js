const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

const vendorAuth = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor only.' });
    }

    const vendor = await Vendor.findById(decoded.id).select('-password');
    if (!vendor) {
      return res.status(401).json({ message: 'Vendor not found' });
    }

    if (vendor.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Contact admin.' });
    }

    if (vendor.status !== 'approved') {
      return res.status(403).json({ message: 'Your account is not yet approved.', vendorStatus: vendor.status });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Lighter middleware that allows pending vendors to check their status
const vendorAuthAny = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied. Vendor only.' });
    }

    const vendor = await Vendor.findById(decoded.id).select('-password');
    if (!vendor) {
      return res.status(401).json({ message: 'Vendor not found' });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { vendorAuth, vendorAuthAny };
