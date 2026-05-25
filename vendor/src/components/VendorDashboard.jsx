import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useVendor } from '../context/VendorContext';
import {
  HiOutlineClipboardList, HiOutlineCheck, HiOutlineStar,
  HiOutlineArrowRight, HiOutlineLocationMarker, HiOutlineBriefcase, HiOutlineUser
} from 'react-icons/hi';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const { vendor } = useVendor();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalRequests: 0, acceptedJobs: 0, completedJobs: 0, rating: 0, totalReviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/vendor/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="vd-loading">
        <div className="vd-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="vendor-dashboard">
      <div className="vd-welcome">
        <div>
          <h1>Welcome back, {vendor?.name?.split(' ')[0]}</h1>
          <p>Here's what's happening with your business today.</p>
        </div>
        <div className="vd-welcome-meta">
          <span className="vd-category-tag">{vendor?.serviceCategory}</span>
          <span className="vd-location-tag">
            <HiOutlineLocationMarker className="vd-location-icon" />
            {vendor?.location}
          </span>
        </div>
      </div>

      <div className="vd-stats-grid">
        <div className="vd-stat-card" onClick={() => navigate('/requests')}>
          <div className="vd-stat-icon" style={{ background: '#EFF6FF' }}>
            <HiOutlineClipboardList style={{ color: '#3B82F6' }} />
          </div>
          <div className="vd-stat-content">
            <span className="vd-stat-value">{stats.totalRequests}</span>
            <span className="vd-stat-label">Open Requests</span>
          </div>
          <HiOutlineArrowRight className="vd-stat-arrow" />
        </div>

        <div className="vd-stat-card" onClick={() => navigate('/jobs')}>
          <div className="vd-stat-icon" style={{ background: '#F0FDF4' }}>
            <HiOutlineCheck style={{ color: '#22C55E' }} />
          </div>
          <div className="vd-stat-content">
            <span className="vd-stat-value">{stats.acceptedJobs}</span>
            <span className="vd-stat-label">Active Jobs</span>
          </div>
          <HiOutlineArrowRight className="vd-stat-arrow" />
        </div>

        <div className="vd-stat-card">
          <div className="vd-stat-icon" style={{ background: '#FFFBEB' }}>
            <HiOutlineStar style={{ color: '#F59E0B' }} />
          </div>
          <div className="vd-stat-content">
            <span className="vd-stat-value">{stats.completedJobs}</span>
            <span className="vd-stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Rating Card */}
      {stats.totalReviews > 0 && (
        <div className="vd-rating-card">
          <div className="vd-rating-stars">
            <HiOutlineStar className="vd-rating-star-icon" />
            <span className="vd-rating-value">{stats.rating.toFixed(1)}</span>
          </div>
          <span className="vd-rating-count">{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</span>
        </div>
      )}

      <div className="vd-quick-actions">
        <h2>Quick Actions</h2>
        <div className="vd-action-grid">
          <button className="vd-action-card" onClick={() => navigate('/requests')}>
            <span className="vd-action-icon-wrap">
              <HiOutlineClipboardList className="vd-action-icon" />
            </span>
            <span className="vd-action-title">View Requests</span>
            <span className="vd-action-desc">Browse and accept new service requests</span>
          </button>
          <button className="vd-action-card" onClick={() => navigate('/jobs')}>
            <span className="vd-action-icon-wrap">
              <HiOutlineBriefcase className="vd-action-icon" />
            </span>
            <span className="vd-action-title">My Jobs</span>
            <span className="vd-action-desc">Manage your assigned jobs</span>
          </button>
          <button className="vd-action-card" onClick={() => navigate('/profile')}>
            <span className="vd-action-icon-wrap">
              <HiOutlineUser className="vd-action-icon" />
            </span>
            <span className="vd-action-title">Edit Profile</span>
            <span className="vd-action-desc">Update your business details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
