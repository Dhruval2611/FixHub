import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  faTrash, faMapPin,
  faCalendarAlt, faClock, faNoteSticky, faCheckCircle, faShoppingCart,
  faDownload, faArrowRight, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Payment from './Payment';
import './Checkout.css';
import { checkoutReceiptHTML } from './receiptTemplate';
import ReceiptPreview from './ReceiptPreview';
import downloadReceiptPDF from './downloadReceipt';

const downloadSuccessReceipt = (data) => {
  if (!data) return;
  const html = checkoutReceiptHTML(data);
  return downloadReceiptPDF(html, `FixHub-Receipt-${data.transactionId || 'receipt'}`);
};

const Checkout = () => {
  const { cart, removeFromCart, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();

  // Personal info
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    countryCode: '+91'
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Country phone config
  const COUNTRY_PHONES = [
    { code: '+91',  flag: '\u{1F1EE}\u{1F1F3}', label: 'India',         digits: 10 },
    { code: '+1',   flag: '\u{1F1FA}\u{1F1F8}', label: 'USA',           digits: 10 },
    { code: '+44',  flag: '\u{1F1EC}\u{1F1E7}', label: 'UK',            digits: 10 },
    { code: '+61',  flag: '\u{1F1E6}\u{1F1FA}', label: 'Australia',     digits: 9  },
    { code: '+971', flag: '\u{1F1E6}\u{1F1EA}', label: 'UAE',           digits: 9  },
    { code: '+86',  flag: '\u{1F1E8}\u{1F1F3}', label: 'China',         digits: 11 },
    { code: '+81',  flag: '\u{1F1EF}\u{1F1F5}', label: 'Japan',         digits: 10 },
    { code: '+49',  flag: '\u{1F1E9}\u{1F1EA}', label: 'Germany',       digits: 11 },
    { code: '+33',  flag: '\u{1F1EB}\u{1F1F7}', label: 'France',        digits: 9  },
    { code: '+7',   flag: '\u{1F1F7}\u{1F1FA}', label: 'Russia',        digits: 10 },
  ];

  const getCountry = (code) => COUNTRY_PHONES.find(c => c.code === code) || COUNTRY_PHONES[0];

  // Validators
  const validateName = (name) => {
    if (!name.trim()) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s'.]+$/.test(name.trim())) return 'Only letters, spaces, apostrophes and dots allowed';
    return '';
  };

  const validateEmail = (email) => {
    if (!email.trim()) return 'Email is required';
    const re = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
    if (!re.test(email.trim())) return 'Enter a valid email address';
    if (email.length > 254) return 'Email is too long';
    return '';
  };

  const validatePhone = (phone, countryCode) => {
    const digits = phone.replace(/\D/g, '');
    const country = getCountry(countryCode);
    if (!digits) return 'Phone number is required';
    if (digits.length !== country.digits)
      return `${country.label} numbers must be exactly ${country.digits} digits`;
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'name':  return validateName(value);
      case 'email': return validateEmail(value);
      case 'phone': return validatePhone(value, customerInfo.countryCode);
      default:      return '';
    }
  };

  const validateAll = () => {
    const newErrors = {
      name:  validateName(customerInfo.name),
      email: validateEmail(customerInfo.email),
      phone: validatePhone(customerInfo.phone, customerInfo.countryCode),
    };
    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true });
    return !newErrors.name && !newErrors.email && !newErrors.phone;
  };

  // Service booking details
  const [serviceBookings, setServiceBookings] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  // Initialize booking details
  useEffect(() => {
    const initialBookings = {};
    cart.forEach(item => {
      const sId = item.serviceId?._id;
      if (sId && !serviceBookings[sId]) {
        initialBookings[sId] = {
          address: '',
          date: '',
          time: '',
          notes: ''
        };
      }
    });
    if (Object.keys(initialBookings).length > 0) {
      setServiceBookings(prev => ({ ...prev, ...initialBookings }));
    }
  }, [cart]);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;

    // Name: allow only letters, spaces, apostrophe, dot
    if (name === 'name' && value && !/^[a-zA-Z\s'.]*$/.test(value)) return;
    // Phone: allow only digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const country = getCountry(customerInfo.countryCode);
      if (digitsOnly.length > country.digits) return;
      setCustomerInfo(prev => ({ ...prev, phone: digitsOnly }));
      if (touched.phone) setErrors(prev => ({ ...prev, phone: validatePhone(digitsOnly, customerInfo.countryCode) }));
      return;
    }

    setCustomerInfo(prev => ({ ...prev, [name]: value }));
    if (touched[name]) setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    const country = getCountry(code);
    const trimmed = customerInfo.phone.slice(0, country.digits);
    setCustomerInfo(prev => ({ ...prev, countryCode: code, phone: trimmed }));
    if (touched.phone) setErrors(prev => ({ ...prev, phone: validatePhone(trimmed, code) }));
  };

  const handleServiceBookingChange = (serviceId, field, value) => {
    setServiceBookings(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!validateAll()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      navigate('/login');
      return;
    }

    setShowPayment(true);
  };

  const handlePaymentSuccess = (payload) => {
    clearCart();
    setShowPayment(false);
    setPaymentData(payload?.receiptData || null);
    setPaymentSuccess(true);
    toast.success('Order placed! Vendors have been notified.', { autoClose: 3000 });
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  // Success screen
  if (paymentSuccess) {
    const d = paymentData;
    const previewHtml = d ? checkoutReceiptHTML(d) : '<div style="padding:12px">No receipt</div>';
    return (
      <div className="cko-success-page">
        <div className="cko-success-top-bar">
          <div className="cko-success-top-info">
            <h1>Order Placed!</h1>
            <p>Matching vendors have been notified — you'll hear back soon!</p>
          </div>
          <div className="cko-success-top-actions">
            {d && (
              <button className="cko-success-download-btn" onClick={() => downloadSuccessReceipt(d)}>
                <FontAwesomeIcon icon={faDownload} /> Download Receipt
              </button>
            )}
          </div>
        </div>
        <div className="cko-success-receipt-wrap">
          <ReceiptPreview html={previewHtml} />
        </div>
        <div className="cko-success-bottom-actions">
          <button className="cko-success-bookings-btn" onClick={() => navigate('/your-bookings')}>View My Bookings</button>
          <button className="cko-success-explore-btn" onClick={() => navigate('/services')}>Explore Services <FontAwesomeIcon icon={faArrowRight} /></button>
        </div>
      </div>
    );
  }

  // Empty cart
  if (cart.length === 0) {
    return (
      <div className="cko-cart-container">
        <div className="cko-cart-empty-shell">
          <div className="cko-cart-empty">
            <FontAwesomeIcon icon={faShoppingCart} className="cko-cart-empty-icon" />
            <h2>Your Cart is Empty</h2>
            <p>Add services to proceed to checkout. Browse our catalogue and pick a service.</p>
            <button
              type="button"
              onClick={() => navigate('/services')}
              className="cko-cart-primary-btn"
            >
              Browse services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <button type="button" className="checkout-back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back
        </button>
        <h1>Checkout</h1>
        <p>Complete your booking securely</p>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form">
        <div className="checkout-content">
          {/* Step 1: Personal Information */}
          <div className="personal-info-section">
            <div className="personal-info-header">
              <div className="pinfo-step-badge">1</div>
              <div>
                <h2>Your Information</h2>
                <p>Tell us who you are so we can confirm your bookings</p>
              </div>
            </div>
            <div className="form-row">
              <div className={`form-group${touched.name && errors.name ? ' has-error' : ''}`}>
                <label>Full Name <span className="req">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                  onBlur={handleBlur}
                  placeholder="John Doe"
                  required
                />
                {touched.name && errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className={`form-group${touched.email && errors.email ? ' has-error' : ''}`}>
                <label>Email Address <span className="req">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  onBlur={handleBlur}
                  placeholder="you@example.com"
                  required
                />
                {touched.email && errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className={`form-group${touched.phone && errors.phone ? ' has-error' : ''}`}>
                <label>Phone Number <span className="req">*</span></label>
                <div className="phone-input-wrap">
                  <select
                    className="country-code-select"
                    value={customerInfo.countryCode}
                    onChange={handleCountryChange}
                  >
                    {COUNTRY_PHONES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleCustomerInfoChange}
                    onBlur={handleBlur}
                    placeholder={`${'X'.repeat(getCountry(customerInfo.countryCode).digits)}`}
                    required
                  />
                </div>
                {touched.phone && errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="checkout-two-column">
            {/* Step 2: Service Details */}
            <div className="services-booking-section">
              <div className="section-header-inline">
                <h2>Service Details</h2>
                <span className="service-count">{cart.length} {cart.length === 1 ? 'Service' : 'Services'}</span>
              </div>

              {cart.map((item, index) => (
                <div key={item._id} className="service-booking-card">
                  <div className="service-booking-header">
                    <div className="header-content">
                      <div className="service-title-row">
                        <span className="service-number">#{index + 1}</span>
                        <h3>{item.serviceId?.name}</h3>
                      </div>
                      <span className="service-price">&#8377;{item.serviceId?.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.serviceId?._id)}
                      className="remove-btn"
                      title="Remove service"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className="booking-details-form">
                    <div className="form-group">
                      <label><FontAwesomeIcon icon={faMapPin} /> Service Address *</label>
                      <textarea
                        value={serviceBookings[item.serviceId?._id]?.address || ''}
                        onChange={(e) => handleServiceBookingChange(item.serviceId?._id, 'address', e.target.value)}
                        placeholder="Flat no, Street, Landmark..."
                        required
                        rows="2"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label><FontAwesomeIcon icon={faCalendarAlt} /> Date *</label>
                        <input
                          type="date"
                          value={serviceBookings[item.serviceId?._id]?.date || ''}
                          onChange={(e) => handleServiceBookingChange(item.serviceId?._id, 'date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label><FontAwesomeIcon icon={faClock} /> Time *</label>
                        <input
                          type="time"
                          value={serviceBookings[item.serviceId?._id]?.time || ''}
                          onChange={(e) => handleServiceBookingChange(item.serviceId?._id, 'time', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label><FontAwesomeIcon icon={faNoteSticky} /> Notes</label>
                      <textarea
                        value={serviceBookings[item.serviceId?._id]?.notes || ''}
                        onChange={(e) => handleServiceBookingChange(item.serviceId?._id, 'notes', e.target.value)}
                        placeholder="Any special instructions?"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="checkout-footer">
              <div className="order-summary">
                <h3 className="summary-title">Order Summary</h3>
                
                <div className="summary-items">
                  {cart.map((item) => (
                    <div key={item._id} className="summary-item">
                      <span className="summary-label">{item.serviceId?.name}</span>
                      <span className="summary-price">&#8377;{(item.serviceId?.price * (item.quantity || 1)) || 0}</span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                <div className="total-section">
                  <span className="total-label">Total Amount</span>
                  <span className="total-amount">&#8377;{getCartTotal() || 0}</span>
                </div>
              </div>

              <button type="submit" className="checkout-btn" disabled={loading}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{loading ? 'Processing...' : 'Proceed to Payment'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Payment Modal */}
      {showPayment && (
        <Payment
          amount={getCartTotal()}
          customerInfo={{ ...customerInfo, phone: `${customerInfo.countryCode} ${customerInfo.phone}` }}
          bookingsData={cart.map(item => ({
            service: item.serviceId?._id,
            name: item.serviceId?.name,
            price: item.serviceId?.price,
            quantity: item.quantity || 1,
            date: serviceBookings[item.serviceId?._id]?.date,
            time: serviceBookings[item.serviceId?._id]?.time,
            address: serviceBookings[item.serviceId?._id]?.address,
            notes: serviceBookings[item.serviceId?._id]?.notes || '',
          }))}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      )}
    </div>
  );
};

export default Checkout;
