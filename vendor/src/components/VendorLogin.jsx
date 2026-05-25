import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useVendor } from '../context/VendorContext';
import api from '../api/axios';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './VendorLogin.css';

const VendorLogin = () => {
  const navigate = useNavigate();
  const { loginVendor } = useVendor();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });

    if (Object.values(newErrors).some(err => err)) return;

    setLoading(true);
    try {
      const res = await api.post('/vendor/login', formData);
      loginVendor(res.data.token, res.data.vendor);

      if (res.data.vendor.status === 'pending') {
        toast.info('Your account is pending approval.');
        navigate('/pending');
      } else {
        toast.success(`Welcome back, ${res.data.vendor.name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vendor-auth-container">
      <div className="vendor-auth-card">
        <div className="vendor-auth-header">
          <div className="vendor-auth-logo">
            <span className="logo-icon"><HiWrenchScrewdriver /></span>
            <span className="logo-text">FixHub</span>
            <span className="logo-badge">Vendor</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your vendor portal</p>
        </div>

        <form onSubmit={handleSubmit} className="vendor-auth-form" noValidate>
          <div className="v-form-group">
            <label>
              <HiOutlineMail className="label-icon" />
              Email Address
            </label>
            <div className={`v-input-wrapper ${errors.email && touched.email ? 'v-input-error' : ''}`}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            {errors.email && touched.email && (
              <span className="v-field-error"><FiAlertCircle /> {errors.email}</span>
            )}
          </div>

          <div className="v-form-group">
            <label>
              <HiOutlineLockClosed className="label-icon" />
              Password
            </label>
            <div className={`v-input-wrapper v-password-wrapper ${errors.password && touched.password ? 'v-input-error' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="v-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && touched.password && (
              <span className="v-field-error"><FiAlertCircle /> {errors.password}</span>
            )}
          </div>

          <button type="submit" className="v-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="v-spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <HiOutlineArrowRight />
              </>
            )}
          </button>
        </form>

        <p className="vendor-auth-footer">
          Don't have an account? <Link to="/register">Register as Vendor</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorLogin;
