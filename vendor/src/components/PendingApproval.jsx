import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '../context/VendorContext';
import { connectSocket } from '../socket/socket';
import { toast } from 'react-toastify';
import { HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi';
import './PendingApproval.css';

const PendingApproval = () => {
  const { vendor, logoutVendor, updateVendor } = useVendor();
  const navigate = useNavigate();

  useEffect(() => {
    if (vendor?.status === 'approved') {
      navigate('/dashboard');
      return;
    }

    // Listen for real-time status update
    if (vendor) {
      const socket = connectSocket(vendor);

      socket.on('status-update', (data) => {
        if (data.status === 'approved') {
          toast.success('Your account has been approved! Welcome aboard!');
          updateVendor({ ...vendor, status: 'approved' });
          navigate('/dashboard');
        } else if (data.status === 'rejected') {
          toast.error('Your application was rejected: ' + (data.reason || ''));
          updateVendor({ ...vendor, status: 'rejected' });
        } else if (data.status === 'blocked') {
          toast.error('Your account has been blocked.');
          logoutVendor();
          navigate('/login');
        }
      });

      return () => {
        socket.off('status-update');
      };
    }
  }, [vendor]);

  const handleLogout = () => {
    logoutVendor();
    navigate('/login');
  };

  const statusContent = {
    pending: {
      icon: <HiOutlineClock />,
      title: 'Application Under Review',
      description: 'Thank you for registering! Our admin team is reviewing your documents. You will be notified once your account is approved.',
      color: '#FEF3C7',
      borderColor: '#FCD34D',
    },
    rejected: {
      icon: <HiOutlineXCircle />,
      title: 'Application Rejected',
      description: vendor?.rejectionReason || 'Your application was rejected. Please contact support for more details.',
      color: '#FEE2E2',
      borderColor: '#FCA5A5',
    },
  };

  const content = statusContent[vendor?.status] || statusContent.pending;

  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="pending-icon-wrapper" style={{ background: content.color }}>
          <span className="pending-status-icon">{content.icon}</span>
        </div>
        <h1>{content.title}</h1>
        <p>{content.description}</p>

        <div className="pending-info-box">
          <div className="pending-info-row">
            <span className="pending-info-label">Business</span>
            <span className="pending-info-value">{vendor?.businessName}</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-label">Category</span>
            <span className="pending-info-value">{vendor?.serviceCategory}</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-label">Location</span>
            <span className="pending-info-value">{vendor?.location}</span>
          </div>
          <div className="pending-info-row">
            <span className="pending-info-label">Status</span>
            <span className={`pending-status-badge ${vendor?.status}`}>{vendor?.status}</span>
          </div>
        </div>

        <p className="pending-note">
          This page updates in real-time. You'll be automatically redirected when approved.
        </p>

        <button className="pending-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
