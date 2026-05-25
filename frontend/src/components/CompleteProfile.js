import React, { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faUser, faPhone, faCheckCircle, faTimes } from '@fortawesome/free-solid-svg-icons';
import ImageCropper from './ImageCropper';
import './Auth.css';

const CompleteProfile = ({ user, onComplete, onSkip }) => {
  const { user: clerkUser } = useUser();

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const [name, setName] = useState(user?.name || clerkUser?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(() => {
    if (user?.profilePicture && !user.profilePicture.startsWith('http')) {
      return `http://localhost:5000/${user.profilePicture.replace(/^\/+/, '')}`;
    }
    return clerkUser?.imageUrl || user?.profilePicture || null;
  });

  // Sync previewUrl if Clerk user data arrives after initial render or check localStorage
  useEffect(() => {
    if (!previewUrl) {
      // Check localStorage first (persisted from registration)
      const cachedPhoto = localStorage.getItem('registrationPhoto');
      if (cachedPhoto) {
        setPreviewUrl(cachedPhoto);
        // Also set internal state so it's included in submit if unchanged
        // Since it's a data URL, we'll convert it to a blob on submit if needed
      } else if (clerkUser?.imageUrl) {
        setPreviewUrl(clerkUser.imageUrl);
      }
    }
  }, [clerkUser, previewUrl]);

  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile) => {
    setProfilePicture(croppedFile);
    setPreviewUrl(URL.createObjectURL(croppedFile));
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (phone.trim() && phone.trim().length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());
      formData.append('isProfileCompletion', 'true'); // Trigger welcome email on backend
      
      if (profilePicture) {
        formData.append('profilePicture', profilePicture, 'profile.jpg');
      } else {
        // Check if we have a cached registration photo that wasn't changed
        const cachedPhoto = localStorage.getItem('registrationPhoto');
        if (cachedPhoto && previewUrl === cachedPhoto) {
          // Convert dataURL to blob for submission
          const response = await fetch(cachedPhoto);
          const blob = await response.blob();
          formData.append('profilePicture', blob, 'registration_profile.jpg');
        }
      }

      const response = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: { 'x-auth-token': token }
      });

      // Cleanup registration photo after successful save
      localStorage.removeItem('registrationPhoto');

      toast.success('Profile updated!');
      if (onComplete) onComplete(response.data);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="profile-modal-overlay" onClick={onSkip}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <button className="profile-modal-close" onClick={onSkip} type="button">
            <FontAwesomeIcon icon={faTimes} />
          </button>

          <div className="auth-header">
            <h2>Complete Your Profile</h2>
            <p className="auth-subtitle">Add a few details to personalize your experience</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Profile Picture */}
            <div className="complete-profile-photo">
              <div
                className="profile-photo-preview"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="photo-placeholder-icon" />
                )}
                <div className="photo-overlay">
                  <FontAwesomeIcon icon={faCamera} />
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <p className="photo-hint">Click to add profile photo</p>
            </div>

            {/* Name */}
            <div className="form-group">
              <label htmlFor="cp-name">
                <FontAwesomeIcon icon={faUser} className="label-icon" />
                Full Name
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="cp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label htmlFor="cp-phone">
                <FontAwesomeIcon icon={faPhone} className="label-icon" />
                Phone Number <span className="optional-label">(optional)</span>
              </label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  id="cp-phone"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 10) setPhone(value);
                  }}
                  placeholder="Enter your 10-digit number"
                  maxLength={10}
                />
              </div>
            </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCheckCircle} className="btn-icon" />
                Save Profile
              </>
            )}
            </button>

            <button type="button" className="skip-btn" onClick={onSkip}>
              Skip for now
            </button>
          </form>
        </div>
      </div>
      {showCropper && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
};

export default CompleteProfile;
