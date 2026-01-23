// API Base URL
export const API_BASE_URL = 'http://localhost:5000/api';

// User endpoints
export const USER_ENDPOINTS = {
  CREATE_USER: `${API_BASE_URL}/users`,
  GET_ALL_USERS: `${API_BASE_URL}/users`,
  GET_USER: (id) => `${API_BASE_URL}/users/${id}`,
  UPDATE_USER: (id) => `${API_BASE_URL}/users/${id}`,
  DELETE_USER: (id) => `${API_BASE_URL}/users/${id}`,
};