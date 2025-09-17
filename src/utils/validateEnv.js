export const validateEnvironment = () => {
  const errors = [];
  
  if (!process.env.REACT_APP_SUPABASE_URL) {
    errors.push('Missing REACT_APP_SUPABASE_URL');
  }
  
  if (!process.env.REACT_APP_SUPABASE_ANON_KEY) {
    errors.push('Missing REACT_APP_SUPABASE_ANON_KEY');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};