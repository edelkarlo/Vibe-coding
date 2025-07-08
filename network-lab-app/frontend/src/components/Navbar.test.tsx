import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom'; // Needed for <Link>
import { AuthContext, AuthContextType } from '../contexts/AuthContext'; // Adjust path if needed
import Navbar from './Navbar'; // Adjust path if needed
import '@testing-library/jest-dom'; // For extended matchers like .toBeInTheDocument()

// Mock react-router-dom's useNavigate
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  useNavigate: () => mockedNavigate, // overwrite useNavigate
}));

// Helper function to render Navbar with a mock AuthContext value
const renderNavbar = (authContextValue: Partial<AuthContextType>) => {
  const defaultAuthContextValue: AuthContextType = {
    user: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    login: jest.fn().mockResolvedValue(undefined),
    register: jest.fn().mockResolvedValue(undefined),
    logout: jest.fn().mockResolvedValue(undefined),
    ...authContextValue, // Override defaults with provided values
  };

  return render(
    <Router> {/* Link components need to be wrapped in a Router */}
      <AuthContext.Provider value={defaultAuthContextValue}>
        <Navbar />
      </AuthContext.Provider>
    </Router>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockedNavigate.mockClear();
    // jest.clearAllMocks(); // If other mocks from jest.fn() were used in authContextValue directly
  });

  test('renders Login and Register links when user is not authenticated', () => {
    renderNavbar({ isAuthenticated: false, user: null });
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('renders user information and Logout button when user is authenticated', () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    renderNavbar({ isAuthenticated: true, user: mockUser });

    expect(screen.getByText(`Hi, ${mockUser.username}!`)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.queryByText('(Admin Panel)')).not.toBeInTheDocument(); // Regular user
  });

  test('renders Admin Panel link for admin users', () => {
    const mockAdminUser = { id: 2, username: 'adminuser', is_admin: true };
    renderNavbar({ isAuthenticated: true, user: mockAdminUser });

    expect(screen.getByText(`Hi, ${mockAdminUser.username}!`)).toBeInTheDocument();
    expect(screen.getByText('(Admin Panel)')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('calls logout and navigates to /login on logout button click', async () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    const logoutMock = jest.fn().mockResolvedValue(undefined);
    renderNavbar({ isAuthenticated: true, user: mockUser, logout: logoutMock });

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(logoutMock).toHaveBeenCalledTimes(1);
    // Wait for potential async operations in logout if any, though here it's direct
    // For example, if logout had an await authService.logoutBackend()
    // await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith('/login'));
    expect(mockedNavigate).toHaveBeenCalledWith('/login'); // Check navigation
  });

  test('renders Lab Editor link when authenticated', () => {
    const mockUser = { id: 1, username: 'testuser', is_admin: false };
    renderNavbar({ isAuthenticated: true, user: mockUser });
    expect(screen.getByText('Lab Editor')).toBeInTheDocument();
  });

  test('does not render Lab Editor link when not authenticated', () => {
    renderNavbar({ isAuthenticated: false, user: null });
    expect(screen.queryByText('Lab Editor')).not.toBeInTheDocument();
  });
});
