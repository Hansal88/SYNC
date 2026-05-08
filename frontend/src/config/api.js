const BACKEND_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://sync-4ges.onrender.com';
export const API_BASE_URL = 'https://sync-4ges.onrender.com/api';
export const BACKEND_URL = 'https://sync-4ges.onrender.com';

// User endpoints
export const USER_ENDPOINTS = {
  CREATE_USER: `${API_BASE_URL}/users`,
  GET_ALL_USERS: `${API_BASE_URL}/users`,
  GET_USER: (id) => `${API_BASE_URL}/users/${id}`,
  UPDATE_USER: (id) => `${API_BASE_URL}/users/${id}`,
  DELETE_USER: (id) => `${API_BASE_URL}/users/${id}`,
};
