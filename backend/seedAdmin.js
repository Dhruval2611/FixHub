const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminEmail = 'admin@fixhub.com';
        const normalizedEmail = adminEmail && String(adminEmail).toLowerCase();
        const adminPassword = 'admin123';
        const adminName = 'Admin User';

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: normalizedEmail });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit();
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create admin
        const newAdmin = new User({
            name: adminName,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'admin',
            phone: '1234567890'
        });

        await newAdmin.save();
        console.log('Admin user created successfully');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
