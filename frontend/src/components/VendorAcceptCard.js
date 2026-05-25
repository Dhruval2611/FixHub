import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faStar, faPhone, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import './VendorAcceptCard.css';

const VendorAcceptCard = ({ vendorDetails, onAccept, onReject, loading }) => {
  if (!vendorDetails) return null;

  const {
    name, businessName, phone, rating, totalReviews,
    isVerified, certifications
  } = vendorDetails;

  return (
    <div className="vac-container">
      <div className="vac-header">
        <FontAwesomeIcon icon={faShieldHalved} className="vac-header-icon" />
        <span>Vendor Assigned</span>
      </div>

      <div className="vac-body">
        <div className="vac-vendor-info">
          <div className="vac-avatar">
            {name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="vac-details">
            <h4 className="vac-name">{name}</h4>
            <p className="vac-business">{businessName}</p>
            <div className="vac-meta-row">
              {isVerified && (
                <span className="vac-verified-badge">
                  <FontAwesomeIcon icon={faShieldHalved} /> Certified
                </span>
              )}
              {rating > 0 && (
                <span className="vac-rating">
                  <FontAwesomeIcon icon={faStar} className="vac-star" />
                  {rating.toFixed(1)}
                  <span className="vac-review-count">({totalReviews})</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {phone && (
          <div className="vac-phone">
            <FontAwesomeIcon icon={faPhone} />
            <span>{phone}</span>
          </div>
        )}

        {certifications && certifications.length > 0 && (
          <div className="vac-certs">
            {certifications.map((cert, i) => (
              <span key={i} className="vac-cert-pill">{cert}</span>
            ))}
          </div>
        )}
      </div>

      <div className="vac-actions">
        <button
          className="vac-accept-btn"
          onClick={onAccept}
          disabled={loading}
        >
          {loading ? (
            <span className="vac-spinner"></span>
          ) : (
            <>
              <FontAwesomeIcon icon={faCheck} />
              Accept Vendor
            </>
          )}
        </button>
        <button
          className="vac-reject-btn"
          onClick={onReject}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faXmark} />
          Choose Different
        </button>
      </div>
    </div>
  );
};

export default VendorAcceptCard;
