import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Or directly use authService
import * as authService from '../services/authService'; // Using service directly for register
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // const { register } = useAuth(); // useAuth might not have register if it's just for login/logout state
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    try {
      // Using authService directly as useAuth().register might just be a wrapper
      // or might not be implemented if AuthContext is purely for auth state.
      const response = await authService.register(username, password);
      setSuccessMessage(response.msg || 'Registration successful! Please login.');
      // Optionally redirect to login page after a delay or on button click
      // For now, just show success message. User can navigate to login.
      // navigate('/login');
    } catch (err: any) {
      if (err && err.msg) {
        setError(err.msg);
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during registration.');
      }
      console.error('Registration page error:', err);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="register-username">Username:</label>
          <input
            id="register-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-password">Password:</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="register-confirm-password">Confirm Password:</label>
          <input
            id="register-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        <button type="submit">Register</button>
      </form>
      <p>
        Already have an account? <a href="/login">Login here</a>
        {/* Or use Link from react-router-dom: <Link to="/login">Login here</Link> */}
      </p>
    </div>
  );
};

export default RegisterPage;
