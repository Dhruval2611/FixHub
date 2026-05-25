import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faTimes, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import './FeedbackModal.css';

const FeedbackModal = ({ booking, onSubmit, onClose, loading }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating, review });
  };

  return (
    <div className="fm-overlay" onClick={onClose}>
      <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fm-close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <div className="fm-header">
          <h2>Rate Your Experience</h2>
          <p>How was the service for <strong>{booking?.service?.name || 'this booking'}</strong>?</p>
        </div>

        <div className="fm-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              className={`fm-star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <FontAwesomeIcon icon={faStar} />
            </button>
          ))}
        </div>
        <span className="fm-rating-label">
          {rating === 0 && 'Tap a star to rate'}
          {rating === 1 && 'Poor'}
          {rating === 2 && 'Fair'}
          {rating === 3 && 'Good'}
          {rating === 4 && 'Very Good'}
          {rating === 5 && 'Excellent!'}
        </span>

        <textarea
          className="fm-textarea"
          placeholder="Share your experience (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
        />

        <button
          className="fm-submit-btn"
          onClick={handleSubmit}
          disabled={rating < 1 || loading}
        >
          {loading ? (
            <span className="fm-spinner"></span>
          ) : (
            <>
              <FontAwesomeIcon icon={faPaperPlane} />
              Submit Feedback
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FeedbackModal;
