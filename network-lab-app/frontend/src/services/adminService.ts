import axios from 'axios';

// Assuming API calls will be proxied by Vite, so relative paths are fine.
// Alternatively, use a full base URL like in authService.
const API_ADMIN_BASE_URL = '/api/admin'; // Proxied path

// Interface for DeviceType (matches backend model and expected API response)
export interface DeviceType {
  id: number;
  name: string;
  default_icon_path: string | null;
}

// Interface for creating/updating DeviceType (omits id for creation)
export interface DeviceTypePayload {
  name: string;
  default_icon_path?: string | null;
}

// Interface for DeviceConfig (matches backend model and expected API response)
export interface DeviceConfig {
  id: number;
  name: string;
  device_type_id: number;
  device_type_name?: string; // Often included by backend for convenience
  hostname_ip: string;
  default_icon_path?: string | null; // Specific icon for this config
  notes?: string | null;
  // created_by_id, created_at, updated_at might also be present
}

// Interface for creating/updating DeviceConfig
export interface DeviceConfigPayload {
  name: string;
  device_type_id: number;
  hostname_ip: string;
  default_icon_path?: string | null;
  notes?: string | null;
}


// --- DeviceType API Calls ---

export const getDeviceTypes = async (token: string): Promise<DeviceType[]> => {
  const response = await axios.get<DeviceType[]>(`${API_ADMIN_BASE_URL}/device-types`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createDeviceType = async (payload: DeviceTypePayload, token: string): Promise<DeviceType> => {
  const response = await axios.post<DeviceType>(`${API_ADMIN_BASE_URL}/device-types`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateDeviceType = async (id: number, payload: DeviceTypePayload, token: string): Promise<DeviceType> => {
  // Assuming your backend supports PUT for updates on /device-types/<id>
  // If not, this function or the backend endpoint would need adjustment.
  // The current backend admin.py for device-types doesn't have PUT/DELETE yet.
  // For now, let's assume it will be added or this function won't be used until then.
  const response = await axios.put<DeviceType>(`${API_ADMIN_BASE_URL}/device-types/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteDeviceType = async (id: number, token: string): Promise<void> => {
  // Assuming backend supports DELETE on /device-types/<id>
  await axios.delete(`${API_ADMIN_BASE_URL}/device-types/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


// --- DeviceConfig API Calls ---

export const getDeviceConfigs = async (token: string): Promise<DeviceConfig[]> => {
  const response = await axios.get<DeviceConfig[]>(`${API_ADMIN_BASE_URL}/device-configs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getDeviceConfigById = async (id: number, token: string): Promise<DeviceConfig> => {
    const response = await axios.get<DeviceConfig>(`${API_ADMIN_BASE_URL}/device-configs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const createDeviceConfig = async (payload: DeviceConfigPayload, token: string): Promise<DeviceConfig> => {
  const response = await axios.post<DeviceConfig>(`${API_ADMIN_BASE_URL}/device-configs`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateDeviceConfig = async (id: number, payload: DeviceConfigPayload, token: string): Promise<DeviceConfig> => {
  const response = await axios.put<DeviceConfig>(`${API_ADMIN_BASE_URL}/device-configs/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteDeviceConfig = async (id: number, token: string): Promise<void> => {
  await axios.delete(`${API_ADMIN_BASE_URL}/device-configs/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
