const Newsletter = require('../models/Newsletter');

exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    let existing = await Newsletter.findOne({ email });
    if (existing) {
      if (existing.status === 'active') {
        return res.status(400).json({ success: false, message: 'Already subscribed' });
      }
      existing.status = 'active';
      await existing.save();
    } else {
      await Newsletter.create({ email });
    }

    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
