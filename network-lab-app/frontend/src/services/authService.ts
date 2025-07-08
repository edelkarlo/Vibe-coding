import axios from 'axios';

// Define the base URL for the backend API.
// In a real app, this would come from an environment variable.
// For development, if frontend is on 3000 and backend on 5001,
// you'll need to configure proxy in vite.config.ts or use full URLs.
const API_BASE_URL = 'http://localhost:5001/api/auth'; // Adjust if your backend port is different

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

interface LoginResponse {
  access_token: string;
  user: User;
  // refresh_token?: string; // Optional
}

interface RegisterResponse {
  msg: string;
  user?: User; // Optional, depending on your backend response for registration
}

// Function to handle login
export const login = async (username: string, password_string: string): Promise<LoginResponse> => {
  try {
    const response = await axios.post<LoginResponse>(`${API_BASE_URL}/login`, {
      username,
      password: password_string, // Ensure key matches backend expectation
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data; // Throw backend error message if available
    }
    throw error; // Throw generic error
  }
};

// Function to handle registration
export const register = async (username: string, password_string: string): Promise<RegisterResponse> => {
  try {
    const response = await axios.post<RegisterResponse>(`${API_BASE_URL}/register`, {
      username,
      password: password_string, // Ensure key matches backend expectation
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

// Function to fetch current user details (me endpoint)
export const getMe = async (token: string): Promise<User> => {
  try {
    const response = await axios.get<User>(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

// Function to handle logout (if backend has a logout endpoint for token invalidation)
export const logout = async (token: string): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/logout`, {}, { // Empty body for logout
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    // It's often fine to ignore backend logout errors, as client-side token removal is the main part.
    console.warn('Backend logout call failed or not implemented:', error);
    // Do not re-throw typically, as client state is cleared anyway.
  }
};
