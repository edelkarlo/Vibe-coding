import axios from 'axios';

const API_LAB_BASE_URL = '/api/lab'; // Proxied path

// Interfaces based on React Flow's structure and our backend expectations
// Ensure these align with Node<DeviceNodeData> and Edge types in LabEditorPage
// and how the backend expects to receive/send them.

export interface DeviceNodeData {
  label: string;
  deviceConfigId: number;
  hostnameIp?: string;
  iconPath?: string;
}

export interface NodeModel { // Simplified for backend, ReactFlow Node is more complex
  id: string; // Keep React Flow's ID for mapping if needed, or backend generates its own
  device_config_id: number; // Reference to DeviceConfig
  instance_name?: string; // Optional override name for this instance
  canvas_x: number;
  canvas_y: number;
}

export interface EdgeModel { // Simplified for backend
  id: string; // React Flow edge ID
  source_instance_id: string; // Refers to NodeModel.id (which is ReactFlow node ID)
  target_instance_id: string; // Refers to NodeModel.id
  // Add other edge properties if needed, e.g., type, animated
}

export interface LabTopologyData {
  id: number;
  name: string;
  description?: string | null;
  devices: NodeModel[]; // Array of device instances in the topology
  connections: EdgeModel[]; // Array of connections
  // created_at, updated_at from backend are also useful
}

export interface LabTopologySummary {
    id: number;
    name: string;
    description?: string | null;
    created_at: string;
    updated_at: string;
}


// --- LabTopology API Calls ---

export const getLabTopologies = async (token: string): Promise<LabTopologySummary[]> => {
  const response = await axios.get<LabTopologySummary[]>(`${API_LAB_BASE_URL}/topologies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createLabTopology = async (payload: { name: string; description?: string }, token: string): Promise<LabTopologySummary> => {
  const response = await axios.post<LabTopologySummary>(`${API_LAB_BASE_URL}/topologies`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getLabTopologyDetail = async (topologyId: number, token: string): Promise<LabTopologyData> => {
  // The backend for GET /topologies/<id> needs to return data that can be mapped back to React Flow nodes/edges.
  // Backend's LabDeviceInstance and LabConnection need to be transformed.
  // Specifically, backend sends `instance_id` for devices, and connections refer to these.
  // Frontend ReactFlow uses `id` for nodes. We need to map these.
  // For now, assume backend sends data that's directly usable or easily adaptable.
  const response = await axios.get<LabTopologyData>(`${API_LAB_BASE_URL}/topologies/${topologyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Data structure for saving a topology
// Frontend sends ReactFlow nodes and edges. Backend needs to process this.
// The backend's /save endpoint expects:
// {
//   "devices": [ { "device_config_id": 1, "instance_name": "R1", "canvas_x": 50, "canvas_y": 100 } ],
//   "connections": [ { "source_instance_id": "node_id_1", "target_instance_id": "node_id_2" } ]
// }
// The backend will then create LabDeviceInstance and LabConnection records.
// The NodeModel for devices in save payload should contain device_config_id, instance_name (optional), canvas_x, canvas_y.
// The EdgeModel for connections in save payload should contain source/target node IDs from ReactFlow.
// Backend will map these node IDs to its newly created LabDeviceInstance IDs. This is tricky.

// Let's define the save payload based on what LabEditorPage can provide:
export interface FrontendNodeForSave {
    id: string; // ReactFlow node ID, backend might use this as a temporary key or ignore if it creates its own instance IDs
    deviceConfigId: number;
    instanceName?: string; // from data.label or a specific field
    x: number; // from position.x
    y: number; // from position.y
}
export interface FrontendEdgeForSave {
    id: string; // ReactFlow edge ID
    source: string; // ReactFlow source node ID
    target: string; // ReactFlow target node ID
}

export interface SaveTopologyPayload {
    // name?: string; // If updating name/description at the same time
    // description?: string;
    nodes: FrontendNodeForSave[];
    edges: FrontendEdgeForSave[];
}


export const saveLabTopology = async (topologyId: number, payload: SaveTopologyPayload, token: string): Promise<LabTopologyData> => {
  // The backend will need to translate FrontendNodeForSave into its LabDeviceInstance structure
  // and FrontendEdgeForSave into its LabConnection structure, handling ID mapping.
  const response = await axios.post<LabTopologyData>(`${API_LAB_BASE_URL}/topologies/${topologyId}/save`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data; // Backend should return the full, updated topology
};

export const deleteLabTopology = async (topologyId: number, token: string): Promise<void> => {
    await axios.delete(`${API_LAB_BASE_URL}/topologies/${topologyId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
