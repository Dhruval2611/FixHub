import React from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash, faShoppingCart, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, loading } = useCart();
  const navigate = useNavigate();

  if (loading) return <div className="cart-loader">Loading cart...</div>;

  if (cart.length === 0) {
    return (
      <div className="cart-container cart-empty-container">
        <div className="cart-empty-content">
          <FontAwesomeIcon icon={faShoppingCart} className="empty-cart-icon" />
          <h2>Your Cart is Empty</h2>
          <p>Add some services to your cart and make your life easier.</p>
          <button className="browse-btn" onClick={() => navigate('/services')}>
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <button className="cart-back-btn" onClick={() => navigate(-1)} title="Go back">
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div>
          <h1>Shopping Cart</h1>
          <p>You have {cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-items-section">
          {cart.map((item) => (
            <div className="cart-item-card" key={item.serviceId._id}>
              <div className="item-info">
                <h3>{item.serviceId.name}</h3>
                <p className="item-category">{item.serviceId.category}</p>
                <p className="item-price">₹{item.serviceId.price * item.quantity}</p>
              </div>
              <div className="item-actions">
                <div className="item-quantity">
                  <button onClick={() => updateQuantity(item.serviceId._id, item.quantity - 1)}>
                    <FontAwesomeIcon icon={faMinus} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.serviceId._id, item.quantity + 1)}>
                    <FontAwesomeIcon icon={faPlus} />
                  </button>
                </div>
                <button className="remove-item-btn" onClick={() => removeFromCart(item.serviceId._id)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary-section">
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
              <span>₹{getCartTotal()}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{getCartTotal()}</span>
            </div>
            <button className="checkout-btn" onClick={() => navigate('/checkout')}>
              Proceed to Checkout <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
