const Booking = require('../models/Booking');
const Service = require('../models/Service');
const ServiceRequest = require('../models/ServiceRequest');
const Vendor = require('../models/Vendor');

exports.createBooking = async (req, res) => {
    try {
        const { serviceId, date, time, address, notes, location } = req.body;

        const booking = new Booking({
            user: req.user.id, // From auth middleware
            service: serviceId,
            date,
            time,
            address,
            notes
        });

        await booking.save();

        // Fetch service to get category for vendor matching
        const service = await Service.findById(serviceId);

        if (service) {
            // Create a ServiceRequest for vendor matching
            const serviceRequest = new ServiceRequest({
                booking: booking._id,
                user: req.user.id,
                service: serviceId,
                category: service.category,
                location: (location || address || '').toLowerCase(),
                address: address,
                date: date,
                time: time,
            });

            await serviceRequest.save();

            // Emit to matching vendor room
            const io = req.app.get('io');
            if (io) {
                const room = `category:${service.category.toLowerCase()}`;
                const populatedRequest = await ServiceRequest.findById(serviceRequest._id)
                    .populate('user', 'name email phone')
                    .populate('service', 'name price icon category')
                    .populate('booking', 'date time address notes status');

                io.to(room).emit('new-service-request', populatedRequest);
                console.log(`📢 Emitted service request to room: ${room}`);

                // Also notify admin
                io.to('admin-room').emit('new-booking', {
                    bookingId: booking._id,
                    serviceName: service.name,
                    date,
                    time,
                });
            }
        }

        res.status(201).json(booking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id })
            .populate('service')
            .populate('assignedVendor', 'name businessName phone rating totalReviews isVerified certifications')
            .sort({ createdAt: -1 });

        // Enrich bookings with interestedVendors from ServiceRequest
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const b = booking.toObject();
            if (b.vendorStatus === 'vendor_accepted' || b.vendorStatus === 'assigned') {
                const sr = await ServiceRequest.findOne({ booking: b._id })
                    .select('interestedVendors');
                if (sr) {
                    b.interestedVendors = sr.interestedVendors || [];
                }
            }
            return b;
        }));

        res.json(enrichedBookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get count of bookings with unseen status updates for the logged-in user
exports.getUnseenCount = async (req, res) => {
    try {
        const count = await Booking.countDocuments({ user: req.user.id, statusSeen: false });
        res.json({ count });
    } catch (error) {
        console.error('Error fetching unseen count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Mark all user's bookings as seen
exports.markBookingsSeen = async (req, res) => {
    try {
        await Booking.updateMany({ user: req.user.id, statusSeen: false }, { statusSeen: true });
        res.json({ message: 'All bookings marked as seen' });
    } catch (error) {
        console.error('Error marking bookings seen:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get interested vendors for a booking
exports.getInterestedVendors = async (req, res) => {
    try {
        const { id } = req.params; // booking ID
        const sr = await ServiceRequest.findOne({ booking: id, user: req.user.id })
            .select('interestedVendors status');

        if (!sr) {
            return res.status(404).json({ message: 'Service request not found.' });
        }

        res.json({ interestedVendors: sr.interestedVendors || [], status: sr.status });
    } catch (error) {
        console.error('Error fetching interested vendors:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User selects a vendor from interested list
exports.acceptVendor = async (req, res) => {
    try {
        const { id } = req.params; // booking ID
        const { vendorId } = req.body; // selected vendor ID

        if (!vendorId) {
            return res.status(400).json({ message: 'vendorId is required.' });
        }

        const booking = await Booking.findOne({
            _id: id,
            user: req.user.id,
            vendorStatus: 'vendor_accepted',
        }).populate('service', 'name price');

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or no vendors available.' });
        }

        // Verify the vendor is in the interestedVendors list
        const serviceRequest = await ServiceRequest.findOne({ booking: id });
        if (!serviceRequest) {
            return res.status(404).json({ message: 'Service request not found.' });
        }

        const selectedVendor = serviceRequest.interestedVendors.find(
            v => v.vendorId.toString() === vendorId
        );
        if (!selectedVendor) {
            return res.status(400).json({ message: 'Selected vendor has not expressed interest.' });
        }

        // Confirm the booking with the selected vendor
        booking.assignedVendor = vendorId;
        booking.userAccepted = true;
        booking.vendorStatus = 'assigned';
        booking.status = 'confirmed';
        booking.statusSeen = false;
        await booking.save();

        // Update the ServiceRequest
        serviceRequest.status = 'assigned';
        serviceRequest.assignedVendor = vendorId;
        await serviceRequest.save();

        // Get other interested vendor IDs (not selected)
        const otherVendorIds = serviceRequest.interestedVendors
            .filter(v => v.vendorId.toString() !== vendorId)
            .map(v => v.vendorId);

        // Socket notifications
        const io = req.app.get('io');
        if (io) {
            // Notify the selected vendor
            io.to(`vendor:${vendorId}`).emit('user-selected-you', {
                bookingId: booking._id,
                message: 'The customer has selected you for the job!',
            });

            // Notify other interested vendors
            otherVendorIds.forEach(vId => {
                io.to(`vendor:${vId}`).emit('user-selected-other', {
                    bookingId: booking._id,
                    requestId: serviceRequest._id,
                    message: 'The customer chose a different vendor for this request.',
                });
            });

            // Notify ALL vendors in the category to remove this request
            const room = `category:${serviceRequest.category.toLowerCase()}`;
            io.to(room).emit('request-closed', {
                requestId: serviceRequest._id,
                message: 'This request has been confirmed by the customer.',
            });
        }

        res.json({ message: 'Vendor selected! Booking confirmed.', booking });
    } catch (error) {
        console.error('Error selecting vendor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User rejects a specific vendor from the interested list
exports.rejectVendor = async (req, res) => {
    try {
        const { id } = req.params; // booking ID
        const { vendorId } = req.body;

        const booking = await Booking.findOne({
            _id: id,
            user: req.user.id,
            vendorStatus: 'vendor_accepted',
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        const serviceRequest = await ServiceRequest.findOne({ booking: id });
        if (!serviceRequest) {
            return res.status(404).json({ message: 'Service request not found.' });
        }

        // Remove the vendor from interestedVendors
        serviceRequest.interestedVendors = serviceRequest.interestedVendors.filter(
            v => v.vendorId.toString() !== vendorId
        );

        // Add to respondedVendors so they don't see the request again
        if (!serviceRequest.respondedVendors.includes(vendorId)) {
            serviceRequest.respondedVendors.push(vendorId);
        }

        // If no more interested vendors, reset status to open
        if (serviceRequest.interestedVendors.length === 0) {
            serviceRequest.status = 'open';
            booking.vendorStatus = 'unassigned';
            await booking.save();
        }

        await serviceRequest.save();

        // Notify the rejected vendor
        const io = req.app.get('io');
        if (io && vendorId) {
            io.to(`vendor:${vendorId}`).emit('user-selected-other', {
                bookingId: booking._id,
                requestId: serviceRequest._id,
                message: 'The customer removed you from consideration.',
            });
        }

        res.json({
            message: 'Vendor removed.',
            remainingVendors: serviceRequest.interestedVendors.length,
        });
    } catch (error) {
        console.error('Error rejecting vendor:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User submits feedback after job completion
exports.submitFeedback = async (req, res) => {
    try {
        const { id } = req.params; // booking ID
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const booking = await Booking.findOne({
            _id: id,
            user: req.user.id,
            vendorStatus: 'completed',
        });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or not yet completed.' });
        }

        if (booking.vendorFeedback && booking.vendorFeedback.rating) {
            return res.status(400).json({ message: 'Feedback already submitted for this booking.' });
        }

        // Save feedback on booking
        booking.vendorFeedback = {
            rating,
            review: review || '',
            createdAt: new Date(),
        };
        await booking.save();

        // Update vendor's running average rating
        if (booking.assignedVendor) {
            const vendor = await Vendor.findById(booking.assignedVendor);
            if (vendor) {
                const newTotalReviews = (vendor.totalReviews || 0) + 1;
                const currentTotal = (vendor.rating || 0) * (vendor.totalReviews || 0);
                const newRating = (currentTotal + rating) / newTotalReviews;

                vendor.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
                vendor.totalReviews = newTotalReviews;
                await vendor.save();

                // Notify vendor about new feedback
                const io = req.app.get('io');
                if (io) {
                    io.to(`vendor:${vendor._id}`).emit('new-feedback', {
                        bookingId: booking._id,
                        rating,
                        review: review || '',
                    });
                }
            }
        }

        res.json({ message: 'Feedback submitted successfully!', feedback: booking.vendorFeedback });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// User cancels/removes a booking request
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, user: req.user.id });
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        // Don't allow cancelling completed/assigned bookings
        if (booking.vendorStatus === 'assigned' && booking.userAccepted) {
            return res.status(400).json({ message: 'Cannot cancel a confirmed booking. Please contact support.' });
        }

        // Find and remove the service request
        const serviceRequest = await ServiceRequest.findOne({ booking: id });

        if (serviceRequest) {
            const io = req.app.get('io');

            // Notify interested vendors that the request is cancelled
            if (io && serviceRequest.interestedVendors?.length > 0) {
                serviceRequest.interestedVendors.forEach(v => {
                    io.to(`vendor:${v.vendorId}`).emit('user-selected-other', {
                        bookingId: booking._id,
                        requestId: serviceRequest._id,
                        message: 'The customer has cancelled this request.',
                    });
                });

                // Notify category room
                const room = `category:${serviceRequest.category.toLowerCase()}`;
                io.to(room).emit('request-closed', {
                    requestId: serviceRequest._id,
                    message: 'Request cancelled by customer.',
                });
            }

            await ServiceRequest.deleteOne({ _id: serviceRequest._id });
        }

        // Update booking status to cancelled
        booking.status = 'cancelled';
        booking.vendorStatus = 'unassigned';
        await booking.save();

        res.json({ message: 'Booking cancelled successfully.' });
    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
