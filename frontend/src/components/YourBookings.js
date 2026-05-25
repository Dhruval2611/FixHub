import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faCalendarAlt, faClock, faLocationDot,
  faNoteSticky, faChevronDown, faArrowRight, faWrench,
  faStar, faUserTie
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import './YourBookings.css';
import { bookingReceiptHTML } from './receiptTemplate';
import downloadReceiptPDF from './downloadReceipt';
import FeedbackModal from './FeedbackModal';
import { io as socketIO } from 'socket.io-client';

/* -- Receipt download helper -- */
const downloadBookingReceipt = (booking) => {
  const html = bookingReceiptHTML(booking);
  return downloadReceiptPDF(html, `FixHub-Receipt-${booking._id.slice(-8)}`);
};

/* -- Status meta -- */
const STATUS_META = {
  confirmed: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Confirmed' },
  pending:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Pending'   },
  completed: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Completed' },
  cancelled: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Cancelled' },
};

const VENDOR_STATUS_META = {
  vendor_accepted: { color: '#B45309', bg: '#FFFBEB', border: '#FDE68A', label: 'Vendor Found' },
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* -- Component -- */
const YourBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const navigate = useNavigate();

  const loadBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      const { data } = await axios.get('http://localhost:5000/api/bookings', {
        headers: { 'x-auth-token': token },
      });
      setBookings(data);

      // Mark all booking status updates as seen
      await axios.put('http://localhost:5000/api/bookings/mark-seen', {}, {
        headers: { 'x-auth-token': token },
      }).catch(() => {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadBookings();

    // Listen for real-time vendor acceptance
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (userId) {
      const socket = socketIO('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socket.emit('user-join', { userId });

      socket.on('vendor-interested', () => {
        loadBookings(); // Refresh to show updated vendor count
        toast.info('🔔 A vendor is interested in your request!');
      });

      socket.on('job-completed', (data) => {
        loadBookings();
        toast.success(`🎉 ${data.vendorName || 'Vendor'} has completed your service!`);
      });

      return () => {
        socket.off('vendor-interested');
        socket.off('job-completed');
        socket.disconnect();
      };
    }
  }, [navigate]);

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);



  const handleSubmitFeedback = async ({ rating, review }) => {
    if (!feedbackBooking) return;
    setFeedbackLoading(true);
    const token = localStorage.getItem('token');
    try {
      await axios.post(
        `http://localhost:5000/api/bookings/${feedbackBooking._id}/feedback`,
        { rating, review },
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Thank you for your feedback!');
      setFeedbackBooking(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="yb-page">
        <div className="yb-header"><h1>Your Bookings</h1></div>
        <div className="yb-loading">
          <div className="yb-spinner" />
          <span>Loading your bookings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="yb-page">
      {bookings.length === 0 ? (
        <div className="yb-empty-shell">
          <div className="yb-empty">
            <FontAwesomeIcon icon={faWrench} className="yb-empty-icon" />
            <h2>Your Bookings is Empty</h2>
            <p>Browse our services and book your first appointment.</p>
            <button className="yb-browse-btn" onClick={() => navigate('/services')}>
              Browse services
            </button>
          </div>
        </div>
      ) : (
        <>
        <div className="yb-header">
          <h1>Your Bookings</h1>
          <p>{bookings.length} booking{bookings.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="yb-list">
          {bookings.map((b) => {
            const isOpen = expanded === b._id;
            // Use vendor_accepted status if applicable
            const effectiveStatus = b.vendorStatus === 'vendor_accepted' && !b.userAccepted
              ? 'vendor_accepted' : b.status;
            const sm = VENDOR_STATUS_META[effectiveStatus] || STATUS_META[b.status] || STATUS_META.pending;
            const showVendorSelection = b.vendorStatus === 'vendor_accepted' && !b.userAccepted && (b.interestedVendors?.length > 0);
            const showWaitingForVendors = b.vendorStatus === 'vendor_accepted' && !b.userAccepted && (!b.interestedVendors || b.interestedVendors.length === 0);
            const showFeedbackBtn = b.vendorStatus === 'completed' && !b.vendorFeedback?.rating;
            const hasFeedback = b.vendorFeedback?.rating > 0;

            return (
              <div key={b._id} className={`yb-card${isOpen ? ' yb-card-open' : ''}`}>

                {/* Summary row -- always visible, click to expand */}
                <button className="yb-summary" onClick={() => toggle(b._id)}>
                  <div className="yb-summary-left">
                    <div className="yb-svc-icon"><FontAwesomeIcon icon={faWrench} /></div>
                    <div className="yb-svc-meta">
                      <span className="yb-svc-name">{b.service?.name || 'Service'}</span>
                      <span className="yb-svc-sub">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {b.date ? fmtDate(b.date) : 'Date not set'}
                      </span>
                    </div>
                  </div>
                  <div className="yb-summary-right">
                    <span className="yb-status-pill"
                      style={{ color: sm.color, background: sm.bg, borderColor: sm.border }}>
                      <span className="yb-status-dot" style={{ background: sm.color }} />
                      {sm.label}
                    </span>
                    <span className={`yb-chevron${isOpen ? ' yb-chevron-open' : ''}`}>
                      <FontAwesomeIcon icon={faChevronDown} />
                    </span>
                  </div>
                </button>

                {/* Expandable detail panel */}
                <div className={`yb-panel${isOpen ? ' yb-panel-open' : ''}`}>
                  <div className="yb-panel-inner">
                    <div className="yb-detail-grid">
                      <div className="yb-detail-item">
                        <div className="yb-detail-icon"><FontAwesomeIcon icon={faWrench} /></div>
                        <div>
                          <span className="yb-detail-label">Service</span>
                          <span className="yb-detail-val">{b.service?.name || 'Service'}</span>
                        </div>
                      </div>
                      <div className="yb-detail-item">
                        <div className="yb-detail-icon"><FontAwesomeIcon icon={faCalendarAlt} /></div>
                        <div>
                          <span className="yb-detail-label">Scheduled Date</span>
                          <span className="yb-detail-val">{b.date ? fmtDate(b.date) : '--'}</span>
                        </div>
                      </div>
                      <div className="yb-detail-item">
                        <div className="yb-detail-icon"><FontAwesomeIcon icon={faClock} /></div>
                        <div>
                          <span className="yb-detail-label">Time</span>
                          <span className="yb-detail-val">{b.time || '--'}</span>
                        </div>
                      </div>
                      <div className="yb-detail-item">
                        <div className="yb-detail-icon" style={{fontSize:'0.82rem', fontWeight:800, fontFamily:'monospace'}}>&#8377;</div>
                        <div>
                          <span className="yb-detail-label">Amount</span>
                          <span className="yb-detail-val">&#8377;{b.service?.price != null ? Number(b.service.price).toLocaleString('en-IN') : '--'}</span>
                        </div>
                      </div>
                      {b.address && (
                        <div className="yb-detail-item yb-detail-full">
                          <div className="yb-detail-icon"><FontAwesomeIcon icon={faLocationDot} /></div>
                          <div>
                            <span className="yb-detail-label">Address</span>
                            <span className="yb-detail-val">{b.address}</span>
                          </div>
                        </div>
                      )}
                      {b.notes && (
                        <div className="yb-detail-item yb-detail-full">
                          <div className="yb-detail-icon"><FontAwesomeIcon icon={faNoteSticky} /></div>
                          <div>
                            <span className="yb-detail-label">Notes</span>
                            <span className="yb-detail-val">{b.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assigned Vendor Info (after user accepted) */}
                    {b.assignedVendor && b.userAccepted && (
                      <div className="yb-vendor-info">
                        <div className="yb-vendor-header">
                          <FontAwesomeIcon icon={faUserTie} className="yb-vendor-icon" />
                          <span>Your Service Professional</span>
                        </div>
                        <div className="yb-vendor-details">
                          <span className="yb-vendor-name">{b.assignedVendor.name}</span>
                          <span className="yb-vendor-business">{b.assignedVendor.businessName}</span>
                          {b.assignedVendor.phone && (
                            <span className="yb-vendor-phone">{b.assignedVendor.phone}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Vendor Selection — multi-vendor flow */}
                    {showVendorSelection && (
                      <div className="yb-vendor-info" style={{ cursor: 'pointer' }} onClick={() => navigate(`/bookings/${b._id}/select-vendor`)}>
                        <div className="yb-vendor-header">
                          <FontAwesomeIcon icon={faUserTie} className="yb-vendor-icon" />
                          <span>{b.interestedVendors.length} Vendor{b.interestedVendors.length !== 1 ? 's' : ''} Interested</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {b.interestedVendors.map(v => v.name).join(', ')}
                          </span>
                          <button
                            className="yb-browse-btn"
                            style={{ padding: '8px 16px', fontSize: '0.82rem', margin: 0 }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/bookings/${b._id}/select-vendor`); }}
                          >
                            Select Vendor <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 4 }} />
                          </button>
                        </div>
                      </div>
                    )}

                    {showWaitingForVendors && (
                      <div className="yb-vendor-info">
                        <div className="yb-vendor-header">
                          <FontAwesomeIcon icon={faUserTie} className="yb-vendor-icon" />
                          <span>Searching for Vendors...</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '8px 0 0' }}>
                          Matching professionals will appear shortly.
                        </p>
                      </div>
                    )}

                    {/* Feedback section */}
                    {hasFeedback && (
                      <div className="yb-feedback-display">
                        <div className="yb-feedback-stars">
                          {[1,2,3,4,5].map(s => (
                            <FontAwesomeIcon
                              key={s}
                              icon={faStar}
                              className={`yb-fb-star ${s <= b.vendorFeedback.rating ? 'active' : ''}`}
                            />
                          ))}
                          <span className="yb-fb-rating-text">{b.vendorFeedback.rating}/5</span>
                        </div>
                        {b.vendorFeedback.review && (
                          <p className="yb-fb-review">{b.vendorFeedback.review}</p>
                        )}
                      </div>
                    )}

                    <div className="yb-panel-footer">
                      <span className="yb-booked-on">
                        Booked {new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' \u00B7 '}ID: {b._id.slice(-8).toUpperCase()}
                      </span>
                      <div className="yb-footer-actions">
                        {showFeedbackBtn && (
                          <button className="yb-feedback-btn" onClick={() => setFeedbackBooking(b)}>
                            <FontAwesomeIcon icon={faStar} />
                            Leave Feedback
                          </button>
                        )}
                        <button className="yb-receipt-btn" onClick={() => downloadBookingReceipt(b)}>
                          <FontAwesomeIcon icon={faDownload} />
                          Download Receipt
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            );
          })}
        </div>
        </>
      )}

      {/* Feedback Modal */}
      {feedbackBooking && (
        <FeedbackModal
          booking={feedbackBooking}
          onSubmit={handleSubmitFeedback}
          onClose={() => setFeedbackBooking(null)}
          loading={feedbackLoading}
        />
      )}
    </div>
  );
};

export default YourBookings;
