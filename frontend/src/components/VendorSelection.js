import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWrench, faCalendarAlt, faClock, faLocationDot,
  faShieldHalved, faStar, faPhone, faCheck, faUserTie,
  faHourglassHalf, faChevronDown, faArrowRight, faTrashCan
} from '@fortawesome/free-solid-svg-icons';
import { io as socketIO } from 'socket.io-client';
import './VendorSelection.css';

const VendorSelection = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(null);

  const token = localStorage.getItem('token');

  const fetchBookings = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      const { data } = await axios.get('http://localhost:5000/api/bookings', {
        headers: { 'x-auth-token': token },
      });
      // Filter bookings where vendors have expressed interest
      const pendingSelection = data.filter(
        b => b.vendorStatus === 'vendor_accepted' && !b.userAccepted
      );
      setBookings(pendingSelection);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();

    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (userId) {
      const socket = socketIO('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socket.emit('user-join', { userId });

      socket.on('vendor-interested', () => {
        fetchBookings();
        toast.info('🔔 A new vendor is interested in your request!');
      });

      return () => {
        socket.off('vendor-interested');
        socket.disconnect();
      };
    }
  }, [token, navigate]);

  const handleSelectVendor = async (bookingId, vendor) => {
    setSelecting(vendor.vendorId);
    try {
      await axios.post(
        `http://localhost:5000/api/bookings/${bookingId}/accept-vendor`,
        { vendorId: vendor.vendorId },
        { headers: { 'x-auth-token': token } }
      );
      toast.success(`✅ ${vendor.name} selected! Your booking is confirmed.`);
      setConfirmModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select vendor');
    } finally {
      setSelecting(null);
    }
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const timeAgo = (d) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const toggle = (id) => setExpanded(prev => prev === id ? null : id);

  const handleCancelRequest = async (booking) => {
    setCancelling(booking._id);
    try {
      await axios.delete(
        `http://localhost:5000/api/bookings/${booking._id}/cancel`,
        { headers: { 'x-auth-token': token } }
      );
      toast.success('Request removed successfully.');
      setCancelModal(null);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="vs-page">
        <div className="vs-loading">
          <div className="vs-spinner" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="vs-page">
      <div className="vs-header">
        <div>
          <h1>Vendor Selection</h1>
          <p>Select a service professional for your pending bookings</p>
        </div>
        {bookings.length > 0 && (
          <span className="vs-count-badge">{bookings.length} pending</span>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="vs-empty">
          <FontAwesomeIcon icon={faHourglassHalf} className="vs-empty-icon" />
          <h3>No Pending Selections</h3>
          <p>When vendors respond to your service requests, they'll appear here for you to choose from.</p>
          <button className="vs-browse-btn" onClick={() => navigate('/services')}>
            Browse Services
          </button>
        </div>
      ) : (
        <div className="vs-list">
          {bookings.map(b => {
            const isOpen = expanded === b._id;
            const vendors = b.interestedVendors || [];

            return (
              <div key={b._id} className={`vs-card ${isOpen ? 'vs-card--open' : ''}`}>
                {/* Booking summary row */}
                <button className="vs-card-summary" onClick={() => toggle(b._id)}>
                  <div className="vs-card-left">
                    <div className="vs-svc-icon">
                      <FontAwesomeIcon icon={faWrench} />
                    </div>
                    <div className="vs-svc-meta">
                      <span className="vs-svc-name">{b.service?.name || 'Service'}</span>
                      <span className="vs-svc-details">
                        <FontAwesomeIcon icon={faCalendarAlt} />
                        {b.date ? fmtDate(b.date) : '—'}
                        <span className="vs-dot">·</span>
                        <FontAwesomeIcon icon={faClock} />
                        {b.time || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="vs-card-right">
                    <span className="vs-vendor-badge">
                      <FontAwesomeIcon icon={faUserTie} />
                      {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      className="vs-remove-btn"
                      title="Remove this request"
                      onClick={(e) => { e.stopPropagation(); setCancelModal(b); }}
                    >
                      <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                    <span className={`vs-chevron ${isOpen ? 'vs-chevron--open' : ''}`}>
                      <FontAwesomeIcon icon={faChevronDown} />
                    </span>
                  </div>
                </button>

                {/* Expandable vendor list */}
                <div className={`vs-panel ${isOpen ? 'vs-panel--open' : ''}`}>
                  <div className="vs-panel-inner">
                    {/* Address strip */}
                    {b.address && (
                      <div className="vs-address-strip">
                        <FontAwesomeIcon icon={faLocationDot} />
                        <span>{b.address}</span>
                      </div>
                    )}

                    {vendors.length === 0 ? (
                      <div className="vs-no-vendors">
                        <FontAwesomeIcon icon={faHourglassHalf} />
                        <span>Waiting for vendors to respond...</span>
                      </div>
                    ) : (
                      <div className="vs-vendor-list">
                        {vendors.map((v) => (
                          <div key={v.vendorId} className="vs-vendor-card">
                            <div className="vs-vendor-top">
                              <div className="vs-avatar">
                                {v.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="vs-vendor-info">
                                <h4 className="vs-vendor-name">{v.name}</h4>
                                <p className="vs-vendor-business">{v.businessName}</p>
                                <div className="vs-vendor-meta">
                                  {v.isVerified && (
                                    <span className="vs-verified">
                                      <FontAwesomeIcon icon={faShieldHalved} /> Certified
                                    </span>
                                  )}
                                  {v.rating > 0 && (
                                    <span className="vs-rating">
                                      <FontAwesomeIcon icon={faStar} />
                                      {v.rating.toFixed(1)}
                                      <span className="vs-review-ct">({v.totalReviews})</span>
                                    </span>
                                  )}
                                  {v.phone && (
                                    <span className="vs-phone">
                                      <FontAwesomeIcon icon={faPhone} /> {v.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {v.certifications && v.certifications.length > 0 && (
                              <div className="vs-certs">
                                {v.certifications.map((cert, i) => (
                                  <span key={i} className="vs-cert-pill">{cert}</span>
                                ))}
                              </div>
                            )}

                            <div className="vs-vendor-footer">
                              <span className="vs-time-ago">
                                Responded {v.acceptedAt ? timeAgo(v.acceptedAt) : ''}
                              </span>
                              <button
                                className="vs-select-btn"
                                onClick={() => setConfirmModal({ booking: b, vendor: v })}
                                disabled={selecting !== null}
                              >
                                <FontAwesomeIcon icon={faCheck} />
                                Select
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="vs-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="vs-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirm Vendor Selection</h3>
            <p>
              Select <strong>{confirmModal.vendor.name}</strong> ({confirmModal.vendor.businessName}) for your <strong>{confirmModal.booking.service?.name}</strong> booking?
            </p>
            {(confirmModal.booking.interestedVendors?.length > 1) && (
              <p className="vs-modal-note">
                Other interested vendors will be notified that this request is closed.
              </p>
            )}
            <div className="vs-modal-actions">
              <button className="vs-modal-cancel" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className="vs-modal-confirm"
                onClick={() => handleSelectVendor(confirmModal.booking._id, confirmModal.vendor)}
                disabled={selecting !== null}
              >
                {selecting ? (
                  <span className="vs-btn-spinner" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} /> Confirm Selection
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="vs-modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="vs-modal" onClick={e => e.stopPropagation()}>
            <h3>Remove Request</h3>
            <p>
              Cancel your <strong>{cancelModal.service?.name}</strong> booking scheduled for <strong>{cancelModal.date ? fmtDate(cancelModal.date) : '—'}</strong>?
            </p>
            {(cancelModal.interestedVendors?.length > 0) && (
              <p className="vs-modal-note">
                {cancelModal.interestedVendors.length} interested vendor{cancelModal.interestedVendors.length !== 1 ? 's' : ''} will be notified.
              </p>
            )}
            <div className="vs-modal-actions">
              <button className="vs-modal-cancel" onClick={() => setCancelModal(null)}>
                Keep
              </button>
              <button
                className="vs-modal-confirm vs-modal-danger"
                onClick={() => handleCancelRequest(cancelModal)}
                disabled={cancelling !== null}
              >
                {cancelling ? (
                  <span className="vs-btn-spinner" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faTrashCan} /> Remove
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSelection;
