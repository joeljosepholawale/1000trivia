export const normalizeResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(normalizeResponse);
  }

  if (data === null || typeof data !== 'object') {
    return data;
  }

  const normalized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    normalized[camelKey] = normalizeResponse(value);
  }
  return normalized;
};

export const handleApiError = (error: any) => {
  const message = error.response?.data?.error?.message || 
                  'An error occurred. Please try again.';
  const code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
  
  return { message, code, details: error.response?.data?.error?.details };
};
