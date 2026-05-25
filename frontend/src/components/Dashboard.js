import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/cachedApi'; 
import AssetVault from './AssetVault';
import './Dashboard.css';

const Dashboard = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [purchasedServices, setPurchasedServices] = useState([]);
  const [myQueries, setMyQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const [bookingsRes, purchasedRes] = await Promise.all([
          api.get('/bookings'),
          api.get('/bookings/purchased-services')
        ]);

        const allBookings = bookingsRes.data;
        const now = new Date();

        // Separation Logic
        setUpcomingBookings(allBookings.filter(b => new Date(b.date) > now));
        setPastBookings(allBookings.filter(b => new Date(b.date) <= now));
        setPurchasedServices(purchasedRes.data);

        // Fetch user queries
        try {
          const queriesRes = await axios.get('http://localhost:5000/api/contact/my-queries', {
            headers: { 'x-auth-token': token }
          });
          setMyQueries(queriesRes.data);
        } catch (qErr) {
          console.error('Error fetching queries:', qErr);
        }

      } catch (error) {
        console.error("Dashboard Sync Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Ledger Download
  const generateLedger = () => {
    const all = [...upcomingBookings, ...pastBookings];
    let csv = "Service,Amount,Status\n";
    all.forEach(b => {
      const serviceName = b.service?.name || 'Service';
      const price = b.price || b.service?.price || 0;
      csv += `${serviceName},${price},${b.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FixHub_Ledger.csv';
    a.click();
  };

  if (loading) return <div className="loader-container"><div className="premium-loader"></div></div>;

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">FixHub <span>Pro</span></div>
        <nav className="sidebar-nav">
          <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>📅 Upcoming</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>🕒 History</button>
          <button className={activeTab === 'my-services' ? 'active' : ''} onClick={() => setActiveTab('my-services')}>🛠️ My Services</button>
          <button className={activeTab === 'asset-vault' ? 'active' : ''} onClick={() => setActiveTab('asset-vault')}>🛡️ Asset Vault</button>
          <button className={activeTab === 'my-queries' ? 'active' : ''} onClick={() => setActiveTab('my-queries')}>
            💬 My Queries
            {myQueries.filter(q => q.adminReply && !q.userSeen).length > 0 && (
              <span className="query-badge">{myQueries.filter(q => q.adminReply).length}</span>
            )}
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="ledger-btn" onClick={generateLedger}>📄 Download Ledger</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <h1>Dashboard</h1>
        </header>

        <section className="stats-row">
          <div className="stat-card-modern">
            <p>Total Services</p>
            <h3>{purchasedServices.length}</h3>
          </div>
          <div className="stat-card-modern highlight">
            <p>Upcoming Tasks</p>
            <h3>{upcomingBookings.length}</h3>
          </div>
          <div className="stat-card-modern">
            <p>Total Spent</p>
            {/* Price Fallback for Stats */}
            <h3>₹{pastBookings.reduce((s, b) => s + (b.price || b.service?.price || 0), 0)}</h3>
          </div>
        </section>

        <div className="content-card">
          {activeTab === 'my-services' ? (
             <div className="services-list">
               <h2>My Purchased Services</h2>
               <div className="services-grid">
                 {purchasedServices.length > 0 ? (
                   purchasedServices.map(service => (
                     <div key={service._id} className="service-card">
                       <div className="service-icon">{service.icon || '🛠️'}</div>
                       <h3>{service.name}</h3>
                       <button className="status-btn-owned">✓ Active</button>
                     </div>
                   ))
                 ) : <p>No services purchased yet.</p>}
               </div>
             </div>
          ) : activeTab === 'asset-vault' ? (
            <AssetVault />
          ) : activeTab === 'my-queries' ? (
            <div className="my-queries-section">
              <h2>My Queries</h2>
              {myQueries.length === 0 ? (
                <div className="queries-empty">
                  <span className="queries-empty-icon">💬</span>
                  <p>No queries submitted yet.</p>
                  <p className="queries-empty-hint">You can raise a query from the Home page.</p>
                </div>
              ) : (
                <div className="queries-list">
                  {myQueries.map(query => (
                    <div key={query._id} className={`query-card ${query.adminReply ? 'query-replied' : 'query-pending'}`}>
                      <div className="query-card-header">
                        <span className="query-subject">{query.subject}</span>
                        <span className={`query-status-badge ${query.adminReply ? 'badge-answered' : 'badge-awaiting'}`}>
                          {query.adminReply ? 'Answered' : 'Awaiting Reply'}
                        </span>
                      </div>
                      <p className="query-message">{query.message}</p>
                      <span className="query-date">
                        Submitted {new Date(query.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {query.adminReply && (
                        <div className="query-reply-box">
                          <span className="query-reply-label">Admin Reply</span>
                          <p className="query-reply-text">{query.adminReply}</p>
                          <span className="query-reply-date">
                            Replied {new Date(query.repliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bookings-list">
              <table className="modern-table">
                <thead>
                  {/* Date column removed as per your request */}
                  <tr>
                    <th>Service Name</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'upcoming' ? upcomingBookings : pastBookings).map(b => (
                    <tr key={b._id}>
                      {/* Service Name */}
                      <td style={{fontWeight: '500'}}>{b.service?.name || "Service Details"}</td>
                      
                      {/* Price Fix: Agar price 0 hai toh service model se price uthayega */}
                      <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                        ₹{b.price || b.service?.price || '0'}
                      </td>
                      
                      {/* Status Badge */}
                      <td>
                        <span className={`status-badge badge-${b.status.toLowerCase()}`}>
                          {b.status === 'confirmed' ? '✅ Confirmed' : 
                           b.status === 'pending' ? '⏳ Pending' : b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {((activeTab === 'upcoming' ? upcomingBookings : pastBookings).length === 0) && (
                    <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;