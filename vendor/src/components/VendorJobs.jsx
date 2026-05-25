import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { connectSocket } from '../socket/socket';
import { useVendor } from '../context/VendorContext';
import {
  HiOutlineUser, HiOutlineLocationMarker, HiOutlineClock,
  HiOutlineCalendar, HiOutlinePhone, HiOutlineBriefcase,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import './VendorJobs.css';

const VendorJobs = () => {
  const { vendor } = useVendor();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/vendor/jobs');
        setJobs(res.data);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();

    // Listen for user selection in real-time
    if (vendor) {
      const socket = connectSocket(vendor);

      socket.on('user-selected-you', (data) => {
        toast.success(data.message || 'Customer selected you for the job!');
        fetchJobs(); // Refresh jobs list
      });

      socket.on('user-selected-other', (data) => {
        toast.info(data.message || 'Customer chose a different vendor.');
        fetchJobs(); // Remove the job from list
      });

      return () => {
        socket.off('user-selected-you');
        socket.off('user-selected-other');
      };
    }
  }, [vendor]);

  const handleComplete = async (requestId) => {
    setCompletingId(requestId);
    try {
      await api.post(`/vendor/complete/${requestId}`);
      toast.success('Job marked as completed!');
      setJobs(prev => prev.filter(j => j._id !== requestId));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark as complete';
      toast.error(msg);
    } finally {
      setCompletingId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getStatusBadge = (job) => {
    const vendorStatus = job.booking?.vendorStatus || 'assigned';
    const userAccepted = job.booking?.userAccepted;

    if (vendorStatus === 'vendor_accepted' && !userAccepted) {
      return <span className="vj-status-badge vj-badge-yellow">Awaiting Selection</span>;
    }
    if (vendorStatus === 'completed') {
      return <span className="vj-status-badge vj-badge-green">Completed</span>;
    }

    const map = {
      assigned: { label: 'Confirmed', cls: 'vj-badge-blue' },
      in_progress: { label: 'In Progress', cls: 'vj-badge-yellow' },
      vendor_accepted: { label: 'Accepted', cls: 'vj-badge-blue' },
    };
    const s = map[vendorStatus] || { label: vendorStatus, cls: 'vj-badge-gray' };
    return <span className={`vj-status-badge ${s.cls}`}>{s.label}</span>;
  };

  if (loading) {
    return (
      <div className="vj-loading">
        <div className="vj-spinner"></div>
        <p>Loading your jobs...</p>
      </div>
    );
  }

  return (
    <div className="vendor-jobs">
      <div className="vj-header">
        <div>
          <h1>My Jobs</h1>
          <p>Jobs assigned to you</p>
        </div>
        <span className="vj-count">{jobs.length} jobs</span>
      </div>

      {jobs.length === 0 ? (
        <div className="vj-empty">
          <span className="vj-empty-icon">
            <HiOutlineBriefcase />
          </span>
          <h3>No jobs yet</h3>
          <p>Accept service requests to see them here.</p>
        </div>
      ) : (
        <div className="vj-list">
          {jobs.map(job => (
            <div key={job._id} className="vj-card">
              <div className="vj-card-top">
                <div className="vj-service-info">
                  <span className="vj-service-icon-wrap">
                    <HiWrenchScrewdriver />
                  </span>
                  <div>
                    <h3>{job.service?.name || 'Service'}</h3>
                    <span className="vj-service-cat">{job.service?.category}</span>
                  </div>
                </div>
                {getStatusBadge(job)}
              </div>

              <div className="vj-card-details">
                <div className="vj-detail">
                  <HiOutlineUser className="vj-icon" />
                  <span>{job.user?.name || 'Customer'}</span>
                </div>
                {job.user?.phone && (
                  <div className="vj-detail">
                    <HiOutlinePhone className="vj-icon" />
                    <span>{job.user.phone}</span>
                  </div>
                )}
                <div className="vj-detail">
                  <HiOutlineLocationMarker className="vj-icon" />
                  <span>{job.address}</span>
                </div>
                <div className="vj-detail-row">
                  <div className="vj-detail">
                    <HiOutlineCalendar className="vj-icon" />
                    <span>{formatDate(job.date)}</span>
                  </div>
                  <div className="vj-detail">
                    <HiOutlineClock className="vj-icon" />
                    <span>{job.time}</span>
                  </div>
                </div>
              </div>

              {job.booking?.notes && (
                <div className="vj-notes">
                  <strong>Notes:</strong> {job.booking.notes}
                </div>
              )}

              <div className="vj-card-footer">
                <span className="vj-price">₹{job.service?.price || '—'}</span>
                {job.booking?.vendorStatus === 'assigned' && job.booking?.userAccepted && (
                  <button
                    className="vj-complete-btn"
                    onClick={() => handleComplete(job._id)}
                    disabled={completingId === job._id}
                  >
                    {completingId === job._id ? (
                      <span className="vj-btn-spinner"></span>
                    ) : (
                      <>
                        <HiOutlineCheckCircle />
                        Mark Complete
                      </>
                    )}
                  </button>
                )}
                {job.booking?.vendorStatus === 'vendor_accepted' && !job.booking?.userAccepted && (
                  <span className="vj-waiting-label">Waiting for customer...</span>
                )}
                {(!job.booking?.vendorStatus || job.booking?.vendorStatus === 'assigned') && !job.booking?.userAccepted && (
                  <span className="vj-date-label">Accepted {formatDate(job.updatedAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorJobs;
