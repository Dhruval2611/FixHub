import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-badge"></div>
            <div className="skeleton-content">
              <div className="skeleton-title"></div>
              <div className="skeleton-rating"></div>
              <div className="skeleton-description"></div>
              <div className="skeleton-price"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className="skeleton-text">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
            <div className="skeleton-line"></div>
          </div>
        );
      case 'profile':
        return (
          <div className="skeleton-profile">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info">
              <div className="skeleton-name"></div>
              <div className="skeleton-email"></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div className="skeleton-table">
            <div className="skeleton-row">
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell short"></div>
            </div>
            <div className="skeleton-row">
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell"></div>
              <div className="skeleton-cell short"></div>
            </div>
          </div>
        );
      default:
        return <div className="skeleton-default"></div>;
    }
  };

  return (
    <div className="skeleton-loader">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
