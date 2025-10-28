const passwordValidator = (password) => {
  const errors = [];
  
  // Check length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common passwords (simplified)
  const commonPasswords = ['password', '12345678', 'qwertyui', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  // Check for repetitive characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password must not contain repetitive characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = passwordValidator;