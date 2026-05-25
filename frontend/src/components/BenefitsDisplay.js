import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCrown, faRocket, faStar, faPercent, faHeadset, faShieldHalved, faBolt } from '@fortawesome/free-solid-svg-icons';
import './BenefitsDisplay.css';

const PLAN_ICONS = {
  Basic: faStar,
  Premium: faCrown,
  Elite: faRocket,
};

const PLAN_COLORS = {
  Basic: { primary: '#6B7280', secondary: '#F3F4F6', accent: '#10B981' },
  Premium: { primary: '#D97706', secondary: '#FEF3C7', accent: '#F59E0B' },
  Elite: { primary: '#BE185D', secondary: '#FCE7F3', accent: '#EC4899' },
};

const BenefitsDisplay = ({ planName = 'Basic', compact = false }) => {
  const benefits = {
    Basic: {
      discount: 0,
      support: 'Email Support',
      warranty: 'Basic Warranty',
      priority: false,
      emergency: 0,
      coordinator: false,
    },
    Premium: {
      discount: 15,
      support: '24/7 Phone Support',
      warranty: 'Extended Warranty',
      priority: true,
      emergency: 2,
      coordinator: false,
    },
    Elite: {
      discount: 25,
      support: 'Concierge Support',
      warranty: 'Lifetime Warranty',
      priority: true,
      emergency: -1, // Unlimited
      coordinator: true,
    },
  };

  const planBenefits = benefits[planName] || benefits.Basic;
  const colors = PLAN_COLORS[planName];

  if (compact) {
    return (
      <div className="benefits-compact" style={{ '--primary-color': colors.primary }}>
        <div className="benefit-row">
          <FontAwesomeIcon icon={faPercent} className="benefit-icon" />
          <span>{planBenefits.discount}% off on all services</span>
        </div>
        <div className="benefit-row">
          <FontAwesomeIcon icon={faHeadset} className="benefit-icon" />
          <span>{planBenefits.support}</span>
        </div>
        <div className="benefit-row">
          <FontAwesomeIcon icon={faShieldHalved} className="benefit-icon" />
          <span>{planBenefits.warranty}</span>
        </div>
        {planBenefits.priority && (
          <div className="benefit-row">
            <FontAwesomeIcon icon={faBolt} className="benefit-icon" />
            <span>Priority Booking</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="benefits-display">
      <div className="benefits-header">
        <div className="plan-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
          <FontAwesomeIcon icon={PLAN_ICONS[planName]} className="plan-icon" style={{ color: colors.primary }} />
        </div>
        <h3>{planName} Plan Benefits</h3>
      </div>

      <div className="benefits-grid">
        <div className="benefit-card">
          <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
            <FontAwesomeIcon icon={faPercent} className="benefit-card-icon" style={{ color: colors.primary }} />
          </div>
          <div className="benefit-content">
            <div className="benefit-value">{planBenefits.discount}%</div>
            <div className="benefit-label">Service Discount</div>
            <div className="benefit-desc">On all services year-round</div>
          </div>
        </div>

        <div className="benefit-card">
          <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
            <FontAwesomeIcon icon={faHeadset} className="benefit-card-icon" style={{ color: colors.primary }} />
          </div>
          <div className="benefit-content">
            <div className="benefit-value">{planBenefits.support.split(' ')[0]}</div>
            <div className="benefit-label">Support Type</div>
            <div className="benefit-desc">{planBenefits.support}</div>
          </div>
        </div>

        <div className="benefit-card">
          <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
            <FontAwesomeIcon icon={faShieldHalved} className="benefit-card-icon" style={{ color: colors.primary }} />
          </div>
          <div className="benefit-content">
            <div className="benefit-value">{planBenefits.warranty.split(' ')[0]}</div>
            <div className="benefit-label">Warranty</div>
            <div className="benefit-desc">{planBenefits.warranty}</div>
          </div>
        </div>

        {planBenefits.priority && (
          <div className="benefit-card">
            <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
              <FontAwesomeIcon icon={faBolt} className="benefit-card-icon" style={{ color: colors.primary }} />
            </div>
            <div className="benefit-content">
              <div className="benefit-value">VIP</div>
              <div className="benefit-label">Priority</div>
              <div className="benefit-desc">Jump the queue</div>
            </div>
          </div>
        )}

        <div className="benefit-card">
          <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
            <FontAwesomeIcon icon={faRocket} className="benefit-card-icon" style={{ color: colors.primary }} />
          </div>
          <div className="benefit-content">
            <div className="benefit-value">{planBenefits.emergency === -1 ? '∞' : planBenefits.emergency}</div>
            <div className="benefit-label">Emergency Visits</div>
            <div className="benefit-desc">
              {planBenefits.emergency === -1 ? 'Unlimited free visits' : `${planBenefits.emergency} free per month`}
            </div>
          </div>
        </div>

        {planBenefits.coordinator && (
          <div className="benefit-card">
            <div className="benefit-icon-wrapper" style={{ backgroundColor: colors.secondary }}>
              <FontAwesomeIcon icon={faUser} className="benefit-card-icon" style={{ color: colors.primary }} />
            </div>
            <div className="benefit-content">
              <div className="benefit-value">Personal</div>
              <div className="benefit-label">Coordinator</div>
              <div className="benefit-desc">Dedicated manager</div>
            </div>
          </div>
        )}
      </div>

      <div className="benefits-footer">
        <FontAwesomeIcon icon={faCheck} className="check-icon" />
        <span>All benefits active throughout subscription period</span>
      </div>
    </div>
  );
};

export default BenefitsDisplay;
