import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeadset, faChevronDown, faClock, faHome, faComment, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './GetSupport.css';

const API = 'http://localhost:5000/api';

function GetSupport() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [queryForm, setQueryForm] = useState({ subject: '', message: '' });
  const [formErrors, setFormErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [queryStatus, setQueryStatus] = useState({ type: '', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/contact/my-queries`, {
          headers: { 'x-auth-token': token }
        });
        setInquiries(res.data);

        await axios.put(`${API}/contact/mark-replies-seen`, {}, {
          headers: { 'x-auth-token': token }
        });
      } catch (err) {
        console.error('Failed to load support inquiries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const refreshInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/contact/my-queries`, {
        headers: { 'x-auth-token': token }
      });
      setInquiries(res.data);
    } catch (err) {
      console.error('Failed to refresh inquiries:', err);
    }
  };

  const handleQueryChange = (e) => {
    const { name, value } = e.target;
    setQueryForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    if (queryStatus.message) setQueryStatus({ type: '', message: '' });
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!queryForm.subject.trim()) errors.subject = 'Subject is required';
    if (!queryForm.message.trim()) errors.message = 'Message is required';
    else if (queryForm.message.trim().length < 10) errors.message = 'At least 10 characters';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    if (isSending) return;

    setIsSending(true);
    setQueryStatus({ type: '', message: '' });
    setFormErrors({});

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/contact/send`, queryForm, {
        headers: { 'x-auth-token': token }
      });
      setQueryStatus({ type: 'success', message: response.data.message });
      setQueryForm({ subject: '', message: '' });
      refreshInquiries();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send. Please try again.';
      setQueryStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSending(false);
    }
  };

  const toggle = (id) => setOpenId(prev => prev === id ? null : id);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    }) + ' · ' + d.toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) {
    return (
      <div className="gs-page">
        <div className="gs-loading">
          <div className="gs-spinner" />
          <span>Loading your inquiries…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="gs-page">
      <div className="gs-header">
        <h1>Get Support</h1>
        <p>View your inquiries and admin responses</p>
      </div>

      {/* Raise Query Form */}
      <div className="gs-raise-query">
        <div className="gs-raise-query-header">
          <span className="gs-raise-tag">Support</span>
          <h2>Raise a Query</h2>
        </div>
        <form className="gs-query-form" onSubmit={handleQuerySubmit}>
          <div className={`gs-input-group ${formErrors.subject ? 'gs-input-error' : ''}`}>
            <FontAwesomeIcon icon={faComment} className="gs-input-icon" />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={queryForm.subject}
              onChange={handleQueryChange}
              disabled={isSending}
            />
          </div>
          {formErrors.subject && <span className="gs-field-error">{formErrors.subject}</span>}
          <div className={`gs-input-group gs-textarea-group ${formErrors.message ? 'gs-input-error' : ''}`}>
            <textarea
              name="message"
              placeholder="Describe your issue or question..."
              value={queryForm.message}
              onChange={handleQueryChange}
              disabled={isSending}
              rows="3"
            />
          </div>
          {formErrors.message && <span className="gs-field-error">{formErrors.message}</span>}
          <button type="submit" className="gs-send-btn" disabled={isSending}>
            <FontAwesomeIcon icon={faPaperPlane} className="gs-send-icon" />
            {isSending ? 'Submitting...' : 'Submit Query'}
          </button>
        </form>
        {queryStatus.message && (
          <p className={`gs-query-status ${queryStatus.type}`}>
            {queryStatus.message}
          </p>
        )}
      </div>

      {/* Inquiries List */}
      {loading ? null : inquiries.length === 0 ? (
        <div className="gs-empty-shell">
          <div className="gs-empty">
            <FontAwesomeIcon icon={faHeadset} className="gs-empty-icon" />
            <h2>No Inquiries Yet</h2>
            <p>You haven't submitted any support queries. Use the form above to reach out to us.</p>
            <button className="gs-home-btn" onClick={() => navigate('/')}>
              <FontAwesomeIcon icon={faHome} /> Go Home
            </button>
          </div>
        </div>
      ) : (
        <div className="gs-list">
          {inquiries.map((inq) => {
            const isOpen = openId === inq._id;
            const hasReply = !!inq.adminReply;
            return (
              <div
                key={inq._id}
                className={`gs-card ${isOpen ? 'gs-card-open' : ''} ${hasReply ? 'gs-card-has-reply' : ''}`}
              >
                <button className="gs-summary" onClick={() => toggle(inq._id)}>
                  <div className="gs-summary-left">
                    <div className="gs-inquiry-icon">
                      <FontAwesomeIcon icon={faHeadset} />
                    </div>
                    <div className="gs-inquiry-info">
                      <p className="gs-inquiry-subject">{inq.subject}</p>
                      <span className="gs-inquiry-date">{formatDate(inq.createdAt)}</span>
                    </div>
                  </div>
                  <div className="gs-summary-right">
                    <span className={`gs-status ${hasReply ? 'gs-status-replied' : 'gs-status-pending'}`}>
                      {hasReply ? 'Replied' : 'Pending'}
                    </span>
                    {!inq.replySeen && hasReply && <span className="gs-unseen-dot" />}
                    <FontAwesomeIcon icon={faChevronDown} className="gs-chevron" />
                  </div>
                </button>

                {isOpen && (
                  <div className="gs-detail">
                    {/* User's original message */}
                    <div className="gs-message-block">
                      <p className="gs-message-label">Your Message</p>
                      <p className="gs-message-text">{inq.message}</p>
                    </div>

                    {/* Admin reply */}
                    {hasReply ? (
                      <div className="gs-reply-block">
                        <div className="gs-reply-header">
                          <div className="gs-reply-avatar">FH</div>
                          <div className="gs-reply-meta">
                            <p className="gs-reply-name">FixHub Support</p>
                            <span className="gs-reply-time">{formatDate(inq.repliedAt)}</span>
                          </div>
                        </div>
                        <p className="gs-reply-text">{inq.adminReply}</p>
                      </div>
                    ) : (
                      <div className="gs-no-reply">
                        <FontAwesomeIcon icon={faClock} />
                        <span>Our team hasn't responded yet. We'll get back to you soon!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GetSupport;
