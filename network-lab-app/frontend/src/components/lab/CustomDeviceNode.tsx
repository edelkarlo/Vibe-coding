import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Assuming DeviceNodeData is defined similarly in LabEditorPage or a shared types file
interface DeviceNodeData {
  label: string;
  iconPath?: string;
  // Any other data your node needs
}

const CustomDeviceNode: React.FC<NodeProps<DeviceNodeData>> = ({ data, isConnectable }) => {
  return (
    <div style={{
      border: '1px solid #777',
      padding: '10px',
      borderRadius: '5px',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minWidth: '100px', // Ensure some minimum width
    }}>
      {/* Connection Handle at the Top */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />

      {/* Icon */}
      {data.iconPath && (
        <img
          src={data.iconPath}
          alt={data.label}
          style={{ width: '40px', height: '40px', marginBottom: '5px' }}
          onError={(e) => { e.currentTarget.src = '/icons/placeholder.svg'; }}
        />
      )}
      {!data.iconPath && (
        <img
            src="/icons/placeholder.svg"
            alt="placeholder icon"
            style={{ width: '40px', height: '40px', marginBottom: '5px' }}
        />
      )}

      {/* Label */}
      <div style={{ textAlign: 'center', fontSize: '12px' }}>
        {data.label}
      </div>

      {/* Connection Handle at the Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555' }}
      />
      {/* You can add more handles (Left, Right) as needed */}
      <Handle
        type="source" // Or target, or both (source and target on same handle)
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={{ background: '#555', top: '50%' }}
      />
      <Handle
        type="source" // Or target
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={{ background: '#555', top: '50%' }}
      />
    </div>
  );
};

export default memo(CustomDeviceNode); // memo helps performance by only re-rendering if props change
