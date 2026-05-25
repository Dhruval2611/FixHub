import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faCreditCard, faMobileScreen, faBuilding,
  faXmark, faShieldHalved, faDownload, faCircleCheck,
  faSpinner, faLock, faArrowRight, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import './Payment.css';
import { paymentReceiptHTML } from './receiptTemplate';
import ReceiptPreview from './ReceiptPreview';
import downloadReceiptPDF from './downloadReceipt';

const PAYMENT_METHODS = [
  { id: 'Cash on Service', label: 'Cash on Service',    desc: 'Pay in cash when the professional arrives',   icon: faMoneyBillWave },
  { id: 'Card',            label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay accepted',            icon: faCreditCard    },
  { id: 'UPI',             label: 'UPI',                 desc: 'GPay, PhonePe, Paytm, BHIM',                 icon: faMobileScreen  },
  { id: 'Net Banking',     label: 'Net Banking',         desc: 'All major Indian banks supported',            icon: faBuilding      },
];

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda', 'Other',
];

const downloadReceipt = (data) => {
  const html = paymentReceiptHTML(data);
  return downloadReceiptPDF(html, `FixHub-Receipt-${data.transactionId || 'receipt'}`);
};

/* ── helpers ── */
const formatCardNumber = (v) =>
  v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => {
  const c = v.replace(/\D/g, '').slice(0, 4);
  return c.length >= 3 ? c.slice(0, 2) + '/' + c.slice(2) : c;
};

/* ── Main Component ── */
const Payment = ({ amount, customerInfo, bookingsData, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('Cash on Service');
  const [screen, setScreen] = useState('select');    // 'select' | 'details' | 'processing' | 'receipt'
  const [procStep, setProcStep]   = useState(0);
  const [receiptData, setReceiptData] = useState(null);
  const [successPayload, setSuccessPayload] = useState(null);

  /* form state */
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId]       = useState('');
  const [bankName, setBankName] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const needsDetails = paymentMethod !== 'Cash on Service';

  /* ── validation ── */
  const validateDetails = () => {
    setPaymentError('');
    if (paymentMethod === 'Card') {
      if (cardData.number.replace(/\s/g, '').length !== 16)
        return setPaymentError('Card number must be 16 digits.'), false;
      if (!cardData.name.trim())
        return setPaymentError('Cardholder name is required.'), false;
      if (cardData.expiry.length < 5)
        return setPaymentError('Enter a valid expiry (MM/YY).'), false;
      if (cardData.cvv.length < 3)
        return setPaymentError('CVV must be 3–4 digits.'), false;
    } else if (paymentMethod === 'UPI') {
      if (!upiId.includes('@'))
        return setPaymentError('Enter a valid UPI ID (e.g. name@upi).'), false;
    } else if (paymentMethod === 'Net Banking') {
      if (!bankName)
        return setPaymentError('Please select your bank.'), false;
    }
    return true;
  };

  const handleProceedToDetails = () => {
    if (!needsDetails) { handlePayment(); return; }
    setScreen('details');
  };

  /* ── Process payment ── */
  const handlePayment = async () => {
    if (needsDetails && !validateDetails()) return;
    setScreen('processing');
    setProcStep(0);
    timers.current.push(setTimeout(() => setProcStep(1), 1200));
    timers.current.push(setTimeout(() => setProcStep(2), 2600));

    const startTime = Date.now();
    try {
      const token = localStorage.getItem('token');

      const { data: initiated } = await axios.post(
        'http://localhost:5000/api/payments/initiate',
        { amount, paymentMethod, customerInfo },
        { headers: { 'x-auth-token': token } }
      );
      const { paymentId, transactionId } = initiated;

      await axios.post(
        'http://localhost:5000/api/payments/process',
        { paymentId, success: true },
        { headers: { 'x-auth-token': token } }
      );

      const { data: bookingsResponse } = await axios.post(
        'http://localhost:5000/api/payments/create-bookings',
        { paymentId, bookingsData },
        { headers: { 'x-auth-token': token } }
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) await new Promise(r => setTimeout(r, 3000 - elapsed));

      timers.current.forEach(clearTimeout);
      setProcStep(2);
      await new Promise(r => setTimeout(r, 350));

      const receipt = {
        transactionId, paymentId,
        method: paymentMethod,
        amount, customerInfo,
        bookings: bookingsData,
        status: 'pending',
        date: new Date().toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        }),
      };
      setReceiptData(receipt);
      setSuccessPayload({ ...bookingsResponse, receiptData: receipt });
      setScreen('receipt');
    } catch (error) {
      timers.current.forEach(clearTimeout);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      setScreen(needsDetails ? 'details' : 'select');
    }
  };

  /* ══════════════════════════════════════
     PROCESSING SCREEN
  ══════════════════════════════════════ */
  if (screen === 'processing') {
    const steps = [
      { label: 'Authenticating', done: procStep >= 1, active: procStep === 0 },
      { label: 'Processing',     done: procStep >= 2, active: procStep === 1 },
      { label: 'Confirming',     done: false,         active: procStep === 2 },
    ];
    return (
      <div className="pay-overlay">
        <div className="pay-modal pay-processing-modal">
          <div className="pay-processing-inner">
            <div className="pay-ring-wrapper">
              <div className="pay-ring" />
              <div className="pay-ring-logo">FH</div>
            </div>
            <h3>Processing Payment</h3>
            <p>Please hold on while we securely process your transaction</p>
            <div className="pay-processing-steps">
              {steps.map((s, i) => (
                <React.Fragment key={s.label}>
                  <div className={`pay-proc-step${s.done ? ' pay-proc-done' : s.active ? ' pay-proc-active' : ''}`}>
                    {s.done
                      ? <FontAwesomeIcon icon={faCircleCheck} />
                      : s.active
                        ? <FontAwesomeIcon icon={faSpinner} spin />
                        : <div className="pay-proc-dot" />}
                    <span>{s.label}</span>
                  </div>
                  {i < 2 && <div className={`pay-proc-divider${procStep > i ? ' pay-proc-divider-done' : ''}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     RECEIPT SCREEN
  ══════════════════════════════════════ */
  if (screen === 'receipt' && receiptData) {
    const previewHtml = paymentReceiptHTML(receiptData);
    return (
      <div className="pay-overlay">
        <div className="pay-modal pay-receipt-modal" style={{width: 'calc(700px + 40px)', maxWidth: '100%'}}>
          <div style={{padding:12, display:'flex', justifyContent:'flex-end', gap:8}}>
            <button className="pay-download-btn" onClick={() => downloadReceipt(receiptData)}>
              <FontAwesomeIcon icon={faDownload} /> Download Receipt
            </button>
            <button className="pay-done-btn" onClick={() => onSuccess(successPayload)}>Done</button>
          </div>
          <div style={{padding:'0 12px 12px'}}>
            <ReceiptPreview html={previewHtml} />
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════
     SHARED HERO + STEP NAV
  ══════════════════════════════════════ */
  const isDetailsScreen = screen === 'details';

  return (
    <div className="pay-overlay">
      <div className="pay-modal pay-flex-modal">

        {/* ── Dark Hero ── */}
        <div className="pay-hero">
          <div className="pay-hero-top">
            <div className="pay-hero-brand">
              <div className="pay-hero-logo">FH</div>
              <span>FixHub</span>
              {isDetailsScreen && (
                <button className="pay-back-btn" onClick={() => { setScreen('select'); setPaymentError(''); }}>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </button>
              )}
            </div>
            <button className="pay-close-btn" onClick={onCancel}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="pay-hero-amount-row">
            <div className="pay-hero-amount-right">
              <span className="pay-hero-amount-label">Amount Due</span>
              <span className="pay-hero-amount-value">&#8377;{amount}</span>
            </div>
            <div className="pay-hero-lock">
              <FontAwesomeIcon icon={faLock} />
              <span>Secured</span>
            </div>
          </div>
        </div>

        {/* ── Step indicator ── */}
        <div className="pay-steps-bar">
          <div className={`pay-step-item ${!isDetailsScreen ? 'pay-step-active' : 'pay-step-done'}`}>
            <div className="pay-step-num">{isDetailsScreen ? <FontAwesomeIcon icon={faCircleCheck} /> : '1'}</div>
            <span>Method</span>
          </div>
          <div className={`pay-step-line ${isDetailsScreen ? 'pay-step-line-done' : ''}`} />
          <div className={`pay-step-item ${isDetailsScreen ? 'pay-step-active' : ''}`}>
            <div className="pay-step-num">2</div>
            <span>Details</span>
          </div>
        </div>

        {/* ══════════════ SCREEN: SELECT ══════════════ */}
        {screen === 'select' && (
          <div className="pay-body">
            <div className="pay-section-label">Select Payment Method</div>
            <div className="pay-methods">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.id}
                  className={`pay-method-card${paymentMethod === m.id ? ' pay-method-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={paymentMethod === m.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <div className="pay-method-icon-wrap">
                    <FontAwesomeIcon icon={m.icon} />
                  </div>
                  <div className="pay-method-text">
                    <span className="pay-method-name">{m.label}</span>
                    <span className="pay-method-desc">{m.desc}</span>
                  </div>
                  <div className="pay-method-check">
                    {paymentMethod === m.id && <FontAwesomeIcon icon={faCircleCheck} />}
                  </div>
                </label>
              ))}
            </div>

            <div className="pay-secure-note">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>256-bit SSL encrypted &amp; 100% secure</span>
            </div>
          </div>
        )}

        {/* ══════════════ SCREEN: DETAILS ══════════════ */}
        {screen === 'details' && (
          <div className="pay-body">

            {/* Card */}
            {paymentMethod === 'Card' && (
              <>
                <div className="pay-section-label">Card Details</div>
                <div className="pay-form-container">
                  <div className="pay-fg">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      value={cardData.number}
                      onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    />
                  </div>
                  <div className="pay-fg">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="Name on card"
                      value={cardData.name}
                      onChange={e => setCardData({ ...cardData, name: e.target.value })}
                    />
                  </div>
                  <div className="pay-form-row">
                    <div className="pay-fg">
                      <label>Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardData.expiry}
                        onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      />
                    </div>
                    <div className="pay-fg">
                      <label>CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cardData.cvv}
                        onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* UPI */}
            {paymentMethod === 'UPI' && (
              <>
                <div className="pay-section-label">UPI Details</div>
                <div className="pay-form-container">
                  <div className="pay-fg">
                    <label>UPI ID</label>
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={e => { setUpiId(e.target.value); setPaymentError(''); }}
                    />
                  </div>
                  <p className="pay-hint">Enter your UPI ID and confirm. A payment request will be sent to your UPI app.</p>
                </div>
              </>
            )}

            {/* Net Banking */}
            {paymentMethod === 'Net Banking' && (
              <>
                <div className="pay-section-label">Net Banking</div>
                <div className="pay-form-container">
                  <div className="pay-fg">
                    <label>Select Bank</label>
                    <select value={bankName} onChange={e => { setBankName(e.target.value); setPaymentError(''); }}>
                      <option value="">-- Choose your bank --</option>
                      {BANKS.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <p className="pay-hint">You will be redirected to your bank's secure portal to complete payment.</p>
                </div>
              </>
            )}

            {paymentError && <div className="pay-error">{paymentError}</div>}

            <div className="pay-secure-note">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>256-bit SSL encrypted &amp; 100% secure. This is a demo — no real charges apply.</span>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="pay-footer">
          <button className="pay-cancel-btn" onClick={onCancel}>Cancel</button>

          {screen === 'select' && (
            <button className="pay-confirm-btn" onClick={handleProceedToDetails}>
              <span>{needsDetails ? 'Enter Details' : `Pay ₹${amount}`}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}

          {screen === 'details' && (
            <button className="pay-confirm-btn" onClick={handlePayment}>
              <span>Pay &#8377;{amount}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default Payment;
