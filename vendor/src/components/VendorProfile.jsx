import React, { useState, useEffect } from 'react';
import { useVendor } from '../context/VendorContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import {
  HiOutlineUser, HiOutlineOfficeBuilding, HiOutlinePhone,
  HiOutlineMail, HiOutlineLocationMarker, HiOutlineStar,
  HiOutlineDocumentText, HiOutlineShieldCheck
} from 'react-icons/hi';
import { HiOutlinePencilSquare, HiOutlineArrowDownTray } from 'react-icons/hi2';
import './VendorProfile.css';

const VendorProfile = () => {
  const { vendor, updateVendor } = useVendor();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: vendor?.name || '',
    businessName: vendor?.businessName || '',
    phone: vendor?.phone || '',
    location: vendor?.location || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/vendor/profile', formData);
      updateVendor(res.data);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) return null;

  return (
    <div className="vendor-profile">
      <div className="vp-header">
        <h1>My Profile</h1>
        {!editing ? (
          <button className="vp-edit-btn" onClick={() => setEditing(true)}>
            <HiOutlinePencilSquare /> Edit Profile
          </button>
        ) : (
          <button className="vp-save-btn" onClick={handleSave} disabled={loading}>
            {loading ? <span className="vp-spinner"></span> : <HiOutlineArrowDownTray />}
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      <div className="vp-card">
        <div className="vp-avatar-section">
          <div className="vp-avatar-large">
            {vendor.profilePicture ? (
              <img src={`http://localhost:5000/${vendor.profilePicture}`} alt={vendor.name} />
            ) : (
              <span>{vendor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}</span>
            )}
          </div>
          <div>
            <h2>{vendor.name}</h2>
            <p className="vp-business-label">{vendor.businessName}</p>
            <div className="vp-tag-row">
              <span className="vp-category-tag">{vendor.serviceCategory}</span>
              <span className="vp-status-tag" data-status={vendor.status}>{vendor.status}</span>
              {vendor.isVerified && (
                <span className="vp-verified-tag">
                  <HiOutlineShieldCheck /> Verified
                </span>
              )}
            </div>
            {(vendor.rating > 0 || vendor.totalReviews > 0) && (
              <div className="vp-rating-row">
                <HiOutlineStar className="vp-star-icon" />
                <span className="vp-rating-value">{(vendor.rating || 0).toFixed(1)}</span>
                <span className="vp-rating-count">({vendor.totalReviews || 0} reviews)</span>
              </div>
            )}
          </div>
        </div>

        <div className="vp-form-grid">
          <div className="vp-field">
            <label><HiOutlineUser /> Full Name</label>
            {editing ? (
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
            ) : (
              <p>{vendor.name}</p>
            )}
          </div>

          <div className="vp-field">
            <label><HiOutlineOfficeBuilding /> Business Name</label>
            {editing ? (
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} />
            ) : (
              <p>{vendor.businessName}</p>
            )}
          </div>

          <div className="vp-field">
            <label><HiOutlineMail /> Email</label>
            <p>{vendor.email}</p>
          </div>

          <div className="vp-field">
            <label><HiOutlinePhone /> Phone</label>
            {editing ? (
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
            ) : (
              <p>{vendor.phone}</p>
            )}
          </div>

          <div className="vp-field">
            <label><HiOutlineLocationMarker /> Location</label>
            {editing ? (
              <input type="text" name="location" value={formData.location} onChange={handleChange} />
            ) : (
              <p>{vendor.location}</p>
            )}
          </div>
        </div>

        <div className="vp-documents">
          <h3>Uploaded Documents</h3>
          <div className="vp-doc-grid">
            <div className="vp-doc-card">
              <span className="vp-doc-icon"><HiOutlineDocumentText /></span>
              <span className="vp-doc-label">ID Proof</span>
              {vendor.idProof ? (
                <a href={`http://localhost:5000/${vendor.idProof}`} target="_blank" rel="noopener noreferrer" className="vp-doc-link">View</a>
              ) : (
                <span className="vp-doc-na">Not uploaded</span>
              )}
            </div>
            <div className="vp-doc-card">
              <span className="vp-doc-icon"><HiOutlineDocumentText /></span>
              <span className="vp-doc-label">Business Certificate</span>
              {vendor.businessCertificate ? (
                <a href={`http://localhost:5000/${vendor.businessCertificate}`} target="_blank" rel="noopener noreferrer" className="vp-doc-link">View</a>
              ) : (
                <span className="vp-doc-na">Not uploaded</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;
