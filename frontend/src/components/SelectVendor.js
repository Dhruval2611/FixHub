import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faWrench, faCalendarAlt, faClock, faLocationDot,
  faShieldHalved, faStar, faPhone, faCheck, faUserTie, faHourglassHalf
} from '@fortawesome/free-solid-svg-icons';
import { io as socketIO } from 'socket.io-client';
import './SelectVendor.css';

const SelectVendor = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); // vendor to confirm

  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const [vendorsRes, bookingsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/bookings/${bookingId}/interested-vendors`, {
          headers: { 'x-auth-token': token },
        }),
        axios.get('http://localhost:5000/api/bookings', {
          headers: { 'x-auth-token': token },
        }),
      ]);

      setVendors(vendorsRes.data.interestedVendors || []);

      const thisBooking = bookingsRes.data.find(b => b._id === bookingId);
      setBooking(thisBooking || null);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchData();

    // Real-time: listen for new vendors expressing interest
    const userId = JSON.parse(localStorage.getItem('user') || '{}')?.id;
    if (userId) {
      const socket = socketIO('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socket.emit('user-join', { userId });

      socket.on('vendor-interested', (data) => {
        if (data.bookingId === bookingId) {
          setVendors(prev => {
            const exists = prev.some(v => v.vendorId === data.vendor.vendorId);
            if (exists) return prev;
            return [...prev, data.vendor];
          });
          toast.info(`🔔 ${data.vendor.name} is interested in your request!`);
        }
      });

      return () => {
        socket.off('vendor-interested');
        socket.disconnect();
      };
    }
  }, [bookingId, token, navigate]);

  const handleSelectVendor = async (vendor) => {
    setSelecting(vendor.vendorId);
    try {
      await axios.post(
        `http://localhost:5000/api/bookings/${bookingId}/accept-vendor`,
        { vendorId: vendor.vendorId },
        { headers: { 'x-auth-token': token } }
      );
      toast.success(`✅ ${vendor.name} selected! Your booking is confirmed.`);
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to select vendor');
    } finally {
      setSelecting(null);
      setConfirmModal(null);
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
    return `${hrs}h ago`;
  };

  if (loading) {
    return (
      <div className="sv-page">
        <div className="sv-loading">
          <div className="sv-spinner" />
          <span>Loading vendors...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sv-page">
      {/* Back button */}
      <button className="sv-back-btn" onClick={() => navigate('/bookings')}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back to Bookings
      </button>

      {/* Header */}
      <div className="sv-header">
        <h1>Select Your Vendor</h1>
        <p>Choose from the professionals who responded to your service request</p>
      </div>

      {/* Booking summary */}
      {booking && (
        <div className="sv-booking-summary">
          <div className="sv-booking-icon">
            <FontAwesomeIcon icon={faWrench} />
          </div>
          <div className="sv-booking-meta">
            <div className="sv-booking-name">{booking.service?.name || 'Service'}</div>
            <div className="sv-booking-details">
              <span><FontAwesomeIcon icon={faCalendarAlt} /> {booking.date ? fmtDate(booking.date) : '—'}</span>
              <span><FontAwesomeIcon icon={faClock} /> {booking.time || '—'}</span>
              <span><FontAwesomeIcon icon={faLocationDot} /> {booking.address || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Vendor count */}
      {vendors.length > 0 && (
        <div className="sv-vendor-count">
          <strong>{vendors.length}</strong> vendor{vendors.length !== 1 ? 's' : ''} interested
        </div>
      )}

      {/* Vendor list */}
      {vendors.length === 0 ? (
        <div className="sv-empty">
          <span className="sv-empty-icon">
            <FontAwesomeIcon icon={faHourglassHalf} />
          </span>
          <h3>No vendors yet</h3>
          <p>Waiting for professionals to respond to your request. They'll appear here in real-time.</p>
        </div>
      ) : (
        <div className="sv-vendor-list">
          {vendors.map((v) => (
            <div key={v.vendorId} className="sv-vendor-card">
              <div className="sv-vendor-top">
                <div className="sv-avatar">
                  {v.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="sv-vendor-info">
                  <h3 className="sv-vendor-name">{v.name}</h3>
                  <p className="sv-vendor-business">{v.businessName}</p>
                  <div className="sv-meta-row">
                    {v.isVerified && (
                      <span className="sv-verified">
                        <FontAwesomeIcon icon={faShieldHalved} /> Certified
                      </span>
                    )}
                    {v.rating > 0 && (
                      <span className="sv-rating">
                        <FontAwesomeIcon icon={faStar} />
                        {v.rating.toFixed(1)}
                        <span className="sv-review-count">({v.totalReviews})</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {v.phone && (
                <div className="sv-vendor-phone">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{v.phone}</span>
                </div>
              )}

              {v.certifications && v.certifications.length > 0 && (
                <div className="sv-certs">
                  {v.certifications.map((cert, i) => (
                    <span key={i} className="sv-cert-pill">{cert}</span>
                  ))}
                </div>
              )}

              <div className="sv-vendor-footer">
                <span className="sv-accepted-time">
                  Responded {v.acceptedAt ? timeAgo(v.acceptedAt) : ''}
                </span>
                <button
                  className="sv-select-btn"
                  onClick={() => setConfirmModal(v)}
                  disabled={selecting !== null}
                >
                  <FontAwesomeIcon icon={faCheck} />
                  Select This Vendor
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="sv-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="sv-modal" onClick={e => e.stopPropagation()}>
            <h3>Confirm Your Selection</h3>
            <p>
              You are selecting <span className="sv-modal-vendor">{confirmModal.name}</span> ({confirmModal.businessName}) as your service professional.
              {vendors.length > 1 && ' Other vendors will be notified that the request is closed.'}
            </p>
            <div className="sv-modal-actions">
              <button className="sv-modal-cancel" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className="sv-modal-confirm"
                onClick={() => handleSelectVendor(confirmModal)}
                disabled={selecting !== null}
              >
                {selecting ? (
                  <span className="sv-spinner" />
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} /> Confirm
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

export default SelectVendor;
