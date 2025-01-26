// Password validation
exports.validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  // Password must be at least 8 characters long and contain:
  // - At least one uppercase letter
  // - At least one lowercase letter
  // - At least one number
  // - At least one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation
exports.validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  // Support Syrian phone numbers
  const phoneRegex = /^(\+?963|0)?9\d{8}$/;
  // Remove any spaces or special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return phoneRegex.test(cleanPhone);
};

// Name validation
exports.validateName = (name) => {
  if (!name || typeof name !== 'string') return false;
  // Name should be 2-50 characters long and contain only letters and spaces
  const nameRegex = /^[\u0600-\u06FF\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

// Location coordinates validation
exports.validateLocation = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return false;
  
  const [longitude, latitude] = coordinates;
  
  // Check if coordinates are valid numbers within range
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
};
