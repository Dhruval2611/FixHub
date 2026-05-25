const ContactInquiry = require('../models/ContactInquiry');

// Submit a query (logged-in users only — user info from auth token)
exports.sendInquiry = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }
    if (message.trim().length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' });
    }

    const inquiry = new ContactInquiry({
      user: req.user.id,
      subject: subject.trim(),
      message: message.trim()
    });
    await inquiry.save();

    res.status(201).json({ message: 'Your query has been submitted! Our team will respond shortly.' });

  } catch (error) {
    console.error('Contact inquiry error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};

// Get current user's inquiries
exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json(inquiries);
  } catch (error) {
    console.error('Error fetching user inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch your queries' });
  }
};

// Get all inquiries (Admin only)
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await ContactInquiry.find()
      .populate('user', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json({
      count: inquiries.length,
      inquiries
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ message: 'Failed to fetch inquiries' });
  }
};

// Reply to an inquiry (Admin only) — text reply saved to DB
exports.replyToInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const inquiry = await ContactInquiry.findById(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }

    inquiry.isRead = true;
    inquiry.repliedAt = new Date();
    inquiry.adminReply = replyMessage.trim();
    inquiry.replySeen = false;
    await inquiry.save();

    res.status(200).json({ message: 'Reply saved successfully' });

  } catch (error) {
    console.error('Error replying to inquiry:', error);
    res.status(500).json({ message: 'Failed to save reply' });
  }
};

// Delete an inquiry (Admin only)
exports.deleteInquiry = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await ContactInquiry.findByIdAndDelete(inquiryId);
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.status(200).json({ message: 'Inquiry deleted' });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    res.status(500).json({ message: 'Failed to delete inquiry' });
  }
};

// Mark inquiry as read
exports.markAsRead = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    const inquiry = await ContactInquiry.findByIdAndUpdate(inquiryId, { isRead: true }, { new: true });
    if (!inquiry) {
      return res.status(404).json({ message: 'Inquiry not found' });
    }
    res.status(200).json(inquiry);
  } catch (error) {
    console.error('Error marking inquiry read:', error);
    res.status(500).json({ message: 'Failed to update inquiry' });
  }
};

// Get count of unseen replies for the logged-in user
exports.getUnseenRepliesCount = async (req, res) => {
  try {
    const count = await ContactInquiry.countDocuments({
      user: req.user.id,
      adminReply: { $ne: null },
      replySeen: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unseen replies count:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all user's replies as seen
exports.markRepliesSeen = async (req, res) => {
  try {
    await ContactInquiry.updateMany(
      { user: req.user.id, replySeen: false },
      { replySeen: true }
    );
    res.json({ message: 'All replies marked as seen' });
  } catch (error) {
    console.error('Error marking replies seen:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
