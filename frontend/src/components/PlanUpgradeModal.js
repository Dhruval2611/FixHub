import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark, faCheck, faCrown, faRocket,
  faCreditCard, faLock, faArrowLeft, faArrowRight,
  faShieldHalved, faSpinner, faCircleCheck,
  faMobileScreen, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import './PlanUpgradeModal.css';

const PLAN_DETAILS = {
  Premium: {
    name: 'Premium',
    icon: faCrown,
    price: 49,
    discount: 15,
    description: 'Most popular for regular users',
    features: [
      'Everything in Basic',
      'Priority booking & scheduling',
      '15% discount on all services',
      '24/7 phone support',
      'Extended warranty coverage',
      'Free emergency callouts (2/month)',
      'Dedicated account manager',
    ],
  },
  Elite: {
    name: 'Elite',
    icon: faRocket,
    price: 99,
    discount: 25,
    description: 'Ultimate experience for power users',
    features: [
      'Everything in Premium',
      'VIP priority service',
      '25% discount on all services',
      'Concierge support',
      'Lifetime warranty on all work',
      'Personal service coordinator',
      'Exclusive access to new services',
    ],
  },
  'Premium Yearly': {
    name: 'Premium Yearly',
    icon: faCrown,
    price: 499,
    discount: 15,
    description: 'Most popular for regular users',
    features: [
      'Everything in Basic',
      'Priority booking & scheduling',
      '15% discount on all services',
      '24/7 phone support',
      'Extended warranty coverage',
      'Free emergency callouts (24/year)',
      'Dedicated account manager',
    ],
  },
  'Elite Yearly': {
    name: 'Elite Yearly',
    icon: faRocket,
    price: 999,
    discount: 25,
    description: 'Ultimate experience for power users',
    features: [
      'Everything in Premium',
      'VIP priority service',
      '25% discount on all services',
      'Concierge support',
      'Lifetime warranty on all work',
      'Unlimited free emergency visits',
      'Personal service coordinator',
      'Exclusive access to new services',
    ],
  },
};

const PAYMENT_METHODS = [
  { id: 'card',       label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay accepted',  icon: faCreditCard    },
  { id: 'upi',        label: 'UPI',                 desc: 'GPay, PhonePe, Paytm, BHIM',        icon: faMobileScreen  },
  { id: 'net_banking',label: 'Net Banking',         desc: 'All major Indian banks supported',   icon: faMoneyBillWave },
];

const STEPS = ['Plan', 'Payment', 'Verify'];

const PlanUpgradeModal = ({
  currentPlan,
  targetPlan,
  upgradePrice,
  originalPrice,
  isFirstTime,
  onClose,
  onConfirm,
  loading,
  onRequestOtp,
}) => {
  const planDetails = PLAN_DETAILS[targetPlan];
  const isUpgrade = currentPlan !== 'Basic';
  const finalPrice = upgradePrice || planDetails?.price || 0;
  const savings = originalPrice > finalPrice ? originalPrice - finalPrice : 0;

  const [step, setStep] = useState(0); // 0: Plan, 1: Payment, 2: Verify

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentError, setPaymentError] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');

  // OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatCardNumber = (v) => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim();
  const formatExpiry = (v) => { const c = v.replace(/\D/g,'').slice(0,4); return c.length>=3?c.slice(0,2)+'/'+c.slice(2):c; };

  const validatePayment = () => {
    setPaymentError('');
    if (paymentMethod === 'card') {
      if (cardData.number.replace(/\s/g,'').length !== 16) { setPaymentError('Card number must be 16 digits.'); return false; }
      if (!cardData.name.trim()) { setPaymentError('Cardholder name is required.'); return false; }
      if (cardData.expiry.length < 5) { setPaymentError('Enter a valid expiry (MM/YY).'); return false; }
      if (cardData.cvv.length < 3) { setPaymentError('CVV must be 3–4 digits.'); return false; }
    } else if (paymentMethod === 'upi') {
      if (!upiId.includes('@')) { setPaymentError('Enter a valid UPI ID (e.g. name@upi).'); return false; }
    } else if (paymentMethod === 'net_banking') {
      if (!bankName) { setPaymentError('Please select your bank.'); return false; }
    }
    return true;
  };

  const handlePaymentNext = () => {
    if (validatePayment()) setStep(2);
  };

  const handleRequestOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    try {
      await onRequestOtp();
      setOtpSent(true);
      setResendTimer(30);
    } catch {
      setOtpError('Failed to send code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (!loading) {
      isSubmittingRef.current = false;
    }
  }, [loading]);

  const handleConfirmWithOtp = async () => {
    if (otp.length < 6) { setOtpError('Enter the 6-digit code sent to your email.'); return; }
    if (isSubmittingRef.current || loading) return;
    
    isSubmittingRef.current = true;
    try {
      await onConfirm(otp);
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
      isSubmittingRef.current = false;
    }
  };

  if (!planDetails) return null;

  return (
    <div className="pum-overlay">
      <div className="pum-modal">

        {/* ── Dark Hero Header ── */}
        <div className="pum-hero">
          <div className="pum-hero-top">
            <div className="pum-hero-brand">
              <div className="pum-hero-logo">FH</div>
              <span>FixHub</span>
              {step > 0 && (
                <button className="pum-back-btn" onClick={() => setStep(s => s - 1)}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
            </div>
            <button className="pum-close-btn" onClick={onClose} disabled={loading}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="pum-hero-amount">
            <div className="pum-hero-amount-right">
              <span className="pum-hero-amount-label">
                {isUpgrade ? `Upgrade to ${targetPlan}` : `Purchase ${targetPlan} Plan`}
                {isFirstTime && <div style={{color: '#34d399', fontSize: '0.85rem', fontWeight: 700, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px'}}><FontAwesomeIcon icon={faCheck} /> 7-Day Free Trial</div>}
              </span>
              <span className="pum-hero-amount-value">&#8377;{finalPrice}</span>
              {savings > 0 && <span className="pum-hero-savings">You save &#8377;{savings}</span>}
            </div>
            <div className="pum-hero-lock">
              <FontAwesomeIcon icon={faLock} />
              <span>Secured</span>
            </div>
          </div>
        </div>

        {/* ── Step Indicator ── */}
        <div className="pum-steps-bar">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`pum-step-item ${i === step ? 'active' : i < step ? 'done' : ''}`}>
                <div className="pum-step-num">
                  {i < step ? <FontAwesomeIcon icon={faCheck} /> : i + 1}
                </div>
                <span>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`pum-step-line ${i < step ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── STEP 0: Plan Details ── */}
        {step === 0 && (
          <div className="pum-body">
            {/* Plan icon + title */}
            <div className="pum-plan-header">
              <div className="pum-plan-icon-wrap">
                <FontAwesomeIcon icon={planDetails.icon} />
              </div>
              <div>
                <div className="pum-plan-name">{planDetails.name} Plan</div>
                <div className="pum-plan-desc">{planDetails.description}</div>
              </div>
            </div>

            {/* Original price */}
            {savings > 0 && (
              <div className="pum-original-price-row">
                <span className="pum-label">Original Price</span>
                <span className="pum-original-price-val">&#8377;{originalPrice}</span>
              </div>
            )}

            <div className="pum-section-label">What's Included</div>
            <div className="pum-features-list">
              {planDetails.features.map((f, i) => (
                <div key={i} className="pum-feature-item">
                  <FontAwesomeIcon icon={faCircleCheck} className="pum-feature-icon" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="pum-secure-note">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>{planDetails.discount}% discount applied on all services with this plan</span>
            </div>
          </div>
        )}

        {/* ── STEP 1: Payment ── */}
        {step === 1 && (
          <div className="pum-body">
            <div className="pum-section-label">Select Payment Method</div>
            <div className="pum-methods">
              {PAYMENT_METHODS.map(m => (
                <label key={m.id} className={`pum-method-card ${paymentMethod === m.id ? 'pum-method-selected' : ''}`}>
                  <input type="radio" name="pum-pay" value={m.id} checked={paymentMethod === m.id}
                    onChange={() => { setPaymentMethod(m.id); setPaymentError(''); }} />
                  <div className="pum-method-icon-wrap">
                    <FontAwesomeIcon icon={m.icon} />
                  </div>
                  <div className="pum-method-text">
                    <span className="pum-method-name">{m.label}</span>
                    <span className="pum-method-desc">{m.desc}</span>
                  </div>
                  <div className="pum-method-check">
                    {paymentMethod === m.id && <FontAwesomeIcon icon={faCircleCheck} />}
                  </div>
                </label>
              ))}
            </div>

            {/* Card form */}
            {paymentMethod === 'card' && (
              <div className="pum-card-form">
                <div className="pum-fg">
                  <label>Card Number</label>
                  <input type="text" placeholder="1234 5678 9012 3456" maxLength={19}
                    value={cardData.number}
                    onChange={e => setCardData({...cardData, number: formatCardNumber(e.target.value)})} />
                </div>
                <div className="pum-fg">
                  <label>Cardholder Name</label>
                  <input type="text" placeholder="Name on card"
                    value={cardData.name}
                    onChange={e => setCardData({...cardData, name: e.target.value})} />
                </div>
                <div className="pum-form-row">
                  <div className="pum-fg">
                    <label>Expiry</label>
                    <input type="text" placeholder="MM/YY" maxLength={5}
                      value={cardData.expiry}
                      onChange={e => setCardData({...cardData, expiry: formatExpiry(e.target.value)})} />
                  </div>
                  <div className="pum-fg">
                    <label>CVV</label>
                    <input type="password" placeholder="•••" maxLength={4}
                      value={cardData.cvv}
                      onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/\D/g,'')})} />
                  </div>
                </div>
              </div>
            )}

            {/* UPI form */}
            {paymentMethod === 'upi' && (
              <div className="pum-upi-form">
                <div className="pum-fg">
                  <label>UPI ID</label>
                  <input type="text" placeholder="yourname@upi" value={upiId}
                    onChange={e => setUpiId(e.target.value)} />
                </div>
                <p className="pum-hint">Enter your UPI ID and proceed. A payment request will be sent to your UPI app.</p>
              </div>
            )}

            {/* Net Banking form */}
            {paymentMethod === 'net_banking' && (
              <div className="pum-nb-form">
                <div className="pum-fg">
                  <label>Select Bank</label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)}>
                    <option value="">-- Choose your bank --</option>
                    <option>State Bank of India</option>
                    <option>HDFC Bank</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                    <option>Punjab National Bank</option>
                    <option>Bank of Baroda</option>
                    <option>Other</option>
                  </select>
                </div>
                <p className="pum-hint">You will be redirected to your bank's secure portal.</p>
              </div>
            )}

            {paymentError && <div className="pum-error">{paymentError}</div>}

            <div className="pum-secure-note">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>256-bit SSL encrypted &amp; 100% secure. This is a demo payment — no real charges apply.</span>
            </div>
          </div>
        )}

        {/* ── STEP 2: OTP Verify ── */}
        {step === 2 && (
          <div className="pum-body pum-otp-body">
            <div className="pum-otp-icon">
              <FontAwesomeIcon icon={faLock} />
            </div>
            <h3 className="pum-otp-title">Verify Your Identity</h3>
            <p className="pum-otp-desc">
              We'll send a one-time code to your registered email address to authorize this transaction.
            </p>

            {!otpSent ? (
              <button className="pum-send-otp-btn" onClick={handleRequestOtp} disabled={sendingOtp}>
                {sendingOtp
                  ? <><FontAwesomeIcon icon={faSpinner} className="pum-spin" /> Sending Code...</>
                  : <><FontAwesomeIcon icon={faLock} /> Send Verification Code</>}
              </button>
            ) : (
              <>
                <div className="pum-otp-sent-notice">
                  ✅ Code sent to your email.
                  <button className="pum-resend-link" onClick={handleRequestOtp} disabled={sendingOtp || resendTimer > 0}
                    style={{ color: (sendingOtp || resendTimer > 0) ? '#9CA3AF' : '#1F2937', cursor: (sendingOtp || resendTimer > 0) ? 'not-allowed' : 'pointer' }}
                  >
                    {sendingOtp ? 'Sending...' : resendTimer > 0 ? `Resend (${formatTimer(resendTimer)})` : 'Resend'}
                  </button>
                </div>
                <div className="pum-fg pum-otp-fg">
                  <label>Enter 6-digit code</label>
                  <input
                    type="text"
                    className="pum-otp-input"
                    placeholder="• • • • • •"
                    maxLength={6}
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g,'')); setOtpError(''); }}
                  />
                </div>
              </>
            )}

            {otpError && <div className="pum-error">{otpError}</div>}
          </div>
        )}

        {/* ── Footer ── */}
        <div className="pum-footer">
          <button className="pum-cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>

          {step === 0 && (
            <button className="pum-primary-btn" onClick={() => setStep(1)}>
              Proceed to Payment <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}

          {step === 1 && (
            <button className="pum-primary-btn" onClick={handlePaymentNext}>
              Continue <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}

          {step === 2 && otpSent && (
            <button className="pum-primary-btn" onClick={handleConfirmWithOtp}
              disabled={loading || otp.length < 6}>
              {loading
                ? <><FontAwesomeIcon icon={faSpinner} className="pum-spin" /> Activating...</>
                : <>Confirm &amp; Activate &#8377;{finalPrice}</>
              }
            </button>
          )}

          {step === 2 && !otpSent && (
            <button className="pum-primary-btn pum-disabled-btn" disabled>
              Send Code to Continue
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default PlanUpgradeModal;
