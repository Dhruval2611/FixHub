import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignUp, useClerk } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faKey, faCamera, faRocket, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { validateEmail, validatePassword } from '../utils/validation';
import ImageCropper from './ImageCropper';
import './Auth.css';

const Register = () => {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { client } = useClerk();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Cropper states
  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification states
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState('');
  
  // Timer states
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Scroll to top and start timer when verification screen appears
  useEffect(() => {
    if (pendingVerification) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Start initial timer automatically
      if (resendTimer === 0 && resendCount === 0) {
        setResendTimer(30);
        setResendCount(1);
      }
    }
  }, [pendingVerification]);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const getTimerDuration = (count) => {
    if (count === 0) return 30;
    if (count === 1) return 60;
    if (count === 2) return 300;
    return 600;
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
    return `${s}s`;
  };

  // ── Navigation guard ──
  const hasUnsavedDataRef = useRef(false);

  // Keep the ref in sync with form state
  useEffect(() => {
    hasUnsavedDataRef.current = !registrationComplete && (
      pendingVerification ||
      formData.name.trim() !== '' ||
      formData.email.trim() !== '' ||
      formData.password !== '' ||
      formData.confirmPassword !== ''
    );
  }, [formData, pendingVerification, registrationComplete]);

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

  // Warn on browser back/forward (popstate)
  useEffect(() => {
    // Push a dummy state so we can catch "back" navigation
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      if (hasUnsavedDataRef.current) {
        const leave = window.confirm(
          'You have an incomplete registration. If you leave now, you\'ll need to restart the account creation process.\n\nAre you sure you want to leave?'
        );
        if (leave) {
          window.history.back();
        } else {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Intercept in-app link clicks (React Router <Link> uses <a> tags)
  useEffect(() => {
    const handleLinkClick = (e) => {
      if (!hasUnsavedDataRef.current) return;

      // Find the closest <a> tag
      const anchor = e.target.closest('a');
      if (!anchor) return;

      // Only intercept same-origin internal links
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;

      // Don't block same-page links
      if (href === window.location.pathname) return;

      const leave = window.confirm(
        'You have an incomplete registration. If you leave now, you\'ll need to restart the account creation process.\n\nAre you sure you want to leave?'
      );

      if (!leave) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Use capture phase to intercept before React Router processes the click
    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      e.target.value = null;
    }
  };

  const handleCropComplete = (croppedFile) => {
    setProfilePicture(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPreviewUrl(url);
    setShowCropper(false);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationErrors({});

    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!isLoaded) return;

      setLoading(true);

      // REDUNDANCY CHECK: If timer is running for the same email, just show verification screen
      if (resendTimer > 0 && formData.email.toLowerCase() === lastAttemptedEmail.toLowerCase()) {
        setPendingVerification(true);
        setLoading(false);
        return;
      }

      try {
        const nameParts = formData.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Check if we need to create a new sign up or if one is already in progress
        if (!signUp.id || signUp.emailAddress !== formData.email.toLowerCase()) {
          await signUp.create({
            emailAddress: formData.email,
            password: formData.password,
            firstName,
            lastName,
          });
        }

        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
        setLastAttemptedEmail(formData.email);

        // PERSIST PHOTO: Save the registration photo for later use in the profile modal
        if (imageSrc) {
          localStorage.setItem('registrationPhoto', imageSrc);
        }

        toast.success('Verification code sent to your email!');
    } catch (err) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        setRegistrationComplete(true);
        await setActive({ session: result.createdSessionId });

        // Upload profile picture to Clerk if provided during registration
        if (profilePicture && client?.sessions) {
          try {
            const activeSession = client.sessions.find(s => s.id === result.createdSessionId);
            if (activeSession && activeSession.user) {
              await activeSession.user.setProfileImage({ file: profilePicture });
            }
          } catch (imgErr) {
            console.error('Failed to upload profile picture to Clerk:', imgErr);
            toast.error('Account created, but failed to upload profile picture.');
          }
        }

        toast.success(
          <div>
            <strong>Account created successfully!</strong>
            <br />Directing you to your workspace...
          </div>
        );
        navigate('/');
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || resendTimer > 0) return;
    
    setIsResending(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      toast.success('New verification code sent!');
      
      const nextDuration = getTimerDuration(resendCount);
      setResendTimer(nextDuration);
      setResendCount(prev => prev + 1);
    } catch (err) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to resend code.';
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="auth-main-icon" />
            </div>
            <h2>Verify Email</h2>
            <p className="auth-subtitle">Enter the verification code sent to {formData.email}</p>
          </div>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="verificationCode">
                <FontAwesomeIcon icon={faKey} className="label-icon" />
                Verification Code
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                />
              </div>
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Verifying...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faRocket} className="btn-icon" />
                  Verify & Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-compact" style={{ 
            marginTop: '32px', 
            paddingTop: '24px', 
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center'
          }}>
            <p style={{ color: '#6B7280', fontSize: '13px', margin: '0' }}>
              Didn't receive the code?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendTimer > 0 || isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendTimer > 0 || isResending ? '#9CA3AF' : '#111827',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: resendTimer > 0 || isResending ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
              >
                {isResending ? (
                  <span className="loading-spinner-small"></span>
                ) : null}
                {resendTimer > 0 ? (
                  `Resend in ${formatTimer(resendTimer)}`
                ) : (
                  'Resend Code'
                )}
              </button>

              <span style={{ color: '#E5E7EB', userSelect: 'none' }}>|</span>

              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#6B7280', 
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#111827'}
                onMouseOut={(e) => e.currentTarget.style.color = '#6B7280'}
              >
                Back to Registration
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {showCropper && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      <div className="auth-form">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <FontAwesomeIcon icon={faRocket} className="auth-main-icon" />
          </div>
          <h2>Join FixHub</h2>
          <p className="auth-subtitle">Create your account to get started</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <FontAwesomeIcon icon={faUser} className="label-icon" />
              Full Name
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                className={validationErrors.name ? 'error' : ''}
              />
            </div>
            {validationErrors.name && <div className="field-error">{validationErrors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FontAwesomeIcon icon={faEnvelope} className="label-icon" />
              Email Address
            </label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                className={validationErrors.email ? 'error' : ''}
              />
            </div>
            {validationErrors.email && <div className="field-error">{validationErrors.email}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <FontAwesomeIcon icon={faKey} className="label-icon" />
              Password
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                required
                className={validationErrors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {validationErrors.password && <div className="field-error">{validationErrors.password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FontAwesomeIcon icon={faKey} className="label-icon" />
              Confirm Password
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                className={validationErrors.confirmPassword ? 'error' : ''}
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
            {validationErrors.confirmPassword && <div className="field-error">{validationErrors.confirmPassword}</div>}
          </div>

          <div className="form-group">
            <label>
              <FontAwesomeIcon icon={faCamera} className="label-icon" />
              Profile Picture (Optional)
            </label>
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
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#374151',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FontAwesomeIcon icon={faCamera} />
                Choose Image
              </button>

              {previewUrl && (
                <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', border: '2px solid #E5E7EB' }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                {profilePicture ? 'Image selected' : 'No file chosen'}
              </span>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Creating Account...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRocket} className="btn-icon" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="oauth-divider">
          <span>or</span>
        </div>
        <button
          type="button"
          className="google-btn"
          onClick={() => {
            if (!isLoaded) return;
            signUp.authenticateWithRedirect({
              strategy: 'oauth_google',
              redirectUrl: '/sso-callback',
              redirectUrlComplete: '/',
            });
          }}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
