// Input Validation and Sanitization Utilities

/**
 * Sanitizes input by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and errors array
 */
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '123456', '123456789', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates name input
 * @param {string} name - Name to validate
 * @returns {object} - Validation result
 */
export const validateName = (name) => {
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (name.length > 50) {
    errors.push('Name must be less than 50 characters');
  }

  // Allow only letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - Validation result
 */
export const validatePhone = (phone) => {
  const errors = [];

  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length < 10) {
    errors.push('Phone number must be at least 10 digits');
  }

  if (digitsOnly.length > 15) {
    errors.push('Phone number must be less than 15 digits');
  }

  // Basic phone number pattern (allows international format)
  if (!/^\+?[\d\s\-()]+$/.test(phone)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates text input length and content
 * @param {string} text - Text to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
export const validateText = (text, options = {}) => {
  const {
    minLength = 0,
    maxLength = 1000,
    required = false,
    allowHtml = false
  } = options;

  const errors = [];

  if (required && (!text || text.trim().length === 0)) {
    errors.push('This field is required');
  }

  if (text && text.length < minLength) {
    errors.push(`Must be at least ${minLength} characters long`);
  }

  if (text && text.length > maxLength) {
    errors.push(`Must be less than ${maxLength} characters long`);
  }

  if (text && !allowHtml && /<[^>]*>/.test(text)) {
    errors.push('HTML tags are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates date input
 * @param {string} date - Date string to validate
 * @param {object} options - Validation options
 * @returns {object} - Validation result
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, allowPast = true } = options;
  const errors = [];

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    errors.push('Invalid date format');
    return { isValid: false, errors };
  }

  const now = new Date();

  if (!allowPast && dateObj < now.setHours(0, 0, 0, 0)) {
    errors.push('Date cannot be in the past');
  }

  if (minDate) {
    const minDateObj = new Date(minDate);
    if (dateObj < minDateObj) {
      errors.push(`Date must be after ${minDateObj.toLocaleDateString()}`);
    }
  }

  if (maxDate) {
    const maxDateObj = new Date(maxDate);
    if (dateObj > maxDateObj) {
      errors.push(`Date must be before ${maxDateObj.toLocaleDateString()}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates time input
 * @param {string} time - Time string to validate
 * @returns {object} - Validation result
 */
export const validateTime = (time) => {
  const errors = [];

  if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
    errors.push('Invalid time format (use HH:MM)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {object} - Validation result
 */
export const validateUrl = (url) => {
  const errors = [];

  try {
    const urlObj = new URL(url);

    // Check for potentially dangerous protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      errors.push('Only HTTP and HTTPS URLs are allowed');
    }

    // Check for localhost in production (optional)
    if (process.env.NODE_ENV === 'production' && urlObj.hostname === 'localhost') {
      errors.push('Localhost URLs are not allowed in production');
    }

  } catch (error) {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Comprehensive form validation
 * @param {object} formData - Form data object
 * @param {object} validationRules - Validation rules for each field
 * @returns {object} - Validation result with field-specific errors
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isFormValid = true;

  Object.keys(validationRules).forEach(fieldName => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];

    // Sanitize input first
    const sanitizedValue = sanitizeInput(value || '');

    // Apply validation rules
    const fieldErrors = [];

    rules.forEach(rule => {
      const { type, ...options } = rule;
      let result;

      switch (type) {
        case 'email':
          result = validateEmail(sanitizedValue);
          break;
        case 'password':
          result = validatePassword(sanitizedValue);
          break;
        case 'name':
          result = validateName(sanitizedValue);
          break;
        case 'phone':
          result = validatePhone(sanitizedValue);
          break;
        case 'text':
          result = validateText(sanitizedValue, options);
          break;
        case 'date':
          result = validateDate(sanitizedValue, options);
          break;
        case 'time':
          result = validateTime(sanitizedValue);
          break;
        case 'url':
          result = validateUrl(sanitizedValue);
          break;
        case 'required':
          if (!sanitizedValue || sanitizedValue.trim().length === 0) {
            result = { isValid: false, errors: ['This field is required'] };
          } else {
            result = { isValid: true, errors: [] };
          }
          break;
        default:
          result = { isValid: true, errors: [] };
      }

      if (!result.isValid) {
        fieldErrors.push(...result.errors);
      }
    });

    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
      isFormValid = false;
    }
  });

  return {
    isValid: isFormValid,
    errors,
    sanitizedData: Object.keys(formData).reduce((acc, key) => {
      acc[key] = sanitizeInput(formData[key] || '');
      return acc;
    }, {})
  };
};
