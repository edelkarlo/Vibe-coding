import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // For redirection after login

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    try {
      await login(username, password);
      navigate('/'); // Redirect to homepage or dashboard after successful login
    } catch (err: any) {
      // err might be an Axios error containing response.data or a generic error
      if (err && err.msg) {
        setError(err.msg); // Display error message from backend
      } else if (err && err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during login.');
      }
      console.error('Login page error:', err);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="login-username">Username:</label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="login-password">Password:</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Login</button>
      </form>
      {/* Optional: Link to registration page */}
      <p>
        Don't have an account? <a href="/register">Register here</a>
        {/* Or use Link from react-router-dom: <Link to="/register">Register here</Link> */}
      </p>
    </div>
  );
};

export default LoginPage;
