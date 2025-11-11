export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentifizierung fehlgeschlagen. Bitte melden Sie sich erneut an.',
  FORBIDDEN: 'Sie haben keine Berechtigung für diese Aktion.',
  NOT_FOUND: 'Die angeforderte Ressource wurde nicht gefunden.',
  VALIDATION_ERROR: 'Überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.',
  NETWORK_ERROR: 'Internetverbindung fehlgeschlagen. Überprüfen Sie Ihre Verbindung.',
  SERVER_ERROR: 'Server ist vorübergehend nicht verfügbar. Versuchen Sie es später.',
  TIMEOUT_ERROR: 'Anfrage dauerte zu lange. Bitte versuchen Sie es erneut.',
  INVALID_CREDENTIALS: 'Email oder Passwort ist falsch',
  USER_NOT_FOUND: 'Benutzerkonto nicht gefunden',
  INSUFFICIENT_CREDITS: 'Sie haben nicht genügend Credits',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

export const getErrorMessage = (error: any, fallback?: string): string => {
  // If a fallback message is provided for null/undefined errors, use it
  if ((error === null || error === undefined) && fallback) {
    return fallback;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle objects with message property
  if (error?.message) {
    return error.message;
  }
  
  // Handle objects with response.data.error.message (API errors)
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  // Handle objects with code property
  if (error?.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES];
  }
  
  // Default fallback
  return ERROR_MESSAGES.UNKNOWN_ERROR;
};
