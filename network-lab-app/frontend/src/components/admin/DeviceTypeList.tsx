import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/adminService';
import { DeviceType } from '../../services/adminService'; // Import the interface

// Props for a potential DeviceTypeForm component (to be created)
interface DeviceTypeFormProps {
  deviceTypeToEdit?: DeviceType | null;
  onFormSubmit: () Greet.tsx in src/components/
 greet_test.tsx in src/components/
> => void; // Callback to refresh list after submit
  onCancel: () => void;
}

// Placeholder for DeviceTypeForm - will be a separate component
const DeviceTypeForm: React.FC<DeviceTypeFormProps> = ({ deviceTypeToEdit, onFormSubmit, onCancel }) => {
  const [name, setName] = useState(deviceTypeToEdit?.name || '');
  const [iconPath, setIconPath] = useState(deviceTypeToEdit?.default_icon_path || '');
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(deviceTypeToEdit?.name || '');
  const [iconPath, setIconPath] = useState(deviceTypeToEdit?.default_icon_path || '');
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deviceTypeToEdit) {
      setName(deviceTypeToEdit.name);
      setIconPath(deviceTypeToEdit.default_icon_path || '');
    } else {
      setName('');
      setIconPath('');
    }
  }, [deviceTypeToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    if (!token) {
      setError("Authentication token not found.");
      setIsSubmitting(false);
      return;
    }
    try {
      const payload: adminService.DeviceTypePayload = { name, default_icon_path: iconPath };
      if (deviceTypeToEdit && deviceTypeToEdit.id) {
        await adminService.updateDeviceType(deviceTypeToEdit.id, payload, token);
      } else {
        await adminService.createDeviceType(payload, token);
      }
      onFormSubmit();
    } catch (err: any) {
      setError(err.message || 'Failed to save device type.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <h4>{deviceTypeToEdit ? 'Edit' : 'Add'} Device Type</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label htmlFor={`dt-name-${deviceTypeToEdit?.id || 'new'}`}>Name:</label>
        <input id={`dt-name-${deviceTypeToEdit?.id || 'new'}`} type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div>
        <label htmlFor={`dt-icon-${deviceTypeToEdit?.id || 'new'}`}>Default Icon Path:</label>
        <input id={`dt-icon-${deviceTypeToEdit?.id || 'new'}`} type="text" value={iconPath || ''} onChange={(e) => setIconPath(e.target.value)} placeholder="e.g., icons/router.svg" disabled={isSubmitting} />
      </div>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (deviceTypeToEdit ? 'Save Changes' : 'Create Device Type')}</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem' }} disabled={isSubmitting}>Cancel</button>
    </form>
  );
};


const DeviceTypeList: React.FC = () => {
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeviceType, setEditingDeviceType] = useState<DeviceType | null>(null);
  const { token } = useAuth();

  const fetchDeviceTypes = useCallback(async () => {
    if (!token) {
      setError("Not authenticated to fetch device types.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await adminService.getDeviceTypes(token);
      setDeviceTypes(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch device types');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDeviceTypes();
  }, [fetchDeviceTypes]);

  const handleFormSubmitted = () => {
    setShowAddForm(false);
    setEditingDeviceType(null);
    fetchDeviceTypes(); // Refresh the list
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingDeviceType(null);
  };

  const handleEditDeviceType = (type: DeviceType) => {
    setEditingDeviceType(type);
    setShowAddForm(true); // Show the form, now populated for editing
  };

  const handleDeleteDeviceType = async (id: number) => {
    if (!token) {
        alert("Not authenticated.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this device type? This might fail if it is in use (e.g., linked to device configurations).')) {
        try {
            await adminService.deleteDeviceType(id, token);
            fetchDeviceTypes(); // Refresh list
            alert('Device type deleted successfully.');
        } catch (err: any) {
            // Check if the error object has a 'msg' property from backend response
            const errorMessage = err?.response?.data?.msg || err.message || 'Failed to delete device type.';
            alert(errorMessage);
            console.error("Delete error:", err.response?.data || err);
        }
    }
  };


  if (isLoading) return <p>Loading device types...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h3>Manage Device Types</h3>
      <button onClick={() => { setEditingDeviceType(null); setShowAddForm(true); }} disabled={showAddForm}>
        Add New Device Type
      </button>

      {(showAddForm || editingDeviceType) && (
        <DeviceTypeForm
          deviceTypeToEdit={editingDeviceType}
          onFormSubmit={handleFormSubmitted}
          onCancel={handleCancelForm}
        />
      )}

      {deviceTypes.length === 0 && !showAddForm && <p>No device types found.</p>}

      <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>ID</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Name</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Icon Path</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deviceTypes.map((type) => (
            <tr key={type.id}>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{type.id}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{type.name}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{type.default_icon_path || 'N/A'}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>
                <button onClick={() => handleEditDeviceType(type)} style={{marginRight: '5px'}}>
                  Edit
                </button>
                <button onClick={() => handleDeleteDeviceType(type.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceTypeList;
