const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const API_ENDPOINTS = {
  projects: '/api/projects',
  settings: '/api/settings',
  logs: '/api/logs',
  codebase: '/api/codebase',
};

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.statusText}`;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
    } catch (e) {
      // If parsing fails, use the default error message
    }
    
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
}