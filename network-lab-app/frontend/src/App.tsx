import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import LabEditorPage from './pages/LabEditorPage'; // Import the new Lab Editor Page

// A wrapper for routes that require authentication
const ProtectedRoute: React.FC<{ children: JSX.Element, adminOnly?: boolean }> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication status...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to so we can send them along after they login.
    // For simplicity, just redirecting. State can be used to store original target.
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user?.is_admin) {
    // If it's an admin-only route and user is not admin
    return <Navigate to="/" replace />; // Or to an "Unauthorized" page
  }

  return children;
};


function AppContent() {
  // This component can be useful if you need to access auth context for layout decisions
  // not directly tied to Navbar or specific routes, but for now, it's a good structure.
  return (
    <>
      <Navbar />
      <div style={{ padding: '1rem' }}> {/* Basic app padding */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab/editor" // Or just /lab if it's the main lab creation/editing area
            element={
              <ProtectedRoute>
                <LabEditorPage />
              </ProtectedRoute>
            }
          />

          {/* Add more routes here as needed */}
          {/* <Route path="/lab/:topologyId" element={<ProtectedRoute><LabInstancePage /></ProtectedRoute>} /> */}

          {/* A catch-all route to redirect to home for any undefined paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
