import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/adminService';
import { DeviceConfig } from '../../services/adminService';

const DevicePalette: React.FC = () => {
  const [deviceConfigs, setDeviceConfigs] = useState<DeviceConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchDeviceConfigs = useCallback(async () => {
    if (!token) {
      setError("Not authenticated to fetch device configurations.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await adminService.getDeviceConfigs(token);
      setDeviceConfigs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch device configurations');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDeviceConfigs();
  }, [fetchDeviceConfigs]);

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, deviceConfig: DeviceConfig) => {
    // Store the type of node and its data to be used on drop
    event.dataTransfer.setData('application/reactflow-nodetype', 'deviceNode'); // Generic type or specific
    event.dataTransfer.setData('application/json-deviceconfig', JSON.stringify(deviceConfig));
    event.dataTransfer.effectAllowed = 'move';
  };

  if (isLoading) return <div style={paletteStyle}><p>Loading devices...</p></div>;
  if (error) return <div style={paletteStyle}><p style={{ color: 'red' }}>Error: {error}</p></div>;
  if (!token) return <div style={paletteStyle}><p>Please login to see devices.</p></div>;


  return (
    <aside style={paletteStyle}>
      <h4>Device Palette</h4>
      {deviceConfigs.length === 0 && <p>No devices configured. Go to Admin page to add them.</p>}
      {deviceConfigs.map((config) => (
        <div
          key={config.id}
          onDragStart={(event) => onDragStart(event, config)}
          draggable
          style={draggableItemStyle}
        >
          {/* Basic representation: Icon (if available) and Name */}
          {config.default_icon_path && (
            <img
              src={config.default_icon_path}
              alt={config.name}
              style={{ width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle' }}
              onError={(e) => {
                // Fallback if image fails to load (e.g. path is wrong or icon missing)
                // e.currentTarget.style.display = 'none'; // Hide broken image
                // Or show a placeholder
                e.currentTarget.src = '/icons/placeholder.svg'; // Make sure you have a placeholder
              }}
            />
          )}
          {!config.default_icon_path && (
             <img src="/icons/placeholder.svg" alt="device icon" style={{ width: '24px', height: '24px', marginRight: '8px', verticalAlign: 'middle' }} />
          )}
          <span style={{verticalAlign: 'middle'}}>{config.name} ({config.device_type_name})</span>
        </div>
      ))}
    </aside>
  );
};

// Basic styles (can be moved to a CSS file)
const paletteStyle: React.CSSProperties = {
  width: '250px',
  padding: '10px',
  borderRight: '1px solid #ccc',
  backgroundColor: '#f9f9f9',
  overflowY: 'auto',
};

const draggableItemStyle: React.CSSProperties = {
  padding: '8px',
  marginBottom: '8px',
  border: '1px solid #eee',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'grab',
  display: 'flex',
  alignItems: 'center',
};

export default DevicePalette;
