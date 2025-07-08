import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService'; // We'll create this next

interface User {
  id: number;
  username: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean; // Added for convenience
  login: (username: string, password_string: string) => Promise<void>;
  register: (username: string, password_string: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('authToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true); // For initial auth check

  useEffect(() => {
    const verifyTokenAndFetchUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          // Attempt to fetch user details using the stored token
          // This validates the token and gets up-to-date user info
          const currentUser = await authService.getMe(storedToken); // Pass token to getMe
          setUser(currentUser);
          setToken(storedToken);
        } catch (error) {
          console.error('Stored token is invalid or expired:', error);
          localStorage.removeItem('authToken');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    verifyTokenAndFetchUser();
  }, []);

  const login = async (username: string, password_string: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(username, password_string);
      localStorage.setItem('authToken', response.access_token);
      setToken(response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      localStorage.removeItem('authToken'); // Clean up on failure
      setToken(null);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, password_string: string) => {
    setIsLoading(true);
    try {
      await authService.register(username, password_string);
      // After successful registration, user typically needs to login separately.
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const currentToken = token; // Get token before clearing
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    if (currentToken) {
      try {
        await authService.logout(currentToken); // Call backend logout if it exists
      } catch (error) {
        console.error('Backend logout failed, or no backend logout endpoint:', error);
        // Even if backend logout fails, client-side state is cleared.
      }
    }
    setIsLoading(false);
  };

  const isAuthenticated = !!token && !!user;


  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, register, logout }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
