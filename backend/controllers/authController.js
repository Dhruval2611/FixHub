const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendDeleteAccountOtp, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');
const User = require('../models/User');
const logToFile = require('../utils/fileLogger');
const { clerkClient } = require('@clerk/express');

// Register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const profilePicture = req.file ? req.file.path : 'uploads/default-profile.png';

    // Normalize email to enforce single account per email (case-insensitive)
    const normalizedEmail = email && String(email).toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      profilePicture,
    });

    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user._id, name, email: normalizedEmail, profilePicture } });
  } catch (error) {
    console.error('Registration error:', error);
    // Handle duplicate key race (unique index) gracefully
    if (error && error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email && String(email).toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: { id: user._id, name: user.name, email: normalizedEmail, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Check if subscription has expired and update status
    if (user.subscription && user.subscription.planExpiryDate) {
      const now = new Date();
      if (now > user.subscription.planExpiryDate && user.subscription.planStatus === 'active') {
        user.subscription.planStatus = 'expired';
        await user.save();
      }
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  logToFile('Update profile request received', { body: req.body, file: req.file, user: req.user });
  try {
    const { name, phone } = req.body;
    let profilePicture = req.file ? req.file.path : undefined;

    // Normalize path separators for consistent URL usage
    if (profilePicture) {
      profilePicture = profilePicture.replace(/\\/g, '/');
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;

    logToFile('Updating user with data', updateData);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      logToFile('User not found during update', { userId: req.user.id });
      return res.status(404).json({ message: 'User not found' });
    }

    logToFile('User updated successfully', { userId: user._id, profilePicture: user.profilePicture });

    // TRIGGER WELCOME EMAIL: If this is the initial profile completion
    if (req.body.isProfileCompletion === 'true' || req.body.isProfileCompletion === true) {
      try {
        // Non-blocking call
        sendWelcomeEmail(user.email, user.name);
      } catch (emailErr) {
        logToFile('Failed to trigger welcome email (async catch)', emailErr);
      }
    }

    res.json(user);
  } catch (error) {
    logToFile('Update profile error', error);
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // In a stateless JWT setup, logout is handled on the client side
    // by removing the token from localStorage
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const { emailNotifications, smsReminders, marketingEmails } = req.body;

    const updateData = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (smsReminders !== undefined) updateData.smsReminders = smsReminders;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check current password
    if (currentPassword !== user.password) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Forgot Password - Send OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = email && String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    user.resetOtp = await bcrypt.hash(otp, salt);
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"FixHub" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: 'FixHub - Password Reset OTP',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;border:1px solid #E5E7EB;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);overflow:hidden;">
        
        <tr>
          <td style="background-color:#111827;padding:48px;text-align:center;">
            <h1 style="color:#FFFFFF;margin:0;font-size:28px;font-weight:700;">Password Reset</h1>
          </td>
        </tr>

        <tr>
          <td style="padding:48px;">
            <p style="font-size:16px;color:#4B5563;margin:0 0 24px;line-height:1.6;">
              Hello ${user.name},<br><br>
              You requested a password reset for your FixHub account. Please use the secure authorization code below to reset your password.
            </p>

            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin:32px 0;">
              <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#111827;">${otp}</span>
            </div>

            <p style="font-size:14px;color:#EF4444;font-weight:600;margin:0 0 8px;">
              ⏳ This code expires in exactly 10 minutes.
            </p>
            <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
              If you did not request this password reset, please ignore this email or contact support if you have concerns about your account security.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#F9FAFB;padding:24px 48px;text-align:center;border-top:1px solid #E5E7EB;">
            <div style="font-weight:700;font-size:16px;color:#111827;margin-bottom:8px;">FixHub</div>
            <p style="font-size:12px;color:#9CA3AF;margin:0;">&copy; ${new Date().getFullYear()} FixHub Inc. &middot; Premium Services</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    });

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// Reset Password - Verify OTP & set new password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email && String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ message: 'Invalid reset request. Please request a new OTP.' });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash new password and save
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request Delete Account OTP
const requestDeleteAccountOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const salt = await bcrypt.genSalt(10);
    user.deleteOtp = await bcrypt.hash(otp, salt);
    user.deleteOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email - NON-BLOCKING for instant response
    sendDeleteAccountOtp(user.email, user.name, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Account deletion OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
};

// Delete Account - Verify OTP & delete
const deleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.deleteOtp || !user.deleteOtpExpiry) {
      return res.status(400).json({ message: 'Invalid request. Please request a new OTP.' });
    }

    if (user.deleteOtpExpiry < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, user.deleteOtp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Attempt to delete from Clerk if exists
    if (user.clerkId) {
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (clerkErr) {
        console.error('Failed to delete Clerk user:', clerkErr);
      }
    }

    // Delete local user
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account permanently deleted' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  logout,
  updatePreferences,
  changePassword,
  forgotPassword,
  resetPassword,
  requestDeleteAccountOtp,
  deleteAccount,
};
