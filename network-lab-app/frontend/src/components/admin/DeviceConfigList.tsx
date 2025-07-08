import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/adminService';
import { DeviceConfig, DeviceType, DeviceConfigPayload } from '../../services/adminService';

interface DeviceConfigFormProps {
  deviceConfigToEdit?: DeviceConfig | null;
  deviceTypes: DeviceType[]; // Needed for the type dropdown
  onFormSubmit: () => void;
  onCancel: () => void;
}

const DeviceConfigForm: React.FC<DeviceConfigFormProps> = ({ deviceConfigToEdit, deviceTypes, onFormSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState<number | string>(''); // string for initial empty select option
  const [hostnameIp, setHostnameIp] = useState('');
  const [defaultIconPath, setDefaultIconPath] = useState('');
  const [notes, setNotes] = useState('');

  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deviceConfigToEdit) {
      setName(deviceConfigToEdit.name);
      setDeviceTypeId(deviceConfigToEdit.device_type_id);
      setHostnameIp(deviceConfigToEdit.hostname_ip);
      setDefaultIconPath(deviceConfigToEdit.default_icon_path || '');
      setNotes(deviceConfigToEdit.notes || '');
    } else {
      // Reset form for new entry
      setName('');
      setDeviceTypeId(''); // Important to reset for placeholder
      setHostnameIp('');
      setDefaultIconPath('');
      setNotes('');
    }
  }, [deviceConfigToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!token) {
      setError("Authentication token not found.");
      setIsSubmitting(false);
      return;
    }
    if (!deviceTypeId) {
        setError("Please select a device type.");
        setIsSubmitting(false);
        return;
    }

    const payload: DeviceConfigPayload = {
      name,
      device_type_id: Number(deviceTypeId),
      hostname_ip: hostnameIp,
      default_icon_path: defaultIconPath || null, // Send null if empty
      notes: notes || null, // Send null if empty
    };

    try {
      if (deviceConfigToEdit && deviceConfigToEdit.id) {
        await adminService.updateDeviceConfig(deviceConfigToEdit.id, payload, token);
      } else {
        await adminService.createDeviceConfig(payload, token);
      }
      onFormSubmit();
    } catch (err: any) {
      setError(err?.response?.data?.msg || err.message || 'Failed to save device configuration.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
      <h4>{deviceConfigToEdit ? 'Edit' : 'Add'} Device Configuration</h4>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div>
        <label>Name:</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div>
        <label>Device Type:</label>
        <select value={deviceTypeId} onChange={(e) => setDeviceTypeId(e.target.value)} required disabled={isSubmitting}>
          <option value="" disabled>Select a type</option>
          {deviceTypes.map(dt => (
            <option key={dt.id} value={dt.id}>{dt.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Hostname/IP:</label>
        <input type="text" value={hostnameIp} onChange={(e) => setHostnameIp(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div>
        <label>Custom Icon Path (optional):</label>
        <input type="text" value={defaultIconPath} onChange={(e) => setDefaultIconPath(e.target.value)} placeholder="e.g., icons/my-custom-router.svg" disabled={isSubmitting} />
      </div>
      <div>
        <label>Notes (optional):</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isSubmitting} />
      </div>
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : (deviceConfigToEdit ? 'Save Changes' : 'Create Device Config')}</button>
      <button type="button" onClick={onCancel} style={{ marginLeft: '0.5rem' }} disabled={isSubmitting}>Cancel</button>
    </form>
  );
};


const DeviceConfigList: React.FC = () => {
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfig[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]); // For the form's dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDeviceConfig, setEditingDeviceConfig] = useState<DeviceConfig | null>(null);
  const { token } = useAuth();

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Not authenticated.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [configsData, typesData] = await Promise.all([
        adminService.getDeviceConfigs(token),
        adminService.getDeviceTypes(token) // Fetch types for the form
      ]);
      setDeviceConfigs(configsData);
      setDeviceTypes(typesData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSubmitted = () => {
    setShowAddForm(false);
    setEditingDeviceConfig(null);
    fetchData(); // Refresh the list
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingDeviceConfig(null);
  };

  const handleEditDeviceConfig = (config: DeviceConfig) => {
    setEditingDeviceConfig(config);
    setShowAddForm(true);
  };

  const handleDeleteDeviceConfig = async (id: number) => {
    if (!token) {
      alert("Not authenticated.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this device configuration? This might fail if it is in use.')) {
      try {
        await adminService.deleteDeviceConfig(id, token);
        fetchData(); // Refresh list
        alert('Device configuration deleted successfully.');
      } catch (err: any) {
        const errorMessage = err?.response?.data?.msg || err.message || 'Failed to delete device configuration.';
        alert(errorMessage);
        console.error("Delete error:", err.response?.data || err);
      }
    }
  };

  if (isLoading) return <p>Loading device configurations...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div>
      <h3>Manage Device Configurations</h3>
      <button onClick={() => { setEditingDeviceConfig(null); setShowAddForm(true); }} disabled={showAddForm || deviceTypes.length === 0}>
        Add New Device Config
      </button>
      {deviceTypes.length === 0 && <p style={{color: 'orange'}}>Please add Device Types before adding configurations.</p>}


      {(showAddForm || editingDeviceConfig) && deviceTypes.length > 0 && (
        <DeviceConfigForm
          deviceConfigToEdit={editingDeviceConfig}
          deviceTypes={deviceTypes}
          onFormSubmit={handleFormSubmitted}
          onCancel={handleCancelForm}
        />
      )}

      {deviceConfigs.length === 0 && !showAddForm && <p>No device configurations found.</p>}

      <table style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>ID</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Name</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Type</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Hostname/IP</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Notes</th>
            <th style={{border: '1px solid #ddd', padding: '8px', textAlign: 'left'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deviceConfigs.map((config) => (
            <tr key={config.id}>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{config.id}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{config.name}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{config.device_type_name || config.device_type_id}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{config.hostname_ip}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>{config.notes || 'N/A'}</td>
              <td style={{border: '1px solid #ddd', padding: '8px'}}>
                <button onClick={() => handleEditDeviceConfig(config)} style={{marginRight: '5px'}}>
                  Edit
                </button>
                <button onClick={() => handleDeleteDeviceConfig(config.id)}>
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

export default DeviceConfigList;
