import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faEnvelope, faRocket, faShieldHalved, faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons';
import { validateEmail, validatePassword } from '../utils/validation';
import './Auth.css';

const Login = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Trust verification states
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState('');
  
  // Timer states
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Scroll to top and start timer when verification screen appears
  useEffect(() => {
    if (needsVerification) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Start initial timer automatically
      if (resendTimer === 0 && resendCount === 0) {
        setResendTimer(30);
        setResendCount(1);
      }
    }
  }, [needsVerification]);

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

  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignIn = () => {
    if (!isLoaded) return;
    signIn.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/',
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!validatePassword(password)) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!isLoaded) return;

    setLoading(true);

    // REDUNDANCY CHECK: If timer is running for the same email, just show verification screen
    if (resendTimer > 0 && email.toLowerCase() === lastAttemptedEmail.toLowerCase()) {
      setNeedsVerification(true);
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem('loginToastShown');
        navigate('/');
      } else if (result.status === 'needs_first_factor' || result.status === 'needs_client_trust') {
        // Clerk requires email verification for device trust
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: result.supportedFirstFactors?.find(f => f.strategy === 'email_code')?.emailAddressId,
        });
        setNeedsVerification(true);
        setLastAttemptedEmail(email);
        toast.info('A verification code has been sent to your email.');
      }
    } catch (err) {
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Login failed. Please check your credentials and try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;

    setLoading(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        sessionStorage.removeItem('loginToastShown');
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
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: signIn.supportedFirstFactors?.find(f => f.strategy === 'email_code')?.emailAddressId,
      });
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

  // Verification code screen
  if (needsVerification) {
    return (
      <div className="auth-container">
        <div className="auth-form">
          <div className="auth-header">
            <div className="auth-icon-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="auth-main-icon" />
            </div>
            <h2>Verify Your Identity</h2>
            <p className="auth-subtitle">Enter the verification code sent to {email}</p>
          </div>
          <form onSubmit={handleVerifyCode}>
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
                  Verify & Sign In
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
                onClick={() => { setNeedsVerification(false); setVerificationCode(''); }}
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
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <FontAwesomeIcon icon={faShieldHalved} className="auth-main-icon" />
          </div>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to continue to FixHub</p>
        </div>
        <form onSubmit={onSubmit}>
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
                value={email}
                onChange={onChange}
                placeholder="Enter your email"
                required
                className={validationErrors.email ? 'error' : ''}
              />
            </div>
            {validationErrors.email && <div className="field-error">{validationErrors.email}</div>}
          </div>
          <div className="form-group">
            <label htmlFor="password">
              <FontAwesomeIcon icon={faLock} className="label-icon" />
              Password
            </label>
            <div className="input-wrapper password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Enter your password"
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
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faRocket} className="btn-icon" />
                Sign In
              </>
            )}
          </button>
          <p className="forgot-password-link">
            <Link to="/forgot-password">Forgot Password?</Link>
          </p>
        </form>

        <div className="oauth-divider">
          <span>or</span>
        </div>
        <button
          type="button"
          className="google-btn"
          onClick={handleGoogleSignIn}
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
          Don't have an account? <Link to="/register">Create one here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

