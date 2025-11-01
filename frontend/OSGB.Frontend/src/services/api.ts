// Updated API service with authentication support
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5006/api';
console.log('API_BASE_URL:', API_BASE_URL);

// Store token in memory (in a real app, you might want to use localStorage)
let authToken: string | null = null;
let organizationId: number | null = null;

// Initialize auth token and organization ID from localStorage
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('authToken');
  const storedOrgId = localStorage.getItem('organizationId');
  if (storedOrgId) {
    organizationId = parseInt(storedOrgId, 10);
  }
}

// Rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 100;
const requestTimestamps: number[] = [];

const checkRateLimit = () => {
  const now = Date.now();
  // Remove timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW) {
    requestTimestamps.shift();
  }
  
  // Check if we've exceeded the limit
  if (requestTimestamps.length >= MAX_REQUESTS) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  // Add current timestamp
  requestTimestamps.push(now);
};

// Input sanitization to prevent XSS
const sanitizeInput = (input: string): string => {
  // For login credentials, we don't want to convert to HTML entities
  // Just strip any HTML tags if they exist
  return input.replace(/<[^>]*>/g, '');
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

// Simple in-memory cache
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  apiCache.delete(key);
  return null;
};

const setCachedData = (key: string, data: any) => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

const clearCache = (pattern: string) => {
  const keys = Array.from(apiCache.keys());
  console.log(`Clearing cache with pattern: ${pattern}`);
  console.log(`Current cache keys:`, keys);
  const matchingKeys = keys.filter(key => key.includes(pattern));
  console.log(`Matching keys to clear:`, matchingKeys);
  matchingKeys.forEach(key => apiCache.delete(key));
  console.log(`Cache cleared. Remaining keys:`, Array.from(apiCache.keys()));
};

// Create headers with authentication
const getHeaders = (contentType: string = 'application/json') => {
  // Check rate limit before each request
  checkRateLimit();
  
  const headers: Record<string, string> = {
    'Content-Type': contentType,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Ensure organizationId is a valid number before adding to headers
  if (organizationId && !isNaN(organizationId)) {
    headers['x-organization-id'] = organizationId.toString();
  }
  
  return headers;
};

// OSGB self-registration
export const registerOrganization = async (orgData: {
  organizationName: string;
  adminUsername: string;
  adminPassword: string;
  adminFullName: string;
  adminEmail?: string;
}) => {
  // Sanitize inputs
  const sanitizedData = sanitizeObject(orgData);
  
  const response = await fetch(`${API_BASE_URL}/auth/register-organization`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Organization registration failed');
  }
  
  const data = await response.json();
  
  // Set auth token if provided
  if (data.token) {
    setAuthToken(data.token);
  }
  
  // Set organization ID if provided
  if (data.user?.organizationId) {
    setOrganizationId(data.user.organizationId);
  }
  
  return data;
};

// System configuration
export const getAllSystemConfig = async () => {
  const cacheKey = 'system_config';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/system-config`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch system configuration');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const getSystemConfigByKey = async (key: string) => {
  const cacheKey = `system_config_${key}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/system-config/${key}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch system configuration');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const upsertSystemConfig = async (config: { key: string; value: string; description?: string }) => {
  // Sanitize inputs
  const sanitizedConfig = sanitizeObject(config);
  
  const response = await fetch(`${API_BASE_URL}/system-config`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedConfig),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update system configuration');
  }
  
  const data = await response.json();
  
  // Clear cache for system config
  clearCache('system_config');
  clearCache(`system_config_${config.key}`);
  
  return data;
};

export const deleteSystemConfig = async (key: string) => {
  const response = await fetch(`${API_BASE_URL}/system-config/${key}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete system configuration');
  }
  
  // Clear cache for system config
  clearCache('system_config');
  clearCache(`system_config_${key}`);
  
  return true;
};

// User authentication
export const login = async (username: string, password: string) => {
  // Sanitize inputs
  const sanitizedUsername = sanitizeInput(username);
  const sanitizedPassword = sanitizeInput(password);
  
  // Debug logging
  console.log('Attempting login with:', { username: sanitizedUsername, password: sanitizedPassword });
  
  // Create the request body
  const requestBody = { username: sanitizedUsername, password: sanitizedPassword };
  console.log('Request body:', requestBody);
  console.log('Stringified request body:', JSON.stringify(requestBody));
  
  const loginUrl = `${API_BASE_URL}/auth/login`;
  console.log('Login URL:', loginUrl);
  
  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(requestBody),
  });
  
  console.log('Login response status:', response.status);
  // Convert headers to array for logging
  const headersArray: [string, string][] = [];
  response.headers.forEach((value: string, key: string) => {
    headersArray.push([key, value]);
  });
  console.log('Login response headers:', headersArray);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Login error data:', errorData);
    throw new Error(errorData.message || 'Login failed');
  }
  
  const data = await response.json();
  console.log('Login success data:', data);
  
  // Set auth token if provided
  if (data.token) {
    setAuthToken(data.token);
  }
  
  // Set organization ID if provided
  if (data.user?.organizationId) {
    setOrganizationId(data.user.organizationId);
  }
  
  return data;
};

export const register = async (userData: { username: string; password: string; fullName: string }) => {
  // Sanitize inputs
  const sanitizedData = sanitizeObject(userData);
  
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Registration failed');
  }
  
  const data = await response.json();
  
  // Set auth token if provided
  if (data.token) {
    setAuthToken(data.token);
  }
  
  // Set organization ID if provided
  if (data.user?.organizationId) {
    setOrganizationId(data.user.organizationId);
  }
  
  return data;
};

// Get current user profile
export const getCurrentUser = async () => {
  const cacheKey = 'current_user';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch user profile');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Update user profile
export const updateUserProfile = async (userData: Partial<{ fullName: string; email: string }>) => {
  // Sanitize inputs
  const sanitizedData = sanitizeObject(userData);
  
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedData),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update user profile');
  }
  
  const data = await response.json();
  clearCache('current_user');
  return data;
};

// Set authentication token
export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

// Set organization ID
export const setOrganizationId = (orgId: number) => {
  organizationId = orgId;
  localStorage.setItem('organizationId', orgId.toString());
};

// Clear authentication
export const clearAuth = () => {
  authToken = null;
  organizationId = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('organizationId');
};

// Workplaces
export const getAllWorkplaces = async () => {
  const cacheKey = 'workplaces';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Log debug information
  console.log('=== getAllWorkplaces Debug Info ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('authToken:', authToken);
  console.log('organizationId:', organizationId);
  console.log('headers:', getHeaders());
  
  const response = await fetch(`${API_BASE_URL}/workplaces`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  console.log('Workplaces response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Workplaces error data:', errorData);
    const errorMessage = errorData.message || `Failed to fetch workplaces: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log('Workplaces data:', data);
  setCachedData(cacheKey, data);
  return data;
};

export const getWorkplaceById = async (id: number) => {
  const cacheKey = `workplace_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/workplaces/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch workplace');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const createWorkplace = async (workplace: any) => {
  console.log('=== Creating workplace ===');
  console.log('Workplace data being sent:', workplace);
  console.log('Stringified workplace data:', JSON.stringify(workplace, null, 2));
  
  // Don't sanitize workplace data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/workplaces`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(workplace),
  });
  
  console.log('Workplace creation response status:', response.status);
  // Convert headers to array for logging
  const headersArray: [string, string][] = [];
  response.headers.forEach((value: string, key: string) => {
    headersArray.push([key, value]);
  });
  console.log('Workplace creation response headers:', headersArray);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Workplace creation error data:', errorData);
    throw new Error(errorData.message || 'Failed to create workplace');
  }
  
  const data = await response.json();
  console.log('Workplace creation success data:', data);
  
  // Clear cache for workplaces
  clearCache('workplaces');
  
  // Clear cache for personnel as their used minutes might have changed
  clearCache('experts');
  clearCache('doctors');
  clearCache('dsps');
  
  return data;
};

export const updateWorkplace = async (id: number, workplace: any) => {
  console.log('=== Updating workplace ===');
  console.log('Workplace ID:', id);
  console.log('Workplace data being sent:', workplace);
  console.log('Stringified workplace data:', JSON.stringify(workplace, null, 2));
  
  // Don't sanitize workplace data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/workplaces/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(workplace),
  });
  
  console.log('Workplace update response status:', response.status);
  // Convert headers to array for logging
  const headersArray: [string, string][] = [];
  response.headers.forEach((value: string, key: string) => {
    headersArray.push([key, value]);
  });
  console.log('Workplace update response headers:', headersArray);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Workplace update error data:', errorData);
    throw new Error(errorData.message || 'Failed to update workplace');
  }
  
  const data = await response.json();
  console.log('Workplace update success data:', data);
  
  // Clear cache for this workplace and all workplaces
  clearCache(`workplace_${id}`);
  clearCache('workplaces');
  
  // Clear cache for personnel as their used minutes might have changed
  clearCache('experts');
  clearCache('doctors');
  clearCache('dsps');
  
  return data;
};

export const deleteWorkplace = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/workplaces/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete workplace');
  }
  
  // Clear cache for this workplace and all workplaces
  clearCache(`workplace_${id}`);
  clearCache('workplaces');
  
  // Clear cache for personnel as their used minutes might have changed
  clearCache('experts');
  clearCache('doctors');
  clearCache('dsps');
  
  return true;
};

// Get available experts for a workplace based on risk level and employee count
export const getAvailableExperts = async (workplaceId: number) => {
  const cacheKey = `available_experts_${workplaceId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/workplaces/${workplaceId}/available-experts`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Failed to fetch available experts: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Get available doctors for a workplace based on risk level and employee count
export const getAvailableDoctors = async (workplaceId: number) => {
  const cacheKey = `available_doctors_${workplaceId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/workplaces/${workplaceId}/available-doctors`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Failed to fetch available doctors: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Get available DSPs for a workplace based on risk level and employee count
export const getAvailableDsps = async (workplaceId: number) => {
  const cacheKey = `available_dsps_${workplaceId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/workplaces/${workplaceId}/available-dsps`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `Failed to fetch available DSPs: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Experts
export const getAllExperts = async () => {
  const cacheKey = 'experts';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Log debug information
  console.log('=== getAllExperts Debug Info ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('authToken:', authToken);
  console.log('organizationId:', organizationId);
  console.log('headers:', getHeaders());
  
  const response = await fetch(`${API_BASE_URL}/experts`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  console.log('Experts response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Experts error data:', errorData);
    const errorMessage = errorData.message || `Failed to fetch experts: ${response.status} ${response.statusText}`;
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  console.log('Experts data:', data);
  setCachedData(cacheKey, data);
  return data;
};

export const getExpertById = async (id: number) => {
  const cacheKey = `expert_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/experts/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch expert');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const createExpert = async (expert: any) => {
  // Don't sanitize expert data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/experts`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(expert),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create expert');
  }
  
  const data = await response.json();
  
  // Clear cache for experts
  clearCache('experts');
  
  return data;
};

export const updateExpert = async (id: number, expert: any) => {
  // Don't sanitize expert data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/experts/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(expert),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update expert');
  }
  
  const data = await response.json();
  
  // Clear cache for this expert and all experts
  clearCache(`expert_${id}`);
  clearCache('experts');
  
  return data;
};

export const deleteExpert = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/experts/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete expert');
  }
  
  // Clear cache for this expert and all experts
  clearCache(`expert_${id}`);
  clearCache('experts');
  
  return true;
};

// Get assigned workplaces for an expert
export const getExpertAssignedWorkplaces = async (expertId: number) => {
  const cacheKey = `expert_assigned_workplaces_${expertId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/experts/${expertId}/assigned-workplaces`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch assigned workplaces for expert');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Get assigned workplaces for a doctor
export const getDoctorAssignedWorkplaces = async (doctorId: number) => {
  const cacheKey = `doctor_assigned_workplaces_${doctorId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/doctors/${doctorId}/assigned-workplaces`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch assigned workplaces for doctor');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Get assigned workplaces for a DSP
export const getDspAssignedWorkplaces = async (dspId: number) => {
  const cacheKey = `dsp_assigned_workplaces_${dspId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/dsps/${dspId}/assigned-workplaces`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch assigned workplaces for DSP');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Doctors
export const getAllDoctors = async () => {
  const cacheKey = 'doctors';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Log debug information
  console.log('=== getAllDoctors Debug Info ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('authToken:', authToken);
  console.log('organizationId:', organizationId);
  console.log('headers:', getHeaders());
  
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  console.log('Doctors response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Doctors error data:', errorData);
    throw new Error(errorData.message || 'Failed to fetch doctors');
  }
  
  const data = await response.json();
  console.log('getAllDoctors response:', data);
  setCachedData(cacheKey, data);
  return data;
};

export const getDoctorById = async (id: number) => {
  const cacheKey = `doctor_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch doctor');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const createDoctor = async (doctor: any) => {
  // Don't sanitize doctor data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/doctors`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(doctor),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create doctor');
  }
  
  const data = await response.json();
  
  // Clear cache for doctors
  clearCache('doctors');
  
  return data;
};

export const updateDoctor = async (id: number, doctor: any) => {
  // Don't sanitize doctor data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(doctor),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update doctor');
  }
  
  const data = await response.json();
  
  // Clear cache for this doctor and all doctors
  clearCache(`doctor_${id}`);
  clearCache('doctors');
  
  return data;
};

export const deleteDoctor = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete doctor');
  }
  
  // Clear cache for this doctor and all doctors
  clearCache(`doctor_${id}`);
  clearCache('doctors');
  
  return true;
};

// DSPs
export const getAllDsps = async () => {
  const cacheKey = 'dsps';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Log debug information
  console.log('=== getAllDsps Debug Info ===');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('authToken:', authToken);
  console.log('organizationId:', organizationId);
  console.log('headers:', getHeaders());
  
  const response = await fetch(`${API_BASE_URL}/dsps`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  console.log('DSPs response status:', response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('DSPs error data:', errorData);
    throw new Error(errorData.message || 'Failed to fetch DSPs');
  }
  
  const data = await response.json();
  console.log('DSPs data:', data);
  setCachedData(cacheKey, data);
  return data;
};

export const getDspById = async (id: number) => {
  const cacheKey = `dsp_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/dsps/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch DSP');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const createDsp = async (dsp: any) => {
  // Don't sanitize DSP data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/dsps`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dsp),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create DSP');
  }
  
  const data = await response.json();
  
  // Clear cache for DSPs
  clearCache('dsps');
  
  return data;
};

export const updateDsp = async (id: number, dsp: any) => {
  // Don't sanitize DSP data as it can break JSON structure
  const response = await fetch(`${API_BASE_URL}/dsps/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(dsp),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update DSP');
  }
  
  const data = await response.json();
  
  // Clear cache for this DSP and all DSPs
  clearCache(`dsp_${id}`);
  clearCache('dsps');
  
  return data;
};

export const deleteDsp = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/dsps/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete DSP');
  }
  
  // Clear cache for this DSP and all DSPs
  clearCache(`dsp_${id}`);
  clearCache('dsps');
  
  return true;
};

// Visits
export const getAllVisits = async () => {
  const cacheKey = 'visits';
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/visits`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch visits');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const getVisitById = async (id: number) => {
  const cacheKey = `visit_${id}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/visits/${id}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch visit');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

export const createVisit = async (visit: any) => {
  // Sanitize inputs
  const sanitizedVisit = sanitizeObject(visit);
  
  const response = await fetch(`${API_BASE_URL}/visits`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedVisit),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create visit');
  }
  
  const data = await response.json();
  
  // Clear cache for visits
  clearCache('visits');
  
  return data;
};

export const updateVisit = async (id: number, visit: any) => {
  // Sanitize inputs
  const sanitizedVisit = sanitizeObject(visit);
  
  const response = await fetch(`${API_BASE_URL}/visits/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(sanitizedVisit),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update visit');
  }
  
  const data = await response.json();
  
  // Clear cache for this visit and all visits
  clearCache(`visit_${id}`);
  clearCache('visits');
  
  return data;
};

export const deleteVisit = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/visits/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to delete visit');
  }
  
  // Clear cache for this visit and all visits
  clearCache(`visit_${id}`);
  clearCache('visits');
  
  return true;
};

// Get visits for a specific workplace
export const getVisitsForWorkplace = async (workplaceId: number) => {
  const cacheKey = `visits_workplace_${workplaceId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/workplaces/${workplaceId}/visits`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch visits for workplace');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};

// Get visits for a specific expert
export const getVisitsForExpert = async (expertId: number) => {
  const cacheKey = `visits_expert_${expertId}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }
  
  const response = await fetch(`${API_BASE_URL}/experts/${expertId}/visits`, {
    method: 'GET',
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to fetch visits for expert');
  }
  
  const data = await response.json();
  setCachedData(cacheKey, data);
  return data;
};