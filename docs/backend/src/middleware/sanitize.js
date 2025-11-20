const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize input to prevent XSS attacks
 * Removes HTML tags and dangerous characters from all string inputs
 */
const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Recursively sanitize an object
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeObject(value);
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Sanitize a string value
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return str;
  }
  
  // Remove HTML tags and dangerous characters
  const cleaned = DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // No HTML allowed
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  });
  
  // Trim whitespace
  return cleaned.trim();
}

module.exports = sanitize;
