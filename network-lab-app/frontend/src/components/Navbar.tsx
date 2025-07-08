import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout(); // AuthContext logout handles both client state and optional backend call
      navigate('/login'); // Redirect to login after logout
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle error display if needed
    }
  };

  return (
    <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Link to="/" style={{ marginRight: '1rem', fontWeight: 'bold' }}>Network Lab</Link>
        {isAuthenticated && (
          <Link to="/lab/editor" style={{ marginRight: '1rem' }}>Lab Editor</Link>
        )}
      </div>
      <div>
        {isAuthenticated ? (
          <>
            {user?.is_admin && <Link to="/admin" style={{ marginRight: '1rem' }}>(Admin Panel)</Link>}
            <span style={{ marginRight: '1rem' }}>Hi, {user?.username}!</span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
      <div style={{clear: 'both'}}></div>
    </nav>
  );
};

export default Navbar;
