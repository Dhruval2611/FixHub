import React, { useState } from 'react';
import './BookingModal.css';

const BookingModal = ({ service, onClose, onBook }) => {
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    location: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // FIX: Yahan price pass karna zaroori hai dashboard ledger ke liye
      await onBook({ 
        ...bookingData, 
        serviceId: service._id,
        price: service.price // Price ko backend bhejna taaki ledger mein 0 na aaye
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError('Failed to book service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Book {service.name}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Booking confirmed successfully!</div>}
          
          <div className="service-summary">
            <h3>Service Details</h3>
            <p><strong>Service:</strong> {service.name}</p>
            <p><strong>Price:</strong> ₹{service.price}</p>
          </div>

          <form onSubmit={handleSubmit} className="booking-form">
            <div className="form-group">
              <label htmlFor="date">Preferred Date</label>
              <input
                type="date"
                id="date"
                name="date"
                min={today}
                value={bookingData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Preferred Time</label>
              <select
                id="time"
                name="time"
                value={bookingData.time}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Time</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="location">Service Location</label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter your address"
                value={bookingData.location}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="confirm-btn" disabled={loading}>
                {loading ? 'Processing...' : `Confirm - ₹${service.price}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;