export const checkRateLimit = (action, userId) => {
  // Simple rate limiting - return allowed for now
  return { allowed: true, message: '' };
};

export const recordAction = (action, userId) => {
  // Simple action recording - do nothing for now
  console.log(`Action recorded: ${action} by ${userId}`);
};