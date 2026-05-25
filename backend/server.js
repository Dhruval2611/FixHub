const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authController = require('./controllers/authController');
const auth = require('./middleware/auth');
const upload = require('./middleware/upload');
const path = require('path');
const { clerkClient } = require('@clerk/express');
const nodemailer = require('nodemailer');
const { sendWelcomeEmail } = require('./utils/emailService');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible to routes/controllers
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {

  // Vendor joins their category room
  socket.on('vendor-join', (data) => {
    const { vendorId, category } = data;
    const room = `category:${category.toLowerCase()}`;
    socket.join(room);
    socket.join(`vendor:${vendorId}`);
  });

  // User joins their personal room
  socket.on('user-join', (data) => {
    const { userId } = data;
    socket.join(`user:${userId}`);
  });

  // Admin joins admin room
  socket.on('admin-join', () => {
    socket.join('admin-room');
  });
});

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
  }
} catch (err) {
  console.error('Failed to ensure uploads directory exists:', err);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
// Authentication Routes
app.post('/api/auth/register', upload.single('profilePicture'), authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', auth, authController.getMe);
app.put('/api/auth/profile', auth, upload.single('profilePicture'), authController.updateProfile);
app.put('/api/auth/preferences', auth, authController.updatePreferences);
app.put('/api/auth/change-password', auth, authController.changePassword);
app.post('/api/auth/logout', authController.logout);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);
app.post('/api/auth/request-delete-account-otp', auth, authController.requestDeleteAccountOtp);
app.post('/api/auth/delete-account', auth, authController.deleteAccount);

// Clerk sync endpoint — verifies Clerk session and returns a JWT
app.post('/api/auth/clerk-sync', async (req, res) => {
  try {
    const { clerkUserId } = req.body;
    if (!clerkUserId) {
      return res.status(400).json({ message: 'Clerk user ID required' });
    }

    // Verify the Clerk user exists
    const clerkUser = await clerkClient.users.getUser(clerkUserId);
    if (!clerkUser) {
      return res.status(401).json({ message: 'Invalid Clerk user' });
    }

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const normalizedEmail = email && String(email).toLowerCase();
    const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'User';
    const profilePicture = clerkUser.imageUrl || '';

    // Find or create user in MongoDB
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');

    let user = await User.findOne({ clerkId: clerkUserId });
    let isNewUser = false;
    if (!user) {
      // Check if user exists by email (migrating from old auth)
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.clerkId = clerkUserId;
        if (!user.profilePicture && profilePicture) user.profilePicture = profilePicture;
        await user.save();
      } else {
        user = new User({
          name,
          email: normalizedEmail,
          clerkId: clerkUserId,
          password: 'clerk-managed',
          profilePicture,
        });
        await user.save();
        isNewUser = true;
      }
    } else {
      // Update name/profile from Clerk if changed
      user.name = name;
      if (profilePicture && !user.profilePicture.startsWith('uploads/')) {
        user.profilePicture = profilePicture;
      }
      await user.save();
    }

    // Issue JWT for existing backend APIs
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        phone: user.phone || '',
      },
    });
  } catch (error) {
    console.error('Clerk sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const serviceRoutes = require('./routes/serviceRoutes');
app.use('/api/services', serviceRoutes);

// Admin Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// Booking Routes
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

// Payment Routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Cart Routes
const cartRoutes = require('./routes/cartRoutes');
app.use('/api/cart', cartRoutes);

// Contact Routes
const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);

// Newsletter Routes (legacy)
const newsletterRoutes = require('./routes/newsletterRoutes');
app.use('/api/newsletter', newsletterRoutes);

// Subscription Routes
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api/subscriptions', subscriptionRoutes);

// Vendor Routes
const vendorRoutes = require('./routes/vendorRoutes');
app.use('/api/vendor', vendorRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('FixHub Backend is running');
});

// Start Server (using http server instead of app.listen for Socket.io)
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.io is active`);
});
