export const sanitizeAndValidateComment = (text) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Comment cannot be empty' };
  }
  
  if (text.length > 500) {
    return { isValid: false, error: 'Comment too long' };
  }
  
  return {
    isValid: true,
    sanitized: text.trim(),
    hasProfanity: false,
    error: null
  };
};