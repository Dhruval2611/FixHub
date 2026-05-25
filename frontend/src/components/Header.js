import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faShoppingCart, faUser, faCalendarAlt, faSignOutAlt, faHeadset, faUserTie } from '@fortawesome/free-solid-svg-icons';
import { useCart } from './CartContext';
import './Header.css';

const Header = ({ user, setUser }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [unseenBookings, setUnseenBookings] = useState(0);
  const [unseenReplies, setUnseenReplies] = useState(0);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { getCartItemCount } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      setIsProfileDropdownOpen(false);
    };

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch unseen booking status count for logged-in users
  useEffect(() => {
    if (!user) { setUnseenBookings(0); setUnseenReplies(0); return; }
    const fetchUnseen = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const config = { headers: { 'x-auth-token': token } };
        const [bookingRes, replyRes] = await Promise.all([
          axios.get('http://localhost:5000/api/bookings/unseen-count', config).catch(() => ({ data: { count: 0 } })),
          axios.get('http://localhost:5000/api/contact/unseen-replies-count', config).catch(() => ({ data: { count: 0 } })),
        ]);
        setUnseenBookings(bookingRes.data.count || 0);
        setUnseenReplies(replyRes.data.count || 0);
      } catch (_) {}
    };
    fetchUnseen();
    const interval = setInterval(fetchUnseen, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const totalNotifications = unseenBookings + unseenReplies;

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    return () => document.body.classList.remove('sidebar-open');
  }, [isMobileMenuOpen]);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  const handleAccountSettings = () => {
    setIsProfileDropdownOpen(false);
    navigate('/account-settings');
  };

  const handleYourBookings = () => {
    setIsProfileDropdownOpen(false);
    navigate('/your-bookings');
  };

  const handleGetSupport = () => {
    setIsProfileDropdownOpen(false);
    navigate('/get-support');
  };

  const handleVendorSelection = () => {
    setIsProfileDropdownOpen(false);
    navigate('/vendor-selection');
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (!confirmed) return;
    localStorage.removeItem('token');
    localStorage.removeItem('fixhub_cart');
    setUser(null);
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Left: Logo */}
        <div className="logo">
          <Link to="/" onClick={closeMobileMenu}>
            F<span className="logo-i">
              <span className="i-body">ı</span>
              <FontAwesomeIcon icon={faGear} className="i-gear" />
            </span>xHub
          </Link>
        </div>

        {/* Center: Navigation Links + Mobile Profile */}
        <div className={`nav-center ${isMobileMenuOpen ? 'show' : ''}`}>
          {/* Mobile profile header – only visible inside sidebar */}
          {user && (
            <div className="sidebar-profile-header">
              <div className="sidebar-avatar">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000/${user.profilePicture}`}
                    alt="Profile"
                    className="sidebar-avatar-img"
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="sidebar-avatar-icon" />
                )}
              </div>
              <div className="sidebar-profile-info">
                <span className="sidebar-profile-name">{user.name}</span>
                <span className="sidebar-profile-email">{user.email}</span>
              </div>
            </div>
          )}

          <div className="sidebar-nav-section">
            <span className="sidebar-section-label">Navigation</span>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" style={{ visibility: 'hidden' }} />
              Home
            </Link>
            <Link to="/services" className={`nav-link ${isActive('/services') ? 'active' : ''}`} onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" style={{ visibility: 'hidden' }} />
              Services
            </Link>
            <Link to="/pricing" className={`nav-link ${isActive('/pricing') ? 'active' : ''}`} onClick={closeMobileMenu}>
              <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" style={{ visibility: 'hidden' }} />
              Pricing
            </Link>
            {user && (
              <Link to="/vendor-selection" className={`nav-link ${isActive('/vendor-selection') ? 'active' : ''}`} onClick={closeMobileMenu}>
                <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" style={{ visibility: 'hidden' }} />
                Vendors
              </Link>
            )}
            {!user && (
              <Link to="/login" className="nav-link" onClick={closeMobileMenu}>
                <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" style={{ visibility: 'hidden' }} />
                Login
              </Link>
            )}
          </div>

          {/* Profile actions – only when logged in */}
          {user && (
            <div className="sidebar-nav-section">
              <span className="sidebar-section-label">Account</span>
              <button className="sidebar-action-item" onClick={() => { closeMobileMenu(); handleAccountSettings(); }}>
                <FontAwesomeIcon icon={faUser} className="sidebar-link-icon" />
                <span>Account Settings</span>
              </button>
              <button className="sidebar-action-item" onClick={() => { closeMobileMenu(); handleYourBookings(); }}>
                <FontAwesomeIcon icon={faCalendarAlt} className="sidebar-link-icon" />
                <span>Your Bookings</span>
                {unseenBookings > 0 && <span className="sidebar-badge">{unseenBookings}</span>}
              </button>
              <button className="sidebar-action-item" onClick={() => { closeMobileMenu(); handleVendorSelection(); }}>
                <FontAwesomeIcon icon={faUserTie} className="sidebar-link-icon" />
                <span>Vendor Selection</span>
              </button>
              <button className="sidebar-action-item" onClick={() => { closeMobileMenu(); handleGetSupport(); }}>
                <FontAwesomeIcon icon={faHeadset} className="sidebar-link-icon" />
                <span>Get Support</span>
                {unseenReplies > 0 && <span className="sidebar-badge">{unseenReplies}</span>}
              </button>
              <div className="sidebar-divider"></div>
              <button className="sidebar-action-item sidebar-logout" onClick={() => { closeMobileMenu(); handleLogout(); }}>
                <FontAwesomeIcon icon={faSignOutAlt} className="sidebar-link-icon" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>



        <div className="nav-right">
          <div className="cart-icon" onClick={() => navigate('/cart')}>
            <FontAwesomeIcon icon={faShoppingCart} />
            {user && getCartItemCount() > 0 && (
              <span className="cart-count">{getCartItemCount()}</span>
            )}
          </div>
          {user && (
            <div className="user-profile-wrapper" ref={dropdownRef}>
              <div className="user-info" onClick={toggleProfileDropdown}>
                <div className="profile-pic-wrapper">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000/${user.profilePicture}`}
                      alt="Profile"
                      className="profile-picture"
                      onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                    />
                  ) : (
                    <div className="profile-placeholder">
                      <FontAwesomeIcon icon={faUser} style={{ fontSize: '14px' }} />
                    </div>
                  )}
                  {totalNotifications > 0 && <span className="profile-red-dot"></span>}
                </div>
                <span className="user-name">{user.name}</span>
                <span className={`dropdown-arrow ${isProfileDropdownOpen ? 'open' : ''}`}>▾</span>
              </div>

              {isProfileDropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <h4 className="dropdown-title">Menu</h4>
                  </div>
                  <button className="dropdown-item" onClick={handleAccountSettings}>
                    <FontAwesomeIcon icon={faUser} className="dropdown-icon" />
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-label">Account Settings</span>
                      <span className="dropdown-item-desc">Manage your profile</span>
                    </div>
                  </button>
                  <button className="dropdown-item" onClick={handleYourBookings}>
                    <FontAwesomeIcon icon={faCalendarAlt} className="dropdown-icon" />
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-label">Your Bookings</span>
                      <span className="dropdown-item-desc">View your appointments</span>
                    </div>
                    {unseenBookings > 0 && <span className="dropdown-notif-badge">{unseenBookings}</span>}
                  </button>
                  <button className="dropdown-item" onClick={handleVendorSelection}>
                    <FontAwesomeIcon icon={faUserTie} className="dropdown-icon" />
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-label">Vendor Selection</span>
                      <span className="dropdown-item-desc">Choose your service professional</span>
                    </div>
                  </button>
                  <button className="dropdown-item" onClick={handleGetSupport}>
                    <FontAwesomeIcon icon={faHeadset} className="dropdown-icon" />
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-label">Get Support</span>
                      <span className="dropdown-item-desc">View replies from support</span>
                    </div>
                    {unseenReplies > 0 && <span className="dropdown-notif-badge">{unseenReplies}</span>}
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="dropdown-icon" />
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-label">Logout</span>
                      <span className="dropdown-item-desc">Sign out of your account</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Backdrop overlay – closes sidebar when tapped */}
        <div
          className={`sidebar-backdrop ${isMobileMenuOpen ? 'visible' : ''}`}
          onClick={closeMobileMenu}
        />

        <button className="nav-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>
    </header>
  );
};

export default Header;