import React, { useState } from 'react';
import './AssetVault.css';

const AssetVault = () => {
  const [activeTab, setActiveTab] = useState('ledger');

  return (
    <div className="vault-clean-container">
      {/* Page Title Section */}
      <header className="vault-header-minimal">
        <div className="title-group">
          <h1>Asset Vault</h1>
          <p>Everything about your home & car in one place.</p>
        </div>
        <button className="add-asset-btn">+ Add New Asset</button>
      </header>

      {/* Modern Toggle Switcher */}
      <div className="vault-tab-wrapper">
        <div className="vault-tab-pill">
          {['ledger', 'floorplan', 'health'].map((tab) => (
            <button
              key={tab}
              className={`pill-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'ledger' && '📄 Maintenance'}
              {tab === 'floorplan' && '🗺️ 3D Maps'}
              {tab === 'health' && '❤️ Health'}
            </button>
          ))}
        </div>
      </div>

      <main className="vault-content-grid">
        {activeTab === 'ledger' && (
          <div className="ledger-view animate-up">
            <div className="vault-card-row">
              <div className="v-card">
                <div className="v-card-icon home">🏠</div>
                <div className="v-card-info">
                  <h3>Property Documents</h3>
                  <span>5 Documents • Last sync 2h ago</span>
                </div>
                <button className="v-action-btn">Open</button>
              </div>
              <div className="v-card">
                <div className="v-card-icon car">🚗</div>
                <div className="v-card-info">
                  <h3>Vehicle Insurance</h3>
                  <span className="expiring">Expires in 12 days</span>
                </div>
                <button className="v-action-btn primary">Renew</button>
              </div>
            </div>

            <div className="document-list-minimal">
              <h3>Recent Uploads</h3>
              <div className="doc-row">
                <p>AC_Service_Receipt.pdf</p>
                <span>Dec 24, 2025</span>
              </div>
              <div className="doc-row">
                <p>Home_Insurance_Policy.pdf</p>
                <span>Nov 10, 2025</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'floorplan' && (
          <div className="map-view animate-up">
            <div className="map-placeholder">
              <div className="map-overlay-text">
                <h3>3D Virtual Twin Active</h3>
                <p>Select a room or part to see maintenance history</p>
                <button className="view-3d-btn">Launch 3D Viewer</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="health-view animate-up">
            <div className="health-stat-card">
              <div className="stat-main">
                <span className="stat-label">Overall Health Score</span>
                <h2 className="stat-value">88<span>/100</span></h2>
              </div>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill" style={{width: '88%'}}></div>
              </div>
              <p className="stat-desc">Your assets are in <strong>Excellent</strong> condition.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssetVault;