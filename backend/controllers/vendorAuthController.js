const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');

// Register Vendor
const register = async (req, res) => {
  try {
    const { name, businessName, email, phone, password, serviceCategory, location } = req.body;

    const normalizedEmail = email && String(email).toLowerCase();

    // Check if vendor already exists
    const existingVendor = await Vendor.findOne({ email: normalizedEmail });
    if (existingVendor) {
      return res.status(400).json({ message: 'Vendor with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle file uploads
    const idProof = req.files?.idProof?.[0]?.path?.replace(/\\/g, '/') || '';
    const businessCertificate = req.files?.businessCertificate?.[0]?.path?.replace(/\\/g, '/') || '';

    if (!idProof) {
      return res.status(400).json({ message: 'ID Proof document is required' });
    }

    const vendor = new Vendor({
      name,
      businessName,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      serviceCategory,
      location: location.toLowerCase(),
      idProof,
      businessCertificate,
      status: 'pending',
    });

    await vendor.save();

    // Create token (vendor can check status but can't access protected routes until approved)
    const token = jwt.sign(
      { id: vendor._id, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval.',
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName,
        email: vendor.email,
        status: vendor.status,
        serviceCategory: vendor.serviceCategory,
        location: vendor.location,
      },
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'Vendor with this email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login Vendor
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email && String(email).toLowerCase();

    const vendor = await Vendor.findOne({ email: normalizedEmail });
    if (!vendor) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check vendor status
    if (vendor.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
    }

    if (vendor.status === 'rejected') {
      return res.status(403).json({
        message: 'Your application was rejected.',
        reason: vendor.rejectionReason || 'No reason provided.',
      });
    }

    // Create token
    const token = jwt.sign(
      { id: vendor._id, role: 'vendor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      vendor: {
        id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        serviceCategory: vendor.serviceCategory,
        location: vendor.location,
        profilePicture: vendor.profilePicture,
      },
    });
  } catch (error) {
    console.error('Vendor login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Vendor Profile
const getProfile = async (req, res) => {
  try {
    res.json(req.vendor);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update Vendor Profile
const updateProfile = async (req, res) => {
  try {
    const { name, businessName, phone, serviceCategory, location } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (businessName) updateData.businessName = businessName;
    if (phone) updateData.phone = phone;
    if (serviceCategory) updateData.serviceCategory = serviceCategory;
    if (location) updateData.location = location.toLowerCase();

    if (req.file) {
      updateData.profilePicture = req.file.path.replace(/\\/g, '/');
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.vendor._id,
      updateData,
      { new: true }
    ).select('-password');

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Vendor profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
