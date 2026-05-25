import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faKey, faPaperPlane, faArrowLeft, faEye, faEyeSlash, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { validateEmail, validatePassword } from '../utils/validation';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [step, setStep] = useState(1); // 1: email, 2: code + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Timer state for Resend logic
  const [resendCount, setResendCount] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

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

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (timer > 0) return; // Prevent sending while timer is active

    const errors = {};
    if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      toast.success('Reset code sent to your email!');
      setStep(2);
      setValidationErrors({});

      // Start the progressive timer
      const duration = getTimerDuration(resendCount);
      setTimer(duration);
      setResendCount((prev) => prev + 1);

    } catch (err) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to send reset code';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!code || code.length !== 6) {
      errors.code = 'Please enter the 6-digit code';
    }
    if (!validatePassword(newPassword)) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success('Password reset successful!');
        // Do NOT set loginToastShown here; App.js will handle the success toast for us globally.
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to reset password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <FontAwesomeIcon icon={step === 1 ? faEnvelope : faKey} className="auth-main-icon" />
          </div>
          <h2>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h2>
          <p className="auth-subtitle">
            {step === 1
              ? 'Enter your email and we\'ll send you a reset code'
              : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendCode}>
            <div className="form-group">
              <label htmlFor="email">
                <FontAwesomeIcon icon={faEnvelope} className="label-icon" />
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className={validationErrors.email ? 'error' : ''}
                />
              </div>
              {validationErrors.email && <div className="field-error">{validationErrors.email}</div>}
            </div>
            <button type="submit" className="submit-btn" disabled={loading || timer > 0}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending Code...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPaperPlane} className="btn-icon" />
                  {timer > 0 ? `Try again in ${formatTimer(timer)}` : 'Send Reset Code'}
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="code">
                <FontAwesomeIcon icon={faKey} className="label-icon" />
                Reset Code
              </label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                  }}
                  placeholder="Enter 6-digit code"
                  required
                  maxLength={6}
                  className={validationErrors.code ? 'error' : ''}
                />
              </div>
              {validationErrors.code && <div className="field-error">{validationErrors.code}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">
                <FontAwesomeIcon icon={faLock} className="label-icon" />
                New Password
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className={validationErrors.newPassword ? 'error' : ''}
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
              {validationErrors.newPassword && <div className="field-error">{validationErrors.newPassword}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <FontAwesomeIcon icon={faLock} className="label-icon" />
                Confirm Password
              </label>
              <div className="input-wrapper password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className={validationErrors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle password visibility"
                >
                  <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                </button>
              </div>
              {validationErrors.confirmPassword && <div className="field-error">{validationErrors.confirmPassword}</div>}
            </div>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Resetting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCheckCircle} className="btn-icon" />
                  Reset Password
                </>
              )}
            </button>
            <button
              type="button"
              className="forgot-resend-btn"
              onClick={handleSendCode}
              disabled={loading || timer > 0}
            >
              {timer > 0 ? `Resend Code in ${formatTimer(timer)}` : 'Resend Code'}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
