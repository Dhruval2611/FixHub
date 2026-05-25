const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { sendBookingConfirmationEmail } = require('../utils/emailService');
const logToFile = require('../utils/fileLogger');

// Initiate a mock payment
exports.initiatePayment = async (req, res) => {
    try {
        console.log('=== INITIATE PAYMENT REQUEST ===');
        console.log('User:', req.user);
        console.log('Request body:', req.body);

        const { amount, paymentMethod, customerInfo } = req.body;

        // Validate required fields
        if (!amount) {
            console.error('Amount is missing');
            return res.status(400).json({ success: false, message: 'Amount is required' });
        }

        if (!req.user || !req.user.id) {
            console.error('User not authenticated');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Generate a fake transaction ID
        const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
        console.log('Generated transaction ID:', transactionId);

        const paymentData = {
            user: req.user.id,
            amount,
            paymentMethod: paymentMethod || 'Cash on Service',
            paymentStatus: 'pending',
            transactionId,
            customerInfo: customerInfo || {},
        };

        console.log('Creating payment with data:', paymentData);

        const payment = new Payment(paymentData);
        await payment.save();

        console.log('Payment saved successfully:', payment._id);

        res.status(201).json({
            success: true,
            paymentId: payment._id,
            transactionId: payment.transactionId,
            message: 'Payment initiated successfully',
        });
    } catch (error) {
        console.error('=== ERROR IN INITIATE PAYMENT ===');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Process mock payment (simulate payment success/failure)
exports.processPayment = async (req, res) => {
    try {
        const { paymentId, success = true } = req.body;

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update payment status
        payment.paymentStatus = success ? 'completed' : 'failed';
        await payment.save();

        res.json({
            success: true,
            paymentStatus: payment.paymentStatus,
            transactionId: payment.transactionId,
            message: success ? 'Payment completed successfully' : 'Payment failed',
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create bookings after successful payment
exports.createBookingsAfterPayment = async (req, res) => {
    try {
        console.log('=== CREATE BOOKINGS AFTER PAYMENT ===');
        console.log('Request user:', req.user);

        const { paymentId, bookingsData } = req.body;
        const Service = require('../models/Service');
        const ServiceRequest = require('../models/ServiceRequest');

        // Verify payment exists and is completed
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.paymentStatus !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Payment not completed. Please complete payment first.'
            });
        }

        console.log('Payment verified. Creating bookings for user:', req.user.id);

        const io = req.app.get('io');

        // Create all bookings + ServiceRequests for vendor matching
        const createdBookings = [];
        for (const bookingData of bookingsData) {
            const booking = new Booking({
                user: req.user.id,
                service: bookingData.service,
                date: bookingData.date,
                time: bookingData.time,
                address: bookingData.address,
                notes: bookingData.notes || '',
                status: 'pending',
                paymentId: payment._id,
            });
            const savedBooking = await booking.save();
            createdBookings.push(savedBooking);

            // Create ServiceRequest for vendor matching
            const service = await Service.findById(bookingData.service);
            if (service) {
                const serviceRequest = new ServiceRequest({
                    booking: savedBooking._id,
                    user: req.user.id,
                    service: bookingData.service,
                    category: service.category,
                    location: (bookingData.location || bookingData.address || '').toLowerCase(),
                    address: bookingData.address,
                    date: bookingData.date,
                    time: bookingData.time,
                });
                await serviceRequest.save();

                // Emit to matching vendor room
                if (io) {
                    const room = `category:${service.category.toLowerCase()}`;
                    const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
                        .populate('user', 'name email phone')
                        .populate('service', 'name price icon category')
                        .populate('booking', 'date time address notes status');

                    io.to(room).emit('new-service-request', populatedRequest);
                    console.log(`📢 Emitted service request to vendor room: ${room}`);
                }
            }
        }

        console.log('All bookings created successfully. Total:', createdBookings.length);

        // Update payment with booking IDs
        payment.bookingIds = createdBookings.map(b => b._id);
        await payment.save();

        res.status(201).json({
            success: true,
            message: 'Bookings created — matching vendors have been notified!',
            bookings: createdBookings,
            payment: payment,
        });

        // Send booking confirmation email (fire-and-forget — use User DB as guaranteed source)
        try {
            const dbUser = await User.findById(req.user.id).select('name email');
            const customerEmail = dbUser?.email || payment.customerInfo?.email;
            const customerName = payment.customerInfo?.name || dbUser?.name || 'Customer';

            logToFile(`Attempting to send booking confirmation email to: ${customerEmail}`, {
                paymentId: payment._id,
                customerName,
                bookingCount: createdBookings.length
            });

            if (customerEmail) {
                const emailBookings = await Booking.find({ _id: { $in: createdBookings.map(b => b._id) } })
                    .populate('service', 'name price');
                
                sendBookingConfirmationEmail({
                    email: customerEmail,
                    name: customerName,
                    paymentId: payment._id,
                    bookings: emailBookings.map(b => ({
                        name: b.service?.name || 'Service',
                        date: b.date,
                        time: b.time,
                        price: b.service?.price || '',
                        address: b.address,
                    })),
                    transactionId: payment.transactionId,
                    paymentMethod: payment.paymentMethod,
                    amount: payment.amount,
                }).then(() => {
                    logToFile(`✅ Booking confirmation email successfully sent to ${customerEmail}`);
                }).catch(err => {
                    logToFile(`❌ Email send error for ${customerEmail}:`, err);
                    console.error('Email send error:', err);
                });
            } else {
                logToFile(`⚠️ No email found for user ${req.user.id}, skipping email.`);
                console.warn('⚠️ Could not find user email — booking confirmation email skipped.');
            }
        } catch (emailErr) {
            logToFile(`❌ Error preparing booking confirmation email for user ${req.user.id}:`, emailErr);
            console.error('Error preparing booking confirmation email:', emailErr);
        }
    } catch (error) {
        console.error('=== ERROR CREATING BOOKINGS ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get payment details
exports.getPaymentDetails = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id)
            .populate('bookingIds')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        res.json({ success: true, payment });
    } catch (error) {
        console.error('Error fetching payment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
// Download Receipt as PDF
exports.downloadReceiptPDF = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const payment = await Payment.findById(paymentId)
            .populate('bookingIds')
            .populate('user', 'name email');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Prepare data for PDF
        const pdfData = {
            name: payment.customerInfo?.name || payment.user?.name || 'Customer',
            email: payment.customerInfo?.email || payment.user?.email || '',
            amount: payment.amount,
            transactionId: payment.transactionId,
            paymentMethod: payment.paymentMethod,
            date: new Date(payment.createdAt).toLocaleString('en-IN'),
            confirmed: payment.paymentStatus === 'completed',
            bookings: []
        };

        // Populate service details for PDF
        const bookings = await Booking.find({ _id: { $in: payment.bookingIds } })
            .populate('service', 'name price');
        
        pdfData.bookings = bookings.map(b => ({
            name: b.service?.name || 'Service',
            date: b.date,
            time: b.time,
            price: b.service?.price || ''
        }));

        const { generateReceiptPDF } = require('../utils/pdfGenerator');
        
        // Set headers for PDF preview/download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=FixHub_Receipt_${payment.transactionId}.pdf`);

        // Generate and stream PDF to response
        generateReceiptPDF(pdfData, res);
    } catch (error) {
        console.error('Error in downloadReceiptPDF:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
