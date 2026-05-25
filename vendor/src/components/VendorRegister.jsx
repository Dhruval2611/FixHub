import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useVendor } from '../context/VendorContext';
import api from '../api/axios';
import {
  HiOutlineUser, HiOutlineMail, HiOutlineLockClosed,
  HiOutlinePhone, HiOutlineOfficeBuilding, HiOutlineLocationMarker,
  HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineUpload, HiOutlineCheck
} from 'react-icons/hi';
import { HiWrenchScrewdriver } from 'react-icons/hi2';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import './VendorLogin.css';

const SERVICE_CATEGORIES = [
  'Electrician', 'AC Technician', 'Plumber', 'Mechanic',
  'Home Cleaner', 'Sofa Cleaner', 'Home Painter'
];

const VendorRegister = () => {
  const navigate = useNavigate();
  const { loginVendor } = useVendor();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    serviceCategory: '',
    location: '',
  });

  const [files, setFiles] = useState({
    idProof: null,
    businessCertificate: null,
  });

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'businessName':
        if (!value.trim()) return 'Business name is required';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!/^[\d\s+\-()]{10,15}$/.test(value.replace(/\s/g, ''))) return 'Enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      case 'serviceCategory':
        if (!value) return 'Please select a service category';
        return '';
      case 'location':
        if (!value.trim()) return 'Location is required';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
    // Revalidate confirm password when password changes
    if (name === 'password' && touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value),
        confirmPassword: formData.confirmPassword !== value ? 'Passwords do not match' : '',
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;
    if (fileList[0]) {
      setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    }
  };

  const validateStep1 = () => {
    const fields = ['name', 'businessName', 'email', 'phone', 'password', 'confirmPassword'];
    const newErrors = {};
    const newTouched = {};
    fields.forEach(f => {
      newErrors[f] = validateField(f, formData[f]);
      newTouched[f] = true;
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(prev => ({ ...prev, ...newTouched }));
    return !fields.some(f => newErrors[f]);
  };

  const validateStep2 = () => {
    const fields = ['serviceCategory', 'location'];
    const newErrors = {};
    const newTouched = {};
    fields.forEach(f => {
      newErrors[f] = validateField(f, formData[f]);
      newTouched[f] = true;
    });
    setErrors(prev => ({ ...prev, ...newErrors }));
    setTouched(prev => ({ ...prev, ...newTouched }));
    return !fields.some(f => newErrors[f]);
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!files.idProof) {
      toast.error('ID Proof document is required');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key !== 'confirmPassword') data.append(key, val);
      });
      data.append('idProof', files.idProof);
      if (files.businessCertificate) {
        data.append('businessCertificate', files.businessCertificate);
      }

      const res = await api.post('/vendor/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      loginVendor(res.data.token, res.data.vendor);
      toast.success('Registration successful! Awaiting admin approval.');
      navigate('/pending');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (s) => {
    if (s < step) return 'v-step completed';
    if (s === step) return 'v-step active';
    return 'v-step';
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { level: 0, label: '', cls: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { level: 1, label: 'Weak', cls: 'strength-weak' };
    if (score <= 3) return { level: 2, label: 'Medium', cls: 'strength-medium' };
    return { level: 3, label: 'Strong', cls: 'strength-strong' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="vendor-auth-container">
      <div className="vendor-auth-card" style={{ maxWidth: 540 }}>
        <div className="vendor-auth-header">
          <div className="vendor-auth-logo">
            <span className="logo-icon"><HiWrenchScrewdriver /></span>
            <span className="logo-text">FixHub</span>
            <span className="logo-badge">Vendor</span>
          </div>
          <h1>Create Account</h1>
          <p>Register as a service vendor</p>
        </div>

        {/* Steps Indicator */}
        <div className="v-steps">
          <div className={getStepClass(1)}>
            <span className="v-step-number">{step > 1 ? <HiOutlineCheck /> : '1'}</span>
            <span className="v-step-label">Profile</span>
          </div>
          <div className={`v-step-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className={getStepClass(2)}>
            <span className="v-step-number">{step > 2 ? <HiOutlineCheck /> : '2'}</span>
            <span className="v-step-label">Service</span>
          </div>
          <div className={`v-step-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className={getStepClass(3)}>
            <span className="v-step-number">3</span>
            <span className="v-step-label">Documents</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="vendor-auth-form" noValidate>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <>
              <div className="v-form-row">
                <div className="v-form-group">
                  <label><HiOutlineUser className="label-icon" /> Full Name</label>
                  <div className={`v-input-wrapper ${errors.name && touched.name ? 'v-input-error' : ''}`}>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} placeholder="John Doe" />
                  </div>
                  {errors.name && touched.name && <span className="v-field-error"><FiAlertCircle /> {errors.name}</span>}
                </div>
                <div className="v-form-group">
                  <label><HiOutlineOfficeBuilding className="label-icon" /> Business Name</label>
                  <div className={`v-input-wrapper ${errors.businessName && touched.businessName ? 'v-input-error' : ''}`}>
                    <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} onBlur={handleBlur} placeholder="Doe Services" />
                  </div>
                  {errors.businessName && touched.businessName && <span className="v-field-error"><FiAlertCircle /> {errors.businessName}</span>}
                </div>
              </div>

              <div className="v-form-group">
                <label><HiOutlineMail className="label-icon" /> Email</label>
                <div className={`v-input-wrapper ${errors.email && touched.email ? 'v-input-error' : ''}`}>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} placeholder="you@company.com" />
                </div>
                {errors.email && touched.email && <span className="v-field-error"><FiAlertCircle /> {errors.email}</span>}
              </div>

              <div className="v-form-group">
                <label><HiOutlinePhone className="label-icon" /> Phone</label>
                <div className={`v-input-wrapper ${errors.phone && touched.phone ? 'v-input-error' : ''}`}>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} placeholder="+91 9876543210" />
                </div>
                {errors.phone && touched.phone && <span className="v-field-error"><FiAlertCircle /> {errors.phone}</span>}
              </div>

              <div className="v-form-row">
                <div className="v-form-group">
                  <label><HiOutlineLockClosed className="label-icon" /> Password</label>
                  <div className={`v-input-wrapper v-password-wrapper ${errors.password && touched.password ? 'v-input-error' : ''}`}>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} placeholder="Min 6 chars" />
                    <button type="button" className="v-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="v-password-strength">
                      <div className={`v-strength-bar ${strength.cls}`}>
                        <div className="v-strength-fill" style={{ width: `${(strength.level / 3) * 100}%` }}></div>
                      </div>
                      <span className={`v-strength-label ${strength.cls}`}>{strength.label}</span>
                    </div>
                  )}
                  {errors.password && touched.password && <span className="v-field-error"><FiAlertCircle /> {errors.password}</span>}
                </div>
                <div className="v-form-group">
                  <label><HiOutlineLockClosed className="label-icon" /> Confirm</label>
                  <div className={`v-input-wrapper ${errors.confirmPassword && touched.confirmPassword ? 'v-input-error' : ''}`}>
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} placeholder="Re-enter" />
                  </div>
                  {errors.confirmPassword && touched.confirmPassword && <span className="v-field-error"><FiAlertCircle /> {errors.confirmPassword}</span>}
                </div>
              </div>

              <button type="button" className="v-next-btn" onClick={nextStep}>
                Continue <HiOutlineArrowRight />
              </button>
            </>
          )}

          {/* Step 2: Service Info */}
          {step === 2 && (
            <>
              <div className="v-form-group">
                <label><HiOutlineOfficeBuilding className="label-icon" /> Service Category</label>
                <div className={`v-input-wrapper ${errors.serviceCategory && touched.serviceCategory ? 'v-input-error' : ''}`}>
                  <select name="serviceCategory" value={formData.serviceCategory} onChange={handleChange} onBlur={handleBlur}>
                    <option value="">Select a category</option>
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {errors.serviceCategory && touched.serviceCategory && <span className="v-field-error"><FiAlertCircle /> {errors.serviceCategory}</span>}
              </div>

              <div className="v-form-group">
                <label><HiOutlineLocationMarker className="label-icon" /> Location (City)</label>
                <div className={`v-input-wrapper ${errors.location && touched.location ? 'v-input-error' : ''}`}>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} onBlur={handleBlur} placeholder="e.g. Mumbai, Delhi, Bangalore" />
                </div>
                {errors.location && touched.location && <span className="v-field-error"><FiAlertCircle /> {errors.location}</span>}
              </div>

              <div className="v-form-nav">
                <button type="button" className="v-back-btn" onClick={prevStep}>
                  <HiOutlineArrowLeft /> Back
                </button>
                <button type="button" className="v-next-btn" onClick={nextStep}>
                  Continue <HiOutlineArrowRight />
                </button>
              </div>
            </>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <>
              <div className="v-form-group">
                <label><HiOutlineUpload className="label-icon" /> ID Proof *</label>
                <div className="v-file-upload">
                  <label className={`v-file-label ${files.idProof ? 'has-file' : ''}`} htmlFor="idProof">
                    <HiOutlineUpload className="v-file-icon" />
                    <span className="v-file-text">
                      {files.idProof ? <span className="file-name">{files.idProof.name}</span> : 'Upload ID Proof (Aadhar, PAN, etc.)'}
                    </span>
                  </label>
                  <input type="file" id="idProof" name="idProof" onChange={handleFileChange} accept="image/*,.pdf" style={{ display: 'none' }} />
                  <span className="v-file-hint">Accepted: Images, PDF (max 10MB)</span>
                </div>
              </div>

              <div className="v-form-group">
                <label><HiOutlineUpload className="label-icon" /> Business Certificate (Optional)</label>
                <div className="v-file-upload">
                  <label className={`v-file-label ${files.businessCertificate ? 'has-file' : ''}`} htmlFor="businessCertificate">
                    <HiOutlineUpload className="v-file-icon" />
                    <span className="v-file-text">
                      {files.businessCertificate ? <span className="file-name">{files.businessCertificate.name}</span> : 'Upload Business Certificate'}
                    </span>
                  </label>
                  <input type="file" id="businessCertificate" name="businessCertificate" onChange={handleFileChange} accept="image/*,.pdf" style={{ display: 'none' }} />
                  <span className="v-file-hint">GST, Trade License, etc. (optional)</span>
                </div>
              </div>

              <div className="v-form-nav">
                <button type="button" className="v-back-btn" onClick={prevStep}>
                  <HiOutlineArrowLeft /> Back
                </button>
                <button type="submit" className="v-next-btn" disabled={loading}>
                  {loading ? (
                    <><span className="v-spinner"></span> Registering...</>
                  ) : (
                    <>Submit Application <HiOutlineArrowRight /></>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <p className="vendor-auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default VendorRegister;
