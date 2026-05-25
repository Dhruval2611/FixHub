import React, { useState, useEffect, useRef } from 'react';
import './AccountSettings.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBell, faLock, faCamera, faEye, faEyeSlash, faUser, faTrash, faChevronDown, faChevronUp, faCrown, faRocket } from '@fortawesome/free-solid-svg-icons';
import { useClerk } from '@clerk/clerk-react';
import ImageCropper from './ImageCropper';
import PlanUpgradeModal from './PlanUpgradeModal';
import './AccountSettings.css';

const AccountSettings = ({ user: parentUser, setUser: setParentUser }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'preferences', 'subscription', 'security'

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: ''
  });

  // Preferences form state
  const [preferencesForm, setPreferencesForm] = useState({
    emailNotifications: true,
    smsReminders: true,
    marketingEmails: false
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signOut } = useClerk();
  
  // Delete account states
  const [deleteOtpRequested, setDeleteOtpRequested] = useState(false);
  const [deleteOtp, setDeleteOtp] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Timer state for Resend logic (Delete Account)
  const [deleteTimer, setDeleteTimer] = useState(0);
  const [deleteResendCount, setDeleteResendCount] = useState(0);

  // Subscription states
  const [subscription, setSubscription] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTargetPlan, setSelectedTargetPlan] = useState(null);
  const [upgradePriceData, setUpgradePriceData] = useState(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  // Cancel subscription states
  const [showCancelFlow, setShowCancelFlow] = useState(false);
  const [cancelStep, setCancelStep] = useState('reason'); // 'reason' | 'otp'
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOtpSent, setCancelOtpSent] = useState(false);
  const [cancelOtp, setCancelOtp] = useState('');
  const [cancelResendTimer, setCancelResendTimer] = useState(0);
  const [cancelError, setCancelError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');

  useEffect(() => {
    let interval = null;
    if (deleteTimer > 0) {
      interval = setInterval(() => {
        setDeleteTimer((prev) => prev - 1);
      }, 1000);
    } else if (deleteTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [deleteTimer]);

  // Cancel Timer Effect
  useEffect(() => {
    let interval = null;
    if (cancelResendTimer > 0) {
      interval = setInterval(() => {
        setCancelResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (cancelResendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [cancelResendTimer]);

  const getTimerDuration = (count) => {
    if (count === 0) return 30; // 30 seconds
    if (count === 1) return 60; // 1 minute
    if (count === 2) return 300; // 5 minutes
    return 600; // 10 minutes steady
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
    return `${s}s`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { 'x-auth-token': token }
        });

        setUser(response.data);
        setProfileForm({
          name: response.data.name || '',
          phone: response.data.phone || ''
        });
        setPreferencesForm({
          emailNotifications: response.data.emailNotifications ?? true,
          smsReminders: response.data.smsReminders ?? true,
          marketingEmails: response.data.marketingEmails ?? false
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/subscriptions/my-subscription', {
          headers: { 'x-auth-token': token }
        });
        setSubscription(response.data.subscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // Set default Basic plan if no subscription exists
        setSubscription({
          planName: 'Basic',
          planStatus: 'active',
          planStartDate: null,
          planExpiryDate: null,
          planPrice: 0,
          discountPercentage: 0,
          features: ['Access to all service categories', 'Standard booking', 'Normal service charges'],
          description: 'Access to all service categories, standard booking, limited support.',
          isExpired: false,
          canUpgrade: true,
          availableUpgrades: ['Premium', 'Elite'],
        });
      }
    };

    fetchSubscription();
  }, []);

  // Track unsaved changes
  const isProfileDirty = 
    profileForm.name !== (user?.name || '') || 
    profileForm.phone !== (user?.phone || '') || 
    profilePicture !== null;

  const isPreferencesDirty = 
    preferencesForm.emailNotifications !== (user?.emailNotifications ?? true) || 
    preferencesForm.smsReminders !== (user?.smsReminders ?? true) || 
    preferencesForm.marketingEmails !== (user?.marketingEmails ?? false);

  const isPasswordDirty = 
    passwordForm.currentPassword !== '' || 
    passwordForm.newPassword !== '' || 
    passwordForm.confirmPassword !== '';

  const hasUnsavedDataRef = useRef(false);

  useEffect(() => {
    let currentTabDirty = false;
    if (activeTab === 'profile' && isProfileDirty) currentTabDirty = true;
    if (activeTab === 'preferences' && isPreferencesDirty) currentTabDirty = true;
    if (activeTab === 'security' && isPasswordDirty) currentTabDirty = true;
    
    hasUnsavedDataRef.current = currentTabDirty;
  }, [activeTab, isProfileDirty, isPreferencesDirty, isPasswordDirty]);

  // Warn on tab close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedDataRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Intercept in-app link clicks
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (!hasUnsavedDataRef.current) return;
      const anchor = e.target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;
      if (href === window.location.pathname) return;

      const leave = window.confirm('You have unsaved changes. Are you sure you want to discard them and leave this section?');
      if (!leave) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);

  const discardChanges = () => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || ''
      });
      setPreferencesForm({
        emailNotifications: user.emailNotifications ?? true,
        smsReminders: user.smsReminders ?? true,
        marketingEmails: user.marketingEmails ?? false
      });
    }
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setProfilePicture(null);
    setPreviewUrl(null);
  };

  const handleTabChange = (newTab) => {
    if (activeTab === newTab) return;
    if (hasUnsavedDataRef.current) {
      const leave = window.confirm('You have unsaved changes. Are you sure you want to discard them and switch sections?');
      if (leave) {
        discardChanges();
        setActiveTab(newTab);
      }
    } else {
      setActiveTab(newTab);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = null;
    }
  };

  const handleCropComplete = (croppedFile) => {
    // Store the cropped file and preview URL for later save
    setProfilePicture(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('phone', profileForm.phone);
      
      // Include the cropped profile picture if one was selected
      if (profilePicture) {
        formData.append('profilePicture', profilePicture, 'profile.jpg');
      }

      const response = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: { 'x-auth-token': token }
      });

      setUser(response.data);
      // Update parent user state to refresh navbar
      if (setParentUser) {
        setParentUser(response.data);
      }
      
      // Reset profile picture state after successful save
      setProfilePicture(null);
      setPreviewUrl(null);

      toast.success('Profile details updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/auth/preferences', preferencesForm, {
        headers: { 'x-auth-token': token }
      });

      setUser(response.data);
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { 'x-auth-token': token }
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleRequestDeleteOtp = async () => {
    if (sendingOtp || deleteTimer > 0) return;
    setSendingOtp(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/request-delete-account-otp', {}, {
        headers: { 'x-auth-token': token }
      });
      setDeleteOtpRequested(true);
      toast.success('Verification code sent to your email');
      
      // Start the timer
      const duration = getTimerDuration(deleteResendCount);
      setDeleteTimer(duration);
      setDeleteResendCount((prev) => prev + 1);
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification code');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deleteOtp) return;
    if (!window.confirm('Are you ABSOLUTELY sure you want to permanently delete your account? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/auth/delete-account', { otp: deleteOtp }, {
        headers: { 'x-auth-token': token }
      });
      toast.success('Account permanently deleted.');
      localStorage.removeItem('token');
      if (setParentUser) {
        setParentUser(null);
      }
      await signOut(); // Clerk sign out, triggers App.js redirect
    } catch (error) {
      setIsDeleting(false);
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  // Handle plan upgrade click
  const handleUpgradeClick = async (targetPlan) => {
    if (!subscription || subscription.planName === targetPlan) return;
    
    if (subscription.planName === 'Elite' && targetPlan === 'Premium' && subscription.planStatus === 'active') {
      toast.error('you have already subscribed the Elite plan');
      return;
    }

    setSelectedTargetPlan(targetPlan);
    
    try {
      const token = localStorage.getItem('token');
      
      // Calculate upgrade price
      const response = await axios.post('http://localhost:5000/api/subscriptions/calculate-upgrade', 
        { targetPlan },
        { headers: { 'x-auth-token': token } }
      );
      
      setUpgradePriceData(response.data);
      setShowUpgradeModal(true);
    } catch (error) {
      console.error('Error calculating upgrade price:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate upgrade price');
    }
  };

  // Request OTP for subscription upgrade (called from modal)
  const handleRequestUpgradeOtp = async () => {
    const token = localStorage.getItem('token');
    await axios.post(
      'http://localhost:5000/api/subscriptions/request-otp',
      { action: 'subscription' },
      { headers: { 'x-auth-token': token } }
    );
  };

  // Confirm upgrade — receives OTP from modal
  const handleConfirmUpgrade = async (otp) => {
    if (!selectedTargetPlan || !upgradePriceData) return;
    setProcessingUpgrade(true);
    try {
      const token = localStorage.getItem('token');
      const purchaseResponse = await axios.post(
        'http://localhost:5000/api/subscriptions/purchase',
        { planName: selectedTargetPlan, planType: 'upgrade', otp },
        { headers: { 'x-auth-token': token } }
      );
      setSubscription(purchaseResponse.data.subscription);
      setShowUpgradeModal(false);
      setUpgradePriceData(null);
      setSelectedTargetPlan(null);
      toast.success(purchaseResponse.data.message || `Successfully upgraded to ${selectedTargetPlan} plan! 🎉`);
      const refreshResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { 'x-auth-token': token }
      });
      setUser(refreshResponse.data);
    } catch (error) {
      console.error('Error processing upgrade:', error);
      toast.error(error.response?.data?.message || 'Failed to process upgrade. Please try again.');
    } finally {
      setProcessingUpgrade(false);
    }
  };

  // Cancel subscription — step 1: request OTP
  const handleRequestCancelOtp = async () => {
    // Must select a reason
    if (!cancelReason.trim()) {
      setCancelError('Please select a reason for cancellation.');
      return;
    }
    // If "Other", require at least 10 characters
    if (cancelReason === 'Other') {
      if (!cancelReasonText.trim() || cancelReasonText.trim().length < 10) {
        setCancelError('Please describe your reason (at least 10 characters).');
        return;
      }
    }
    setCancelLoading(true);
    setCancelError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/subscriptions/request-otp',
        { action: 'cancellation' },
        { headers: { 'x-auth-token': token } }
      );
      setCancelOtpSent(true);
      setCancelStep('otp');
      setCancelResendTimer(30);
      toast.info('Verification code sent to your email.');
    } catch (error) {
      setCancelError(error.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setCancelLoading(false);
    }
  };

  const cancelSubmittingRef = useRef(false);

  useEffect(() => {
    if (!cancelLoading) cancelSubmittingRef.current = false;
  }, [cancelLoading]);

  // Cancel subscription — step 2: confirm with OTP
  const handleConfirmCancellation = async () => {
    if (cancelSubmittingRef.current || cancelLoading) return;
    cancelSubmittingRef.current = true;
    setCancelLoading(true);
    if (!cancelOtp || cancelOtp.length < 6) {
      setCancelError('Please enter the 6-digit verification code.');
      return;
    }
    setCancelError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/subscriptions/cancel',
        { otp: cancelOtp, reason: cancelReason },
        { headers: { 'x-auth-token': token } }
      );
      setSubscription(response.data.subscription);
      setShowCancelFlow(false);
      setCancelStep('reason');
      setCancelReason('');
      setCancelOtp('');
      setCancelOtpSent(false);
      toast.success('Your subscription has been cancelled.');
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message.toLowerCase().includes('verification code')) {
        setCancelError(error.response.data.message);
      } else {
        toast.error(error.response?.data?.message || 'Failed to cancel subscription');
      }
    } finally {
      setCancelLoading(false);
      cancelSubmittingRef.current = false;
    }
  };

  if (loading) {
    return <div className="account-settings-loading">Loading...</div>;
  }

  return (
    <div className="account-settings">
      {showCropper && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      {showUpgradeModal && selectedTargetPlan && (
        <PlanUpgradeModal
          currentPlan={subscription?.planName || 'Basic'}
          targetPlan={selectedTargetPlan}
          upgradePrice={upgradePriceData?.amount || 0}
          originalPrice={upgradePriceData?.originalPrice || 0}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedTargetPlan(null);
            setUpgradePriceData(null);
          }}
          onConfirm={handleConfirmUpgrade}
          onRequestOtp={handleRequestUpgradeOtp}
          loading={processingUpgrade}
        />
      )}

      <div className="account-layout">
        {/* Sidebar Navigation */}
        <div className="account-sidebar">
          <div className="user-mini-profile">
            <div className="mini-avatar">
              {user?.profilePicture && user.profilePicture.startsWith('uploads/') ? (
                <img
                  src={`http://localhost:5000/${user.profilePicture.replace(/^\/+/, '')}`}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              ) : (
                <FontAwesomeIcon icon={faUser} style={{ fontSize: '1.1rem' }} />
              )}
            </div>
            <div className="mini-info">
              <h3>{user?.name || 'User'}</h3>
              <p>{user?.email || 'email@example.com'}</p>
            </div>
          </div>

          <nav className="settings-nav">
            <button
              className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              Profile Information
            </button>
            <button
              className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => handleTabChange('preferences')}
            >
              Preferences
            </button>
            <button
              className={`nav-item ${activeTab === 'subscription' ? 'active' : ''}`}
              onClick={() => handleTabChange('subscription')}
            >
              Your Subscription
            </button>
            <button
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => handleTabChange('security')}
            >
              Security
            </button>
            <button
              className={`nav-item ${activeTab === 'delete' ? 'active' : ''}`}
              onClick={() => handleTabChange('delete')}
              style={{ color: '#DC2626' }}
            >
              Delete Account
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="account-content">
          <div className="content-card">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="tab-content">
                <h2>Profile Information</h2>
                <form className="settings-form" onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Profile Picture</label>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="profilePicture"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="file-input-hidden"
                        ref={fileInputRef}
                      />
                      <button
                        type="button"
                        className="file-input-label"
                        onClick={() => fileInputRef.current.click()}
                        style={{ border: '1px solid #D1D5DB', background: 'white' }}
                      >
                        <FontAwesomeIcon icon={faCamera} className="file-icon" />
                        {profilePicture ? 'Change Picture' : 'Choose Picture'}
                      </button>

                      {previewUrl && (
                        <div style={{ marginLeft: '10px', width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #E5E7EB' }}>
                          <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {!previewUrl && (
                        <span className="file-name">
                          {profilePicture ? 'Image selected' : 'No file chosen'}
                        </span>
                      )}
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">
                    <FontAwesomeIcon icon={faSave} />
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="tab-content">
                <h2>Preferences</h2>
                <form className="settings-form" onSubmit={handlePreferencesSubmit}>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferencesForm.emailNotifications}
                        onChange={(e) => setPreferencesForm({ ...preferencesForm, emailNotifications: e.target.checked })}
                      />
                      Email notifications for bookings
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferencesForm.smsReminders}
                        onChange={(e) => setPreferencesForm({ ...preferencesForm, smsReminders: e.target.checked })}
                      />
                      SMS reminders
                    </label>
                  </div>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferencesForm.marketingEmails}
                        onChange={(e) => setPreferencesForm({ ...preferencesForm, marketingEmails: e.target.checked })}
                      />
                      Marketing emails
                    </label>
                  </div>
                  <button type="submit" className="btn-primary">
                    <FontAwesomeIcon icon={faBell} />
                    Update Preferences
                  </button>
                </form>
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <div className="tab-content">
                <h2 style={{fontWeight:800, fontSize:'2rem', marginBottom:24}}>Your Subscription</h2>
                {loadingSubscription ? (
                  <div style={{textAlign: 'center', padding: '40px 0'}}>
                    <div className="spinner"></div>
                    <p>Loading subscription details...</p>
                  </div>
                ) : subscription ? (
                  <div style={{textAlign: 'left', padding: 0}}>
                    {/* Current Plan Info */}
                    <div style={{marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)', borderRadius: 12, border: '2px solid #E5E7EB'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                        <div>
                          <div style={{fontSize: '0.9rem', color: '#6B7280', marginBottom: 4}}>Current Plan</div>
                          <div style={{fontWeight: 700, fontSize: '1.8rem', color: '#111827'}}>
                            {subscription.planName || 'Basic'} Plan
                          </div>
                        </div>
                        {subscription.planName === 'Premium' && (
                          <span style={{padding: '4px 14px', background: '#f3f4f6', color: '#374151', borderRadius: 20, fontWeight: 600, fontSize: '0.78rem', border: '1px solid #e5e7eb', letterSpacing: '0.3px'}}>Most Popular</span>
                        )}
                        {subscription.planName === 'Elite' && (
                          <span style={{padding: '4px 14px', background: '#0d1117', color: '#fff', borderRadius: 20, fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.3px'}}>Elite Member</span>
                        )}
                      </div>
                      
                      {subscription.planStatus === 'active' && subscription.planExpiryDate && (
                        <div style={{color: '#6b7280', fontSize: '0.85rem', marginTop: 8}}>
                          Valid until: <span style={{color: '#111827', fontWeight: 600}}>{new Date(subscription.planExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      )}
                      
                      {subscription.isExpired && (
                        <div style={{marginTop: 10, padding: '10px 13px', background: '#f9fafb', border: '1.5px solid #d1d5db', borderRadius: 8, color: '#374151', fontWeight: 600, fontSize: '0.85rem'}}>
                          Your subscription has expired. Upgrade to continue enjoying premium benefits.
                        </div>
                      )}
                    </div>

                    {/* Plan Description */}
                    <div style={{marginBottom: 20}}>
                      <div style={{fontWeight: 600, fontSize: '1.05rem', color: '#111827', marginBottom: 8}}>Plan Benefits:</div>
                      <div style={{color: '#4B5563', fontSize: '0.95rem', lineHeight: 1.6}}>
                        {subscription.description || 'Access to all service categories, standard booking, limited support.'}
                      </div>
                    </div>

                    {/* Features List */}
                    <div style={{marginBottom: 20}}>
                      <div style={{fontWeight: 600, fontSize: '0.82rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10}}>What's Included</div>
                      <ul style={{margin: 0, paddingLeft: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px'}}>
                        {(subscription.features || [
                          'Access to all service categories',
                          'Standard booking',
                          'Normal service charges',
                          'Limited support',
                        ]).map((feature, idx) => (
                          <li key={idx} style={{fontSize: '0.85rem', color: '#374151', display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                            <span style={{color: '#374151', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, marginTop: 2}}>✓</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Discount Badge */}
                    {subscription.discountPercentage > 0 && (
                      <div style={{marginBottom: 24, padding: '14px 18px', background: '#f9fafb', borderRadius: 10, border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14}}>
                        <div style={{width: 44, height: 44, background: '#0d1117', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                          <span style={{fontSize: '1.05rem', fontWeight: 800, color: '#fff'}}>{subscription.discountPercentage}%</span>
                        </div>
                        <div>
                          <div style={{fontWeight: 700, color: '#111827', fontSize: '0.95rem'}}>Service Discount Active</div>
                          <div style={{color: '#6b7280', fontSize: '0.82rem'}}>You get {subscription.discountPercentage}% off on ALL services</div>
                        </div>
                      </div>
                    )}

                    {/* Upgrade Section */}
                    {subscription.canUpgrade !== false && subscription.planName !== 'Elite Yearly' && !subscription.isExpired && (
                      <div className="upgrade-section-modern">
                        <hr style={{border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0'}} />
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
                          <div style={{fontWeight: 700, fontSize: '1.05rem', color: '#111827'}}>Upgrade Your Plan</div>
                          <div style={{fontSize: '0.78rem', color: '#9ca3af', fontWeight: 500}}>One-click upgrade</div>
                        </div>         
                        
                        {(() => {
                          const upgrades = [];
                          const p = subscription.planName;
                          if (p === 'Basic') {
                            upgrades.push({ val: 'Premium', label: 'Premium Monthly (15% Savings)' });
                            upgrades.push({ val: 'Premium Yearly', label: 'Premium Yearly (Best Value)' });
                            upgrades.push({ val: 'Elite', label: 'Elite Monthly (25% Savings)' });
                            upgrades.push({ val: 'Elite Yearly', label: 'Elite Yearly (Ultimate Value)' });
                          } else if (p === 'Premium') {
                            upgrades.push({ val: 'Premium Yearly', label: 'Premium Yearly (Save 20%)' });
                            upgrades.push({ val: 'Elite', label: 'Elite Monthly (VIP Access)' });
                            upgrades.push({ val: 'Elite Yearly', label: 'Elite Yearly (Ultimate Value)' });
                          } else if (p === 'Premium Yearly') {
                            upgrades.push({ val: 'Elite Yearly', label: 'Elite Yearly (Ultimate Value)' });
                          } else if (p === 'Elite') {
                            upgrades.push({ val: 'Elite Yearly', label: 'Elite Yearly (Save 20%)' });
                          }

                          if (upgrades.length === 0) return null;

                          return (
                            <div className="upgrade-controls">
                              <div className="custom-dropdown-wrapper" style={{position: 'relative', flex: 1}}>
                                <select 
                                  className="plan-select-dropdown"
                                  onChange={(e) => {
                                    if (e.target.value) handleUpgradeClick(e.target.value);
                                  }}
                                  defaultValue=""
                                  style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1.5px solid #d1d5db',
                                    appearance: 'none',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    backgroundColor: '#fff',
                                    color: '#111827',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                  }}
                                  onFocus={e => { e.target.style.borderColor = '#111827'; e.target.style.boxShadow = '0 0 0 3px rgba(17,24,39,0.1)'; }}
                                  onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'; }}
                                >
                                  <option value="" disabled>Select a plan to upgrade...</option>
                                  {upgrades.map(u => (
                                    <option key={u.val} value={u.val}>{u.label}</option>
                                  ))}
                                </select>
                                <FontAwesomeIcon 
                                  icon={faChevronDown} 
                                  style={{position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280'}} 
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Cancel Subscription Section - Only visible during trial */}
                    {subscription && subscription.planName !== 'Basic' && subscription.planStatus === 'active' && subscription.trialEndDate && new Date(subscription.trialEndDate) > new Date() && (
                      <div style={{marginTop: 32}}>
                        <hr style={{border: 'none', borderTop: '1px solid #E5E7EB', margin: '0 0 24px'}} />
                        {!showCancelFlow ? (
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12}}>
                            <div>
                              <div style={{fontWeight: 700, fontSize: '1rem', color: '#374151'}}>Cancel Subscription</div>
                              <div style={{fontSize: '0.85rem', color: '#9CA3AF'}}>Revert to the Basic plan. Your premium benefits will be removed.</div>
                            </div>
                            <button
                              onClick={() => { setShowCancelFlow(true); setCancelStep('reason'); setCancelError(''); }}
                              style={{padding: '8px 18px', border: '1.5px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'}}
                              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#6b7280'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d1d5db'; }}
                            >
                              Cancel Subscription
                            </button>
                          </div>
                        ) : (
                          <div style={{background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: 18}}>
                            <div style={{fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 14}}>Cancel {subscription.planName} Plan</div>

                            {cancelStep === 'reason' && (
                              <>
                                <div style={{marginBottom: 12}}>
                                  <label style={{fontWeight: 600, fontSize: '0.78rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 6}}>Why are you cancelling?</label>
                                  <select
                                    value={cancelReason}
                                    onChange={e => { setCancelReason(e.target.value); setCancelReasonText(''); setCancelError(''); }}
                                    style={{width: '100%', padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 7, fontSize: '0.88rem', color: cancelReason ? '#111827' : '#9ca3af', background: '#fff', boxSizing: 'border-box'}}
                                  >
                                    <option value="">Select a reason...</option>
                                    <option>Too expensive</option>
                                    <option>Not using the features</option>
                                    <option>Found a better alternative</option>
                                    <option>Service quality issues</option>
                                    <option>Temporary break</option>
                                    <option>Other</option>
                                  </select>
                                </div>
                                {cancelReason === 'Other' && (
                                  <div style={{marginBottom: 8}}>
                                    <textarea
                                      placeholder="Please describe your reason (min. 10 characters)..."
                                      rows={3}
                                      value={cancelReasonText}
                                      onChange={e => { setCancelReasonText(e.target.value); setCancelError(''); }}
                                      style={{width: '100%', padding: '9px 12px', border: `1.5px solid ${cancelReasonText.length > 0 && cancelReasonText.length < 10 ? '#f59e0b' : '#d1d5db'}`, borderRadius: 7, fontSize: '0.88rem', resize: 'none', boxSizing: 'border-box', color: '#111827', fontFamily: 'inherit'}}
                                    />
                                    <div style={{fontSize: '0.73rem', color: cancelReasonText.length < 10 ? '#9ca3af' : '#374151', textAlign: 'right', marginTop: 3}}>
                                      {cancelReasonText.length}/10 characters minimum
                                    </div>
                                  </div>
                                )}
                                {cancelError && <div style={{color: '#dc2626', fontSize: '0.8rem', marginBottom: 8, fontWeight: 600}}>{cancelError}</div>}
                                <div style={{display: 'flex', gap: 10}}>
                                  <button onClick={() => setShowCancelFlow(false)} style={{flex: 1, padding: '10px', border: '1.5px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem'}}>Keep Plan</button>
                                  <button onClick={handleRequestCancelOtp} disabled={cancelLoading} style={{flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#0d1117', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem', opacity: cancelLoading ? 0.6 : 1}}>
                                    {cancelLoading ? 'Sending...' : 'Continue →'}
                                  </button>
                                </div>
                              </>
                            )}

                            {cancelStep === 'otp' && (
                              <div style={{ textAlign: 'center', marginTop: 10 }}>
                                <div style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: 20 }}>
                                  We'll send a one-time code to your registered email<br/>address to authorize this transaction.
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '10px 14px', marginBottom: 20, textAlign: 'left' }}>
                                  <div style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <span style={{marginRight: '6px'}}>✅</span>Code sent to your email.
                                  </div>
                                  <button onClick={handleRequestCancelOtp} disabled={cancelLoading || cancelResendTimer > 0} style={{ background: 'transparent', border: 'none', color: (cancelLoading || cancelResendTimer > 0) ? '#9CA3AF' : '#1F2937', fontWeight: 700, fontSize: '0.9rem', cursor: (cancelLoading || cancelResendTimer > 0) ? 'not-allowed' : 'pointer', textDecoration: 'underline', padding: 0 }}>
                                    {cancelLoading ? 'Sending...' : cancelResendTimer > 0 ? `Resend (${formatTimer(cancelResendTimer)})` : 'Resend'}
                                  </button>
                                </div>

                                <div style={{ textAlign: 'left', marginBottom: 20 }}>
                                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', display: 'block', marginBottom: 8, textAlign: 'center' }}>Enter 6-digit code</label>
                                  <input
                                    type="text"
                                    maxLength={6}
                                    placeholder="• • • • • •"
                                    value={cancelOtp}
                                    onChange={e => { setCancelOtp(e.target.value.replace(/\D/g,'')); setCancelError(''); }}
                                    style={{ width: '100%', maxWidth: '260px', margin: '0 auto', display: 'block', padding: '12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '12px', textAlign: 'center', boxSizing: 'border-box', color: '#111827', background: '#fff' }}
                                  />
                                </div>
                                {cancelError && <div style={{color: '#dc2626', fontSize: '0.85rem', marginBottom: 12, fontWeight: 600}}>{cancelError}</div>}
                                
                                <div style={{display: 'flex', gap: 10, maxWidth: '280px', margin: '0 auto'}}>
                                  <button onClick={() => setCancelStep('reason')} style={{flex: 1, padding: '10px', border: '1.5px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'}}>← Back</button>
                                  <button onClick={handleConfirmCancellation} disabled={cancelLoading || cancelOtp.length < 6} style={{flex: 1, padding: '10px', border: 'none', borderRadius: 8, background: '#0d1117', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: (cancelLoading || cancelOtp.length < 6) ? 0.5 : 1, transition: 'all 0.2s'}}>
                                    {cancelLoading ? 'Cancelling...' : 'Confirm'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{textAlign: 'center', padding: '40px 0'}}>
                    <p>Unable to load subscription information.</p>
                    <button className="upgrade-plan-btn" onClick={() => window.location.href='/pricing'}>
                      View Plans
                    </button>
                  </div>
                )}
              </div>
            )}
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-content">
                <h2>Security</h2>
                <form className="settings-form" onSubmit={handlePasswordSubmit}>
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        aria-label="Toggle current password visibility"
                      >
                        <FontAwesomeIcon icon={showCurrentPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label="Toggle new password visibility"
                      >
                        <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-wrapper">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        required
                        minLength="6"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label="Toggle confirm password visibility"
                      >
                        <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">
                    <FontAwesomeIcon icon={faLock} />
                    Change Password
                  </button>
                </form>
              </div>
            )}

            {/* Delete Account Tab */}
            {activeTab === 'delete' && (
              <div className="tab-content">
                <h2>Delete Account</h2>
                <div style={{ marginBottom: '24px', color: '#4B5563', fontSize: '1rem', lineHeight: '1.6' }}>
                  Deleting your account is permanent. All your data, profile information, and booking history will be irrevocably erased. If you rely on our services, we highly suggest you pause your account instead. If you're certain, request a verification code below to proceed.
                </div>

                {!deleteOtpRequested ? (
                  <button 
                    onClick={handleRequestDeleteOtp} 
                    className="btn-primary" 
                    disabled={sendingOtp || deleteTimer > 0}
                    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', opacity: (sendingOtp || deleteTimer > 0) ? 0.7 : 1 }}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    {sendingOtp ? 'Sending...' : deleteTimer > 0 ? `Try again in ${formatTimer(deleteTimer)}` : 'Request Deletion Code'}
                  </button>
                ) : (
                  <form className="settings-form" onSubmit={handleDeleteAccount}>
                    <div className="form-group">
                      <label>Verification Code</label>
                      <input
                        type="text"
                        value={deleteOtp}
                        onChange={(e) => setDeleteOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit code"
                        required
                        maxLength={6}
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={isDeleting} style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
                      <FontAwesomeIcon icon={faTrash} />
                      {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestDeleteOtp}
                      disabled={sendingOtp || deleteTimer > 0}
                      style={{
                        marginTop: '15px',
                        background: 'none',
                        border: 'none',
                        color: deleteTimer > 0 ? '#9CA3AF' : '#DC2626',
                        cursor: deleteTimer > 0 ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        padding: '0'
                      }}
                    >
                      {sendingOtp ? 'Sending...' : deleteTimer > 0 ? `Resend code in ${formatTimer(deleteTimer)}` : 'Resend verification code'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
