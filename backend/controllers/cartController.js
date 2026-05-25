const Cart = require('../models/Cart');
const Service = require('../models/Service');

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.serviceId');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Clean up stale items where the service no longer exists
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item.serviceId != null);
    if (cart.items.length !== originalLength) {
      await cart.save();
      cart = await Cart.findOne({ user: req.user.id }).populate('items.serviceId');
    }

    res.json({ success: true, data: cart });
  } catch (error) {
    console.error('getCart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { serviceId, quantity } = req.body;

    if (!serviceId) {
      return res.status(400).json({ success: false, message: 'Service ID is required' });
    }

    // Verify the service exists
    const serviceExists = await Service.findById(serviceId);
    if (!serviceExists) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const itemIndex = cart.items.findIndex(p => p.serviceId.toString() === serviceId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity || 1;
    } else {
      cart.items.push({ serviceId, quantity: quantity || 1 });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.serviceId');
    // Filter out any null populated items
    updatedCart.items = updatedCart.items.filter(item => item.serviceId != null);
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('addToCart error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { serviceId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(p => p.serviceId.toString() === serviceId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.serviceId');
      return res.json({ success: true, data: updatedCart });
    }
    res.status(404).json({ success: false, message: 'Item not found in cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { serviceId } = req.params;
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.serviceId.toString() !== serviceId);
    await cart.save();
    const updatedCart = await Cart.findOne({ user: req.user.id }).populate('items.serviceId');
    res.json({ success: true, data: updatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
