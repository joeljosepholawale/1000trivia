export const userFriendlyMessages: Record<string, string> = {
  'INVALID_CREDENTIALS': 'Email or password is incorrect',
  'USER_NOT_FOUND': 'User account not found',
  'INSUFFICIENT_CREDITS': 'You don\'t have enough credits',
  'NETWORK_ERROR': 'Connection failed. Check your internet.',
  'SERVER_ERROR': 'Server is temporarily unavailable. Try again.',
  'TIMEOUT': 'Request took too long. Please try again.',
  'VALIDATION_ERROR': 'Please check your input and try again.',
  'UNKNOWN_ERROR': 'Something went wrong. Please try again.',
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return userFriendlyMessages[error] || error;
  }
  
  if (error?.code) {
    return userFriendlyMessages[error.code] || error.message || 'An error occurred';
  }
  
  return userFriendlyMessages['UNKNOWN_ERROR'];
};
