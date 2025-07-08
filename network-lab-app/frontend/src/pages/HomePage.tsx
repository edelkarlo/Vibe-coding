import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div>
      <h1>Welcome to the Network Lab</h1>
      {isAuthenticated ? (
        <p>Hello, {user?.username}! You are logged in.</p>
      ) : (
        <p>Please login or register to continue.</p>
      )}
      <p>
        This is the main application area. The GNS3-like interface with device icons
        will be developed here.
      </p>
      {/* Placeholder for the main lab canvas component */}
      {/* <LabCanvas /> */}
    </div>
  );
};

export default HomePage;
