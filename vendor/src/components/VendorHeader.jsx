import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '../context/VendorContext';
import { disconnectSocket } from '../socket/socket';
import { HiOutlineLogout, HiOutlineBell } from 'react-icons/hi';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import './VendorHeader.css';

const VendorHeader = () => {
  const { vendor, logoutVendor } = useVendor();
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logoutVendor();
    navigate('/login');
  };

  if (!vendor) return null;

  const initials = vendor.name
    ? vendor.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'V';

  return (
    <header className="vendor-header">
      <div className="vendor-header-left">
        <div className="vendor-header-logo">
          <span className="vh-logo-icon"><HiWrenchScrewdriver /></span>
          <span className="vh-logo-text">FixHub</span>
          <span className="vh-logo-badge">Vendor</span>
        </div>
      </div>

      <div className="vendor-header-right">
        <button className="vh-notification-btn" title="Notifications">
          <HiOutlineBell />
        </button>

        <div className="vh-profile">
          <div className="vh-avatar">
            {vendor.profilePicture ? (
              <img src={`http://localhost:5000/${vendor.profilePicture}`} alt={vendor.name} />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="vh-profile-info">
            <span className="vh-name">{vendor.name}</span>
            <span className="vh-business">{vendor.businessName}</span>
          </div>
        </div>

        <button className="vh-logout-btn" onClick={handleLogout} title="Logout">
          <HiOutlineLogout />
        </button>
      </div>
    </header>
  );
};

export default VendorHeader;
