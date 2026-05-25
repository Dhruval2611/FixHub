import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useClerk } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faUsers,
  faTools,
  faCalendarCheck,
  faSignOutAlt,
  faPlus,
  faEdit,
  faTrash,
  faTimes,
  faSearch,
  faBars,
  faChartBar,
  faCog,
  faUserCircle,
  faBox,
  faCalendarAlt,
  faEllipsisV,
  faEnvelope,
  faReply,
  faEye,
  faCircle,
  faPaperPlane,
  faArrowRight,
  faCrown,
  faDownload,
  faBan,
  faCalendarPlus,
  faChevronLeft,
  faChevronRight,
  faExclamationTriangle,
  faUserTie,
  faCheckCircle,
  faTimesCircle,
  faFileAlt
} from '@fortawesome/free-solid-svg-icons';
import './Admin.css';

const ITEMS_PER_PAGE = 15;

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formStep, setFormStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Reset page to 1 when search or tab changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab]);
  const [replyModal, setReplyModal] = useState({ open: false, inquiry: null });
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const [newBookingsCount, setNewBookingsCount] = useState(0);
  // Subscription states
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionStats, setSubscriptionStats] = useState({});
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [subscriptionTotalPages, setSubscriptionTotalPages] = useState(1);
  const [subscriptionTotalCount, setSubscriptionTotalCount] = useState(0);
  const [subPlanFilter, setSubPlanFilter] = useState('all');
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [cancelModal, setCancelModal] = useState({ open: false, subscription: null });
  const [cancelReason, setCancelReason] = useState('');
  const [extendModal, setExtendModal] = useState({ open: false, subscription: null });
  const [extendDays, setExtendDays] = useState(30);
  const [actionLoading, setActionLoading] = useState(false);
  // Vendor management states
  const [vendors, setVendors] = useState([]);
  const [vendorStatusFilter, setVendorStatusFilter] = useState('all');
  const [vendorDocModal, setVendorDocModal] = useState({ open: false, vendor: null });
  const [pendingVendorsCount, setPendingVendorsCount] = useState(0);
  const { signOut } = useClerk();

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout from the Admin Panel?');
    if (!confirmLogout) return;
    localStorage.removeItem('token');
    await signOut();
    window.location.href = '/login';
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in as admin.');
        return;
      }
      const config = { headers: { 'x-auth-token': token } };

      // Always fetch inquiries for badge count & dashboard card
      try {
        const inquiryRes = await axios.get('http://localhost:5000/api/contact/inquiries', config);
        setInquiries(inquiryRes.data.inquiries || []);
      } catch (inquiryErr) {
        console.error('Error fetching inquiries:', inquiryErr);
      }

      // Always fetch new bookings count for badge
      try {
        const nbRes = await axios.get('http://localhost:5000/api/admin/bookings/new-count', config);
        setNewBookingsCount(nbRes.data.count || 0);
      } catch (nbErr) {
        console.error('Error fetching new bookings count:', nbErr);
      }

      if (activeTab === 'dashboard') {
        const res = await axios.get('http://localhost:5000/api/admin/stats', config);
        setStats(res.data);
      } else if (activeTab === 'users') {
        const res = await axios.get('http://localhost:5000/api/admin/users', config);
        setUsers(res.data);
      } else if (activeTab === 'services') {
        const res = await axios.get('http://localhost:5000/api/admin/services', config);
        setServices(res.data);
      } else if (activeTab === 'bookings') {
        const res = await axios.get('http://localhost:5000/api/admin/bookings', config);
        setBookings(res.data);
        // Mark all bookings as admin-seen
        try {
          await axios.put('http://localhost:5000/api/admin/bookings/mark-seen', {}, config);
          setNewBookingsCount(0);
        } catch (msErr) {
          console.error('Error marking bookings admin seen:', msErr);
        }
      } else if (activeTab === 'subscriptions') {
        const [subsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/subscriptions', {
            ...config,
            params: {
              page: subscriptionPage,
              limit: 15,
              planFilter: subPlanFilter,
              statusFilter: subStatusFilter,
              search: searchTerm || undefined
            }
          }),
          axios.get('http://localhost:5000/api/admin/subscriptions/stats', config)
        ]);
        setSubscriptions(subsRes.data.subscriptions);
        setSubscriptionTotalPages(subsRes.data.totalPages);
        setSubscriptionTotalCount(subsRes.data.totalCount);
        setSubscriptionStats(statsRes.data);
      } else if (activeTab === 'vendors') {
        const res = await axios.get('http://localhost:5000/api/admin/vendors', {
          ...config,
          params: { status: vendorStatusFilter, search: searchTerm || undefined }
        });
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch data. Please check your authentication.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, subscriptionPage, subPlanFilter, subStatusFilter, vendorStatusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch pending vendors count on mount (for sidebar badge)
  useEffect(() => {
    const fetchPendingCount = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await axios.get('http://localhost:5000/api/admin/vendors', {
          headers: { 'x-auth-token': token },
          params: { status: 'pending' }
        });
        setPendingVendorsCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch (e) { /* ignore */ }
    };
    fetchPendingCount();
  }, []);

  // Re-fetch subscriptions when search changes (debounced)
  useEffect(() => {
    if (activeTab !== 'subscriptions') return;
    const timer = setTimeout(() => {
      setSubscriptionPage(1);
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Poll badge counts every 30 seconds for live updates
  useEffect(() => {
    const pollBadges = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const config = { headers: { 'x-auth-token': token } };
        const [nbRes, iqRes] = await Promise.all([
          axios.get('http://localhost:5000/api/admin/bookings/new-count', config).catch(() => ({ data: { count: 0 } })),
          axios.get('http://localhost:5000/api/contact/inquiries', config).catch(() => ({ data: { inquiries: [] } }))
        ]);
        if (activeTab !== 'bookings') setNewBookingsCount(nbRes.data.count || 0);
        setInquiries(iqRes.data.inquiries || []);
      } catch (_) { }
    };
    const interval = setInterval(pollBadges, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleUpdateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${userId}`, updates, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error updating user:', err); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error deleting user:', err); }
  };

  const handleUpdateService = async (serviceId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/services/${serviceId}`, updates, { headers: { 'x-auth-token': token } });
      fetchData();
      closeForm();
    } catch (err) { console.error('Error updating service:', err); }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/services/${serviceId}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error deleting service:', err); }
  };

  const handleCreateService = async (serviceData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/admin/services', serviceData, { headers: { 'x-auth-token': token } });
      closeForm();
      fetchData();
    } catch (err) { console.error('Error creating service:', err); }
  };

  const handleUpdateBooking = async (bookingId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/bookings/${bookingId}`, updates, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error updating booking:', err); }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/bookings/${bookingId}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error deleting booking:', err); }
  };

  const handleReplyInquiry = async () => {
    if (!replyText.trim() || !replyModal.inquiry) return;
    setReplying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/contact/inquiries/${replyModal.inquiry._id}/reply`,
        { replyMessage: replyText },
        { headers: { 'x-auth-token': token } }
      );
      setReplyModal({ open: false, inquiry: null });
      setReplyText('');
      fetchData();
    } catch (err) { console.error('Error replying:', err); }
    finally { setReplying(false); }
  };

  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('Delete this inquiry?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/contact/inquiries/${inquiryId}`, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error deleting inquiry:', err); }
  };

  const handleMarkRead = async (inquiryId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/contact/inquiries/${inquiryId}/read`, {}, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error marking read:', err); }
  };

  // Subscription actions
  const handleCancelSubscription = async () => {
    if (!cancelModal.subscription) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/subscriptions/${cancelModal.subscription._id}/cancel`,
        { reason: cancelReason },
        { headers: { 'x-auth-token': token } }
      );
      setCancelModal({ open: false, subscription: null });
      setCancelReason('');
      fetchData();
    } catch (err) { console.error('Error cancelling subscription:', err); }
    finally { setActionLoading(false); }
  };

  const handleExtendSubscription = async () => {
    if (!extendModal.subscription) return;
    if (!window.confirm(`Are you sure you want to extend ${extendModal.subscription.user?.name || 'this user'}'s subscription by ${extendDays} days?`)) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/subscriptions/${extendModal.subscription._id}/extend`,
        { days: parseInt(extendDays) },
        { headers: { 'x-auth-token': token } }
      );
      setExtendModal({ open: false, subscription: null });
      setExtendDays(30);
      fetchData();
    } catch (err) { console.error('Error extending subscription:', err); }
    finally { setActionLoading(false); }
  };

  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/subscriptions/export-csv', {
        headers: { 'x-auth-token': token },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'subscriptions_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Error downloading CSV:', err); }
  };

  const handleDownloadUsersCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/users/export-csv', {
        headers: { 'x-auth-token': token },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Error downloading users CSV:', err); }
  };

  // Vendor management actions
  const handleApproveVendor = async (vendorId) => {
    if (!window.confirm('Approve this vendor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/vendors/${vendorId}/approve`, {}, { headers: { 'x-auth-token': token } });
      setPendingVendorsCount(prev => Math.max(0, prev - 1));
      fetchData();
    } catch (err) { console.error('Error approving vendor:', err); }
  };

  const handleRejectVendor = async (vendorId) => {
    const reason = window.prompt('Rejection reason (optional):');
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/vendors/${vendorId}/reject`, { reason }, { headers: { 'x-auth-token': token } });
      setPendingVendorsCount(prev => Math.max(0, prev - 1));
      fetchData();
    } catch (err) { console.error('Error rejecting vendor:', err); }
  };

  const handleBlockVendor = async (vendorId) => {
    if (!window.confirm('Block this vendor?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/vendors/${vendorId}/block`, {}, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { console.error('Error blocking vendor:', err); }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  };

  const openForm = (item = null) => {
    setEditingItem(item);
    setFormData(item ? {
      ...item,
      inclusions: Array.isArray(item.inclusions) ? item.inclusions.join(', ') : (item.inclusions || ''),
      highlights: Array.isArray(item.highlights) ? item.highlights.join(', ') : (item.highlights || '')
    } : { category: '', price: '' });
    setFormStep(1);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formStep === 1) {
      setFormStep(2);
      return;
    }

    const finalData = {
      ...formData,
      inclusions: typeof formData.inclusions === 'string' ? formData.inclusions.split(',').map(s => s.trim()).filter(Boolean) : (formData.inclusions || []),
      highlights: typeof formData.highlights === 'string' ? formData.highlights.split(',').map(s => s.trim()).filter(Boolean) : (formData.highlights || [])
    };

    if (activeTab === 'services') {
      if (editingItem) handleUpdateService(editingItem._id, finalData);
      else handleCreateService(finalData);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredServices = services.filter(s =>
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredBookings = bookings.filter(b =>
    (b.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredInquiries = inquiries.filter(i =>
    (i.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.message || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination helpers
  const paginate = (items) => {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const paged = items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    return { paged, totalPages, totalCount: items.length };
  };

  const usersPag = paginate(filteredUsers);
  const servicesPag = paginate(filteredServices);
  const bookingsPag = paginate(filteredBookings);
  const inquiriesPag = paginate(filteredInquiries);

  // Reusable pagination component
  const PaginationControls = ({ totalPages, totalCount, label }) => {
    if (totalPages <= 1) return null;
    return (
      <div className="sub-pagination">
        <button
          type="button"
          className="sub-page-btn"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          <span>Previous</span>
        </button>
        <span className="sub-page-info">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          {totalCount != null && <> &middot; {totalCount} {label || 'items'}</>}
        </span>
        <button
          type="button"
          className="sub-page-btn"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        >
          <span>Next</span>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  const pageTitles = {
    dashboard: 'Dashboard Overview',
    users: 'User Management',
    services: 'Service Management',
    bookings: 'Booking Management',
    inquiries: 'Customer Inquiries',
    subscriptions: 'Subscription Management',
    vendors: 'Vendor Management'
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="admin-panel admin-panel--loading">
        <div className="admin-loading">
          <div className="loading-spinner-admin" />
          <p>Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Sidebar - Logo unchanged */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`} aria-label="Admin navigation">
        <div className="sidebar-header">
          <div className="admin-branding">
            <div className="admin-logo">
              <span className="logo-f">F</span>
              <span className="logo-i-admin">
                <span className="i-body-admin">ı</span>
                <FontAwesomeIcon icon={faCog} className="i-gear-admin" />
              </span>
              <span className="logo-f">xHub</span>
            </div>
            <div className="admin-title-section">
              <h2 className="admin-panel-title">Admin Panel</h2>
              <p className="admin-subtitle">Management Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Main">
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FontAwesomeIcon icon={faChartLine} className="admin-nav-icon" />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FontAwesomeIcon icon={faUsers} className="admin-nav-icon" />
            <span>Users</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            <FontAwesomeIcon icon={faTools} className="admin-nav-icon" />
            <span>Services</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <FontAwesomeIcon icon={faCalendarCheck} className="admin-nav-icon" />
            <span>Bookings</span>
            {newBookingsCount > 0 && (
              <span className="admin-nav-badge">{newBookingsCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <FontAwesomeIcon icon={faEnvelope} className="admin-nav-icon" />
            <span>Inquiries</span>
            {inquiries.filter(i => !i.isRead).length > 0 && (
              <span className="admin-nav-badge">{inquiries.filter(i => !i.isRead).length}</span>
            )}
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('subscriptions'); setSubscriptionPage(1); }}
          >
            <FontAwesomeIcon icon={faCrown} className="admin-nav-icon" />
            <span>Subscriptions</span>
          </button>
          <button
            type="button"
            className={`admin-nav-item ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveTab('vendors')}
          >
            <FontAwesomeIcon icon={faUserTie} className="admin-nav-icon" />
            <span>Vendors</span>
            {pendingVendorsCount > 0 && (
              <span className="admin-nav-badge">{pendingVendorsCount}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="admin-logout-btn" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} className="admin-nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        <header className="admin-header">
          <button type="button" className="admin-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h1 className="admin-page-title">{pageTitles[activeTab]}</h1>
          <div className="admin-header-actions">
            {activeTab !== 'dashboard' && (
              <div className="admin-search-wrap">
                <FontAwesomeIcon icon={faSearch} className="admin-search-icon" />
                <input
                  type="search"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="admin-search-input"
                  aria-label={`Search ${activeTab}`}
                />
              </div>
            )}
            {activeTab === 'users' && (
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleDownloadUsersCSV}>
                <FontAwesomeIcon icon={faDownload} />
                <span>Export CSV</span>
              </button>
            )}
            {activeTab === 'services' && (
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => openForm()}>
                <FontAwesomeIcon icon={faPlus} />
                <span>Add Service</span>
              </button>
            )}
            {activeTab === 'subscriptions' && (
              <button type="button" className="admin-btn admin-btn--primary" onClick={handleDownloadCSV}>
                <FontAwesomeIcon icon={faDownload} />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </header>

        <div className="admin-content">
          {error && (
            <div className="admin-alert admin-alert--error" role="alert">
              {error}
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="admin-dashboard">
              <section className="admin-stats" aria-label="Statistics">
                <div className="admin-stat-cards">
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('users')}>
                    <span className="admin-stat-icon admin-stat-icon--blue" aria-hidden>
                      <FontAwesomeIcon icon={faUsers} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{stats.totalUsers ?? 0}</span>
                      <span className="admin-stat-label">Total Users</span>
                    </div>
                  </button>
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('bookings')}>
                    <span className="admin-stat-icon admin-stat-icon--green" aria-hidden>
                      <FontAwesomeIcon icon={faCalendarCheck} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{stats.totalBookings ?? 0}</span>
                      <span className="admin-stat-label">Total Bookings</span>
                    </div>
                  </button>
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('services')}>
                    <span className="admin-stat-icon admin-stat-icon--purple" aria-hidden>
                      <FontAwesomeIcon icon={faTools} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{stats.totalServices ?? 0}</span>
                      <span className="admin-stat-label">Total Services</span>
                    </div>
                  </button>
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('bookings')}>
                    <span className="admin-stat-icon admin-stat-icon--amber" aria-hidden>
                      <FontAwesomeIcon icon={faChartBar} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{stats.pendingBookings ?? 0}</span>
                      <span className="admin-stat-label">Pending Bookings</span>
                    </div>
                  </button>
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('inquiries')}>
                    <span className="admin-stat-icon admin-stat-icon--teal" aria-hidden>
                      <FontAwesomeIcon icon={faEnvelope} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{inquiries.length}</span>
                      <span className="admin-stat-label">Inquiries</span>
                    </div>
                  </button>
                  <button type="button" className="admin-stat-card" onClick={() => setActiveTab('subscriptions')}>
                    <span className="admin-stat-icon admin-stat-icon--indigo" aria-hidden>
                      <FontAwesomeIcon icon={faCrown} />
                    </span>
                    <div className="admin-stat-body">
                      <span className="admin-stat-value">{stats.activeSubscriptions ?? 0}</span>
                      <span className="admin-stat-label">Active Subscriptions</span>
                    </div>
                  </button>
                </div>
              </section>

              <section className="admin-recent" aria-label="Recent bookings">
                <div className="admin-card">
                  <h2 className="admin-card-title">Recent Bookings</h2>
                  <div className="admin-activity-list">
                    {stats.recentBookings?.length > 0 ? (
                      stats.recentBookings.map((booking) => (
                        <div key={booking._id} className="admin-activity-item">
                          <span className="admin-activity-icon" aria-hidden>
                            <FontAwesomeIcon icon={faCalendarCheck} />
                          </span>
                          <div className="admin-activity-content">
                            <span className="admin-activity-title">{booking.service?.name}</span>
                            <span className="admin-activity-meta">By {booking.user?.name} · {booking.user?.email}</span>
                          </div>
                          <div className="admin-activity-right">
                            <span className={`admin-tag admin-tag--${booking.status}`}>{booking.status}</span>
                            <span className="admin-activity-date">{new Date(booking.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="admin-empty">No recent bookings</p>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-card admin-card--table-wrap">
              {loading ? (
                <div className="admin-loading-inline">
                  <div className="loading-spinner-admin" />
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Profile</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersPag.paged.map((user) => (
                        <tr key={user._id}>
                          <td>
                            {user.profilePicture ? (
                              <img
                                src={`http://localhost:5000/${user.profilePicture}`}
                                alt=""
                                className="admin-avatar"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className="admin-avatar admin-avatar--fallback"
                              style={{ display: user.profilePicture ? 'none' : 'flex' }}
                              aria-hidden
                            >
                              <FontAwesomeIcon icon={faUserCircle} />
                            </span>
                          </td>
                          <td><span className="admin-cell-name">{user.name}</span></td>
                          <td><span className="admin-cell-muted">{user.email}</span></td>
                          <td><span className="admin-cell-muted">{user.phone || '—'}</span></td>
                          <td><span className="admin-cell-muted">{new Date(user.createdAt).toLocaleDateString()}</span></td>
                          <td>
                            <button
                              type="button"
                              className="admin-icon-btn admin-icon-btn--danger"
                              onClick={() => handleDeleteUser(user._id)}
                              title="Delete user"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && filteredUsers.length === 0 && <p className="admin-empty">No users found</p>}
              {!loading && <PaginationControls totalPages={usersPag.totalPages} totalCount={usersPag.totalCount} label="users" />}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="admin-card admin-card--table-wrap">
              {loading ? (
                <div className="admin-loading-inline">
                  <div className="loading-spinner-admin" />
                  <p>Loading services...</p>
                </div>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicesPag.paged.map((service) => (
                        <tr key={service._id}>
                          <td><span className="admin-cell-name">{service.name}</span></td>
                          <td><span className="admin-cell-desc">{service.description}</span></td>
                          <td><span className="admin-tag admin-tag--category">{service.category}</span></td>
                          <td><span className="admin-cell-price">₹{service.price}</span></td>
                          <td>
                            <div className="admin-action-group">
                              <button type="button" className="admin-icon-btn admin-icon-btn--primary" onClick={() => openForm(service)} title="Edit service">
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleDeleteService(service._id)} title="Delete service">
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && filteredServices.length === 0 && <p className="admin-empty">No services found</p>}
              {!loading && <PaginationControls totalPages={servicesPag.totalPages} totalCount={servicesPag.totalCount} label="services" />}
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="admin-card admin-card--table-wrap">
              {loading ? (
                <div className="admin-loading-inline">
                  <div className="loading-spinner-admin" />
                  <p>Loading bookings...</p>
                </div>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>User</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Vendor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookingsPag.paged.map((booking) => (
                        <tr key={booking._id}>
                          <td><span className="admin-cell-name">{booking.service?.name}</span></td>
                          <td>
                            <div className="admin-cell-user">
                              <span className="admin-cell-name">{booking.user?.name}</span>
                              <span className="admin-cell-muted">{booking.user?.email}</span>
                            </div>
                          </td>
                          <td><span className="admin-cell-muted">{new Date(booking.date).toLocaleDateString()}</span></td>
                          <td><span className="admin-cell-muted">{booking.time}</span></td>
                          <td>
                            <span className={`admin-tag admin-tag--${booking.status}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-tag admin-tag--${booking.vendorStatus === 'assigned' ? 'confirmed' : booking.vendorStatus === 'completed' ? 'completed' : 'pending'}`}>
                              {booking.vendorStatus || 'unassigned'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && filteredBookings.length === 0 && <p className="admin-empty">No bookings found</p>}
              {!loading && <PaginationControls totalPages={bookingsPag.totalPages} totalCount={bookingsPag.totalCount} label="bookings" />}
            </div>
          )}

          {activeTab === 'inquiries' && (
            <div className="admin-inquiries-grid">
              {loading ? (
                <div className="admin-loading-inline">
                  <div className="loading-spinner-admin" />
                  <p>Loading inquiries...</p>
                </div>
              ) : inquiriesPag.paged.length === 0 ? (
                <p className="admin-empty">No inquiries yet</p>
              ) : (
                inquiriesPag.paged.map((inquiry) => (
                  <div key={inquiry._id} className={`inquiry-card ${!inquiry.isRead ? 'inquiry-unread' : ''} ${inquiry.repliedAt ? 'inquiry-replied' : ''}`}>
                    <div className="inquiry-header">
                      <div className="inquiry-sender">
                        <div className="inquiry-avatar">
                          {(inquiry.user?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="inquiry-sender-info">
                          <span className="inquiry-name">{inquiry.user?.name || 'Unknown'}</span>
                          <span className="inquiry-email">{inquiry.user?.email || '—'}</span>
                        </div>
                      </div>
                      <div className="inquiry-meta">
                        {!inquiry.isRead && (
                          <span className="inquiry-badge-new">NEW</span>
                        )}
                        {inquiry.repliedAt && (
                          <span className="inquiry-badge-replied">REPLIED</span>
                        )}
                        <span className="inquiry-date">
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="inquiry-body">
                      <p className="inquiry-subject">{inquiry.subject}</p>
                      <p className="inquiry-message">
                        {expandedInquiry === inquiry._id
                          ? inquiry.message
                          : inquiry.message.length > 150
                            ? inquiry.message.substring(0, 150) + '...'
                            : inquiry.message
                        }
                      </p>
                      {inquiry.message.length > 150 && (
                        <button
                          type="button"
                          className="inquiry-expand-btn"
                          onClick={() => setExpandedInquiry(expandedInquiry === inquiry._id ? null : inquiry._id)}
                        >
                          {expandedInquiry === inquiry._id ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    {inquiry.adminReply && (
                      <div className="inquiry-reply-preview">
                        <span className="inquiry-reply-label">Your Reply:</span>
                        <p className="inquiry-reply-text">{inquiry.adminReply}</p>
                      </div>
                    )}

                    <div className="inquiry-actions">
                      {!inquiry.repliedAt && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--primary admin-btn--sm"
                          onClick={() => { setReplyModal({ open: true, inquiry }); setReplyText(''); if (!inquiry.isRead) handleMarkRead(inquiry._id); }}
                        >
                          <FontAwesomeIcon icon={faReply} />
                          <span>Reply</span>
                        </button>
                      )}
                      {inquiry.repliedAt && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-btn--sm"
                          onClick={() => { setReplyModal({ open: true, inquiry }); setReplyText(''); }}
                        >
                          <FontAwesomeIcon icon={faReply} />
                          <span>Reply Again</span>
                        </button>
                      )}
                      {!inquiry.isRead && !inquiry.repliedAt && (
                        <button
                          type="button"
                          className="admin-btn admin-btn--outline admin-btn--sm"
                          onClick={() => handleMarkRead(inquiry._id)}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          <span>Mark Read</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn--danger"
                        onClick={() => handleDeleteInquiry(inquiry._id)}
                        title="Delete inquiry"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {!loading && <PaginationControls totalPages={inquiriesPag.totalPages} totalCount={inquiriesPag.totalCount} label="inquiries" />}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="admin-subscriptions-section">
              {/* Stats Row */}
              <div className="sub-stats-row">
                <div className="sub-stat-chip sub-stat-chip--active">
                  <span className="sub-stat-chip-value">{subscriptionStats.totalActive || 0}</span>
                  <span className="sub-stat-chip-label">Active</span>
                </div>
                <div className="sub-stat-chip sub-stat-chip--expired">
                  <span className="sub-stat-chip-value">{subscriptionStats.totalExpired || 0}</span>
                  <span className="sub-stat-chip-label">Expired</span>
                </div>
                <div className="sub-stat-chip sub-stat-chip--revenue">
                  <span className="sub-stat-chip-value">₹{(subscriptionStats.totalRevenue || 0).toLocaleString('en-IN')}</span>
                  <span className="sub-stat-chip-label">Total Revenue</span>
                </div>
                {subscriptionStats.planBreakdown && Object.entries(subscriptionStats.planBreakdown).map(([plan, data]) => (
                  <div key={plan} className="sub-stat-chip sub-stat-chip--plan">
                    <span className="sub-stat-chip-value">{data.count}</span>
                    <span className="sub-stat-chip-label">{plan}</span>
                  </div>
                ))}
              </div>

              {/* Filter Bar */}
              <div className="sub-filter-bar">
                <div className="sub-filter-group">
                  <label className="sub-filter-label">Plan</label>
                  <select
                    value={subPlanFilter}
                    onChange={(e) => { setSubPlanFilter(e.target.value); setSubscriptionPage(1); }}
                    className="admin-select sub-filter-select"
                  >
                    <option value="all">All Plans</option>
                    <option value="Premium">Premium</option>
                    <option value="Elite">Elite</option>
                    <option value="Premium Yearly">Premium Yearly</option>
                    <option value="Elite Yearly">Elite Yearly</option>
                  </select>
                </div>
                <div className="sub-filter-group">
                  <label className="sub-filter-label">Status</label>
                  <select
                    value={subStatusFilter}
                    onChange={(e) => { setSubStatusFilter(e.target.value); setSubscriptionPage(1); }}
                    className="admin-select sub-filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <span className="sub-filter-count">{subscriptionTotalCount} subscription{subscriptionTotalCount !== 1 ? 's' : ''}</span>
              </div>

              {/* Table */}
              <div className="admin-card admin-card--table-wrap">
                {loading ? (
                  <div className="admin-loading-inline">
                    <div className="loading-spinner-admin" />
                    <p>Loading subscriptions...</p>
                  </div>
                ) : (
                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Plan</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Start Date</th>
                          <th>Expiry Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subscriptions.map((sub) => {
                          const daysLeft = getDaysUntilExpiry(sub.expiryDate);
                          return (
                            <tr key={sub._id}>
                              <td>
                                <div className="admin-cell-user">
                                  <span className="admin-cell-name">{sub.user?.name || 'Deleted User'}</span>
                                  <span className="admin-cell-muted">{sub.user?.email || 'N/A'}</span>
                                </div>
                              </td>
                              <td>
                                <span className={`sub-plan-badge sub-plan-badge--${sub.planName?.toLowerCase().replace(/\s/g, '-')}`}>
                                  {sub.planName}
                                </span>
                              </td>
                              <td><span className="admin-tag admin-tag--category">{sub.planType || 'new'}</span></td>
                              <td><span className="admin-cell-price">₹{sub.amount}</span></td>
                              <td><span className="admin-cell-muted">{new Date(sub.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></td>
                              <td>
                                <div className="sub-expiry-cell">
                                  <span className="admin-cell-muted">{new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                  {sub.status === 'active' && daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                                    <span className="sub-expiry-warning">
                                      <FontAwesomeIcon icon={faExclamationTriangle} />
                                      {daysLeft}d left
                                    </span>
                                  )}
                                  {sub.status === 'active' && daysLeft !== null && daysLeft <= 0 && (
                                    <span className="sub-expiry-expired">Expired</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="admin-action-group">
                                  {sub.status === 'active' && (
                                    <>
                                      <button
                                        type="button"
                                        className="admin-icon-btn admin-icon-btn--primary"
                                        onClick={() => { setExtendModal({ open: true, subscription: sub }); setExtendDays(30); }}
                                        title="Extend subscription"
                                      >
                                        <FontAwesomeIcon icon={faCalendarPlus} />
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-icon-btn admin-icon-btn--danger"
                                        onClick={() => { setCancelModal({ open: true, subscription: sub }); setCancelReason(''); }}
                                        title="Cancel subscription"
                                      >
                                        <FontAwesomeIcon icon={faBan} />
                                      </button>
                                    </>
                                  )}
                                  {sub.status === 'expired' && (
                                    <button
                                      type="button"
                                      className="admin-icon-btn admin-icon-btn--primary"
                                      onClick={() => { setExtendModal({ open: true, subscription: sub }); setExtendDays(30); }}
                                      title="Reactivate (extend)"
                                    >
                                      <FontAwesomeIcon icon={faCalendarPlus} />
                                    </button>
                                  )}
                                  {sub.status === 'cancelled' && (
                                    <span className="admin-cell-muted" style={{ fontSize: '0.75rem' }}>—</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {!loading && subscriptions.length === 0 && <p className="admin-empty">No subscriptions found</p>}
              </div>

              {/* Pagination */}
              {subscriptionTotalPages > 1 && (
                <div className="sub-pagination">
                  <button
                    type="button"
                    className="sub-page-btn"
                    disabled={subscriptionPage <= 1}
                    onClick={() => setSubscriptionPage(p => Math.max(1, p - 1))}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    <span>Previous</span>
                  </button>
                  <span className="sub-page-info">
                    Page <strong>{subscriptionPage}</strong> of <strong>{subscriptionTotalPages}</strong>
                  </span>
                  <button
                    type="button"
                    className="sub-page-btn"
                    disabled={subscriptionPage >= subscriptionTotalPages}
                    onClick={() => setSubscriptionPage(p => Math.min(subscriptionTotalPages, p + 1))}
                  >
                    <span>Next</span>
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Vendor Management Tab */}
          {activeTab === 'vendors' && (
            <div className="admin-card admin-card--table-wrap">
              {loading ? (
                <div className="admin-loading-inline">
                  <div className="loading-spinner-admin" />
                  <p>Loading vendors...</p>
                </div>
              ) : (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Email</th>
                        <th>Category</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendors.length === 0 ? (
                        <tr><td colSpan="6" className="admin-empty">No vendors found</td></tr>
                      ) : vendors.map(v => (
                        <tr key={v._id}>
                          <td>
                            <div className="admin-cell-user">
                              <span className="admin-cell-name">{v.name}</span>
                              <span className="admin-cell-muted">{v.businessName}</span>
                            </div>
                          </td>
                          <td><span className="admin-cell-muted">{v.email}</span></td>
                          <td><span className="admin-tag admin-tag--category">{v.serviceCategory}</span></td>
                          <td><span className="admin-cell-muted" style={{ textTransform: 'capitalize' }}>{v.location}</span></td>
                          <td>
                            <span className={`admin-tag admin-tag--${v.status === 'approved' ? 'confirmed' : v.status === 'pending' ? 'pending' : 'cancelled'}`}>
                              {v.status}
                            </span>
                          </td>
                          <td>
                            <div className="admin-action-group">
                              <button type="button" className="admin-icon-btn admin-icon-btn--primary" onClick={() => setVendorDocModal({ open: true, vendor: v })} title="View documents">
                                <FontAwesomeIcon icon={faFileAlt} />
                              </button>
                              {(v.status === 'pending' || v.status === 'rejected') && (
                                <button type="button" className="admin-icon-btn admin-icon-btn--success" onClick={() => handleApproveVendor(v._id)} title="Approve">
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                </button>
                              )}
                              {(v.status === 'pending' || v.status === 'approved') && (
                                <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleRejectVendor(v._id)} title="Reject">
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                              )}
                              {v.status !== 'blocked' && (
                                <button type="button" className="admin-icon-btn admin-icon-btn--danger" onClick={() => handleBlockVendor(v._id)} title="Block">
                                  <FontAwesomeIcon icon={faBan} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Reply Modal */}
      {replyModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setReplyModal({ open: false, inquiry: null })} role="presentation">
          <div className="admin-modal admin-modal--reply" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">
                <FontAwesomeIcon icon={faReply} style={{ marginRight: 8 }} />
                Reply to {replyModal.inquiry?.user?.name || 'User'}
              </h2>
              <button type="button" className="admin-modal-close" onClick={() => setReplyModal({ open: false, inquiry: null })} aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="reply-modal-body">
              <div className="reply-original">
                <span className="reply-original-label">Query from {replyModal.inquiry?.user?.name || 'User'}</span>
                <p className="reply-original-subject">{replyModal.inquiry?.subject}</p>
                <p className="reply-original-text">{replyModal.inquiry?.message}</p>
                <span className="reply-original-email">{replyModal.inquiry?.user?.email} · {new Date(replyModal.inquiry?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="admin-form-group">
                <label htmlFor="reply-textarea">Your Reply</label>
                <textarea
                  id="reply-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={6}
                  className="admin-input admin-textarea"
                  disabled={replying}
                />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setReplyModal({ open: false, inquiry: null })}>Cancel</button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleReplyInquiry}
                  disabled={replying || !replyText.trim()}
                >
                  <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 6 }} />
                  {replying ? 'Saving...' : 'Save Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {cancelModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setCancelModal({ open: false, subscription: null })} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">
                <FontAwesomeIcon icon={faBan} style={{ marginRight: 8, color: '#dc2626' }} />
                Cancel Subscription
              </h2>
              <button type="button" className="admin-modal-close" onClick={() => setCancelModal({ open: false, subscription: null })} aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="reply-modal-body">
              <div style={{ padding: '4px 0 20px', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Are you sure you want to cancel the <strong>{cancelModal.subscription?.planName}</strong> subscription for <strong>{cancelModal.subscription?.user?.name || 'this user'}</strong>? This action will immediately revert their account to the basic plan and send a notification email.
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setCancelModal({ open: false, subscription: null })}>Cancel</button>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger-solid"
                  onClick={handleCancelSubscription}
                  disabled={actionLoading}
                >
                  <FontAwesomeIcon icon={faBan} style={{ marginRight: 6 }} />
                  {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extend Subscription Modal */}
      {extendModal.open && (
        <div className="admin-modal-backdrop" onClick={() => setExtendModal({ open: false, subscription: null })} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="admin-modal-head">
              <h2 className="admin-modal-title">
                <FontAwesomeIcon icon={faCalendarPlus} style={{ marginRight: 8, color: '#0284c7' }} />
                Extend Subscription
              </h2>
              <button type="button" className="admin-modal-close" onClick={() => setExtendModal({ open: false, subscription: null })} aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="reply-modal-body">
              <div style={{ padding: '4px 0 20px', color: '#475569', fontSize: '0.95rem', lineHeight: '1.5' }}>
                Extend the <strong>{extendModal.subscription?.planName}</strong> subscription for <strong>{extendModal.subscription?.user?.name || 'this user'}</strong>? Their current expiry is {new Date(extendModal.subscription?.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
              </div>
              <div className="admin-form-group">
                <label htmlFor="extend-days">Extend by (days)</label>
                <div className="sub-extend-options">
                  {[7, 15, 30, 60, 90].map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`sub-extend-chip ${extendDays === d ? 'sub-extend-chip--active' : ''}`}
                      onClick={() => setExtendDays(d)}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
                <input
                  id="extend-days"
                  type="number"
                  value={extendDays}
                  onChange={(e) => setExtendDays(e.target.value)}
                  min={1}
                  max={365}
                  className="admin-input"
                  style={{ marginTop: 8 }}
                  disabled={actionLoading}
                />
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setExtendModal({ open: false, subscription: null })}>Cancel</button>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  onClick={handleExtendSubscription}
                  disabled={actionLoading || !extendDays || extendDays < 1}
                >
                  <FontAwesomeIcon icon={faCalendarPlus} style={{ marginRight: 6 }} />
                  {actionLoading ? 'Extending...' : `Extend ${extendDays} Days`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service modal */}
      {showForm && (
        <div className="admin-modal-backdrop" onClick={closeForm} role="presentation">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="admin-modal-title">
            <div className="admin-modal-head">
              <h2 id="admin-modal-title" className="admin-modal-title">{editingItem ? 'Edit Service' : 'Add New Service'}</h2>
              <button type="button" className="admin-modal-close" onClick={closeForm} aria-label="Close">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="admin-form">
              {formStep === 1 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-field-name" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Service Name</label>
                    <input
                      id="admin-field-name"
                      type="text"
                      value={formData.name ?? ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Premium Car Wash"
                      required
                      className="admin-input"
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-field-desc" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Description</label>
                    <textarea
                      id="admin-field-desc"
                      value={formData.description ?? ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter a brief description of the service..."
                      required
                      rows={2}
                      style={{ minHeight: '60px', padding: '8px 12px', fontSize: '0.9rem' }}
                      className="admin-input admin-textarea"
                    />
                  </div>
                  <div className="admin-form-row" style={{ gap: '16px' }}>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Category</label>
                      <input
                        type="text"
                        required
                        value={formData.category ?? ''}
                        onChange={() => { }}
                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0, padding: 0, margin: 0, zIndex: -1 }}
                        tabIndex={-1}
                      />
                      <select
                        value={formData.category ?? ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="admin-input"
                        style={{ height: '38px', padding: '8px 12px', fontSize: '0.9rem' }}
                      >
                        <option value="">Select category</option>
                        {['Electrician', 'AC Technician', 'Plumber', 'Mechanic', 'Home Cleaner', 'Sofa Cleaner', 'Home Painter'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="admin-form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="admin-field-price" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Price (₹)</label>
                      <input
                        id="admin-field-price"
                        type="number"
                        value={formData.price ?? ''}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0"
                        required
                        min={0}
                        className="admin-input"
                        style={{ height: '38px', padding: '8px 12px', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-field-duration" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Duration (e.g., 2-3 Hours)</label>
                    <input
                      id="admin-field-duration"
                      type="text"
                      value={formData.duration ?? ''}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="Enter service duration"
                      className="admin-input"
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-field-inclusions" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Inclusions (comma separated)</label>
                    <textarea
                      id="admin-field-inclusions"
                      value={formData.inclusions ?? ''}
                      onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                      placeholder="Cleaning, Dusting, Mopping..."
                      rows={2}
                      className="admin-input admin-textarea"
                      style={{ minHeight: '60px', padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-field-highlights" style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '6px' }}>Highlights (comma separated)</label>
                    <textarea
                      id="admin-field-highlights"
                      value={formData.highlights ?? ''}
                      onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                      placeholder="Professional team, Quick service, Quality tools..."
                      rows={2}
                      className="admin-input admin-textarea"
                      style={{ minHeight: '60px', padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              )}

              <div className="admin-form-actions" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={closeForm} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                  {formStep === 2 && (
                    <button type="button" className="admin-btn admin-btn--outline" onClick={() => setFormStep(1)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                      Back
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {!editingItem && formStep === 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, shareWithUsers: !formData.shareWithUsers })}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        border: `1px solid ${formData.shareWithUsers ? '#111827' : '#cbd5e1'}`,
                        background: formData.shareWithUsers ? '#111827' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: formData.shareWithUsers ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}>
                        {formData.shareWithUsers && <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: '10px', color: '#fff', transform: 'rotate(45deg)' }} />}
                      </div>
                      <span style={{ color: '#64748b', fontWeight: '600', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Promo Email
                      </span>
                    </div>
                  )}
                  <button type="submit" className="admin-btn admin-btn--primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                    {formStep === 1 ? (
                      <>
                        <span>Next</span>
                        <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6, fontSize: '0.8rem' }} />
                      </>
                    ) : editingItem ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Document Modal */}
      {vendorDocModal.open && vendorDocModal.vendor && (
        <div className="admin-modal-overlay" onClick={() => setVendorDocModal({ open: false, vendor: null })}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3>Documents — {vendorDocModal.vendor.name}</h3>
              <button type="button" className="admin-modal-close" onClick={() => setVendorDocModal({ open: false, vendor: null })}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ID Proof</strong>
                {vendorDocModal.vendor.idProof ? (
                  <div style={{ marginTop: 8 }}>
                    {vendorDocModal.vendor.idProof.endsWith('.pdf') ? (
                      <a href={`http://localhost:5000/${vendorDocModal.vendor.idProof}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FontAwesomeIcon icon={faFileAlt} /> View PDF
                      </a>
                    ) : (
                      <img src={`http://localhost:5000/${vendorDocModal.vendor.idProof}`} alt="ID Proof" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    )}
                  </div>
                ) : <p style={{ color: '#9CA3AF', fontSize: '0.88rem', marginTop: 4 }}>Not uploaded</p>}
              </div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Business Certificate</strong>
                {vendorDocModal.vendor.businessCertificate ? (
                  <div style={{ marginTop: 8 }}>
                    {vendorDocModal.vendor.businessCertificate.endsWith('.pdf') ? (
                      <a href={`http://localhost:5000/${vendorDocModal.vendor.businessCertificate}`} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn--outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <FontAwesomeIcon icon={faFileAlt} /> View PDF
                      </a>
                    ) : (
                      <img src={`http://localhost:5000/${vendorDocModal.vendor.businessCertificate}`} alt="Business Certificate" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #E5E7EB' }} />
                    )}
                  </div>
                ) : <p style={{ color: '#9CA3AF', fontSize: '0.88rem', marginTop: 4 }}>Not uploaded</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
