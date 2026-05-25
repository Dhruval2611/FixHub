import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';
import { useVendor } from '../context/VendorContext';
import { connectSocket } from '../socket/socket';
import { toast } from 'react-toastify';
import {
  HiOutlineUser, HiOutlineLocationMarker, HiOutlineClock,
  HiOutlineCalendar, HiOutlineCheck, HiOutlineX, HiOutlineClipboardList
} from 'react-icons/hi';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import './VendorRequests.css';

const TIMER_DURATION = 120; // 2 minutes in seconds

/* Countdown timer component */
const CountdownTimer = ({ createdAt, onExpire }) => {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    return Math.max(TIMER_DURATION - elapsed, 0);
  });

  useEffect(() => {
    if (remaining <= 0) {
      onExpire();
      return;
    }
    const interval = setInterval(() => {
      setRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpire();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining <= 0]); // eslint-disable-line

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / TIMER_DURATION) * 100;
  const isUrgent = remaining <= 30;

  return (
    <div className={`vr-timer ${isUrgent ? 'vr-timer--urgent' : ''}`}>
      <div className="vr-timer-bar">
        <div className="vr-timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="vr-timer-text">
        <HiOutlineClock />
        {mins}:{String(secs).padStart(2, '0')}
      </span>
    </div>
  );
};

const VendorRequests = () => {
  const { vendor } = useVendor();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const expiredRef = useRef(new Set());

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get('/vendor/requests');
      // Filter out already-expired requests
      const now = Date.now();
      const active = res.data.filter(r => {
        const elapsed = (now - new Date(r.createdAt).getTime()) / 1000;
        return elapsed < TIMER_DURATION;
      });
      setRequests(active);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Socket.io realtime
    if (vendor) {
      const socket = connectSocket(vendor);

      socket.on('new-service-request', (request) => {
        setRequests(prev => [request, ...prev]);
        toast.info('🔔 New service request received!', { autoClose: 5000 });
      });

      // When user confirms a vendor, remove the request from all vendors
      socket.on('request-closed', (data) => {
        setRequests(prev => prev.filter(r => r._id !== data.requestId));
      });

      return () => {
        socket.off('new-service-request');
        socket.off('request-closed');
      };
    }
  }, [vendor, fetchRequests]);

  const handleExpire = useCallback((requestId) => {
    if (expiredRef.current.has(requestId)) return;
    expiredRef.current.add(requestId);
    setRequests(prev => prev.filter(r => r._id !== requestId));
    toast.warn('A request expired — time ran out.', { autoClose: 3000 });
  }, []);

  const handleAccept = async (requestId) => {
    setActionLoading(requestId);
    try {
      await api.post(`/vendor/accept/${requestId}`);
      toast.success('Request accepted! Waiting for user approval.');
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to accept request';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId) => {
    setActionLoading(requestId);
    try {
      await api.post(`/vendor/reject/${requestId}`);
      toast.info('Request rejected');
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      toast.error('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="vr-loading">
        <div className="vr-spinner"></div>
        <p>Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="vendor-requests">
      <div className="vr-header">
        <div>
          <h1>Service Requests</h1>
          <p>Accept within 2 minutes before they expire</p>
        </div>
        <span className="vr-count-badge">{requests.length} open</span>
      </div>

      {requests.length === 0 ? (
        <div className="vr-empty">
          <span className="vr-empty-icon">
            <HiOutlineClipboardList />
          </span>
          <h3>No requests right now</h3>
          <p>New matching requests will appear here in real-time.</p>
        </div>
      ) : (
        <div className="vr-list">
          {requests.map(req => (
            <div key={req._id} className="vr-card">
              {/* Countdown timer */}
              <CountdownTimer
                createdAt={req.createdAt}
                onExpire={() => handleExpire(req._id)}
              />

              <div className="vr-card-header">
                <div className="vr-service-badge">
                  <span className="vr-service-icon-wrap">
                    <HiWrenchScrewdriver />
                  </span>
                  <span>{req.service?.name || 'Service'}</span>
                </div>
                <span className="vr-price">₹{req.service?.price || '—'}</span>
              </div>

              <div className="vr-card-body">
                <div className="vr-detail">
                  <HiOutlineUser className="vr-detail-icon" />
                  <span>{req.user?.name || 'Customer'}</span>
                </div>
                <div className="vr-detail">
                  <HiOutlineLocationMarker className="vr-detail-icon" />
                  <span>{req.address}</span>
                </div>
                <div className="vr-detail-row">
                  <div className="vr-detail">
                    <HiOutlineCalendar className="vr-detail-icon" />
                    <span>{formatDate(req.date)}</span>
                  </div>
                  <div className="vr-detail">
                    <HiOutlineClock className="vr-detail-icon" />
                    <span>{req.time}</span>
                  </div>
                </div>
              </div>

              <div className="vr-card-actions">
                <button
                  className="vr-accept-btn"
                  onClick={() => handleAccept(req._id)}
                  disabled={actionLoading === req._id}
                >
                  {actionLoading === req._id ? (
                    <span className="vr-btn-spinner"></span>
                  ) : (
                    <><HiOutlineCheck /> Accept</>
                  )}
                </button>
                <button
                  className="vr-reject-btn"
                  onClick={() => handleReject(req._id)}
                  disabled={actionLoading === req._id}
                >
                  <HiOutlineX /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorRequests;
