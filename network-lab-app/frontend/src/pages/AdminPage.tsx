import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const AdminPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.is_admin) {
    return (
      <div>
        <h1>Admin Page</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

import DeviceTypeList from '../components/admin/DeviceTypeList';
import DeviceConfigList from '../components/admin/DeviceConfigList';

const AdminPage: React.FC = () => {
  const { user } = useAuth();

  if (!user?.is_admin) {
    return (
      <div>
        <h1>Admin Page</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Admin - Device Management</h1>
      <p>Welcome, {user.username}. This is where you can manage device types and configurations.</p>

      <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <DeviceTypeList />
      </section>

      <hr />

      <section style={{ marginTop: '2rem' }}>
         <DeviceConfigList />
      </section>
    </div>
  );
};

export default AdminPage;
