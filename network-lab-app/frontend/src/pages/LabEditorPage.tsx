import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  XYPosition,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Main styles for react-flow

import DevicePalette from '../components/lab/DevicePalette'; // To be created
import CustomDeviceNode from '../components/lab/CustomDeviceNode';

// Data associated with a device node
interface DeviceNodeData {
  label: string; // Device name or instance name
  deviceConfigId: number; // From DeviceConfig
  hostnameIp?: string; // For SSH
  iconPath?: string; // Path to its icon
  // Add other device-specific data as needed
}

// Initial setup or loaded from backend
const initialNodes: Node<DeviceNodeData>[] = [
  // Example:
  // { id: '1', type: 'default', data: { label: 'Router 1', deviceConfigId: 1 }, position: { x: 250, y: 5 } },
];

const initialEdges: Edge[] = [
  // Example:
  // { id: 'e1-2', source: '1', target: '2', animated: true },
];

// Define custom node types
const nodeTypes = {
  deviceNode: CustomDeviceNode, // 'deviceNode' is the key used in newNode.type
};

const LabEditorPage: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<DeviceNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { token } = useAuth(); // Assuming useAuth() provides the auth token

  const [currentTopologyId, setCurrentTopologyId] = useState<number | null>(null);
  const [currentTopologyName, setCurrentTopologyName] = useState<string>('Untitled Lab');
  const [availableTopologies, setAvailableTopologies] = useState<labService.LabTopologySummary[]>([]);
  const [isLoadingTopologies, setIsLoadingTopologies] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // --- Utility to map backend data to React Flow ---
  const mapBackendNodesToReactFlow = (backendNodes: labService.NodeModel[]): Node<DeviceNodeData>[] => {
    return backendNodes.map(bn => ({
      id: bn.id, // Backend should send string ID matching React Flow's expectation
      type: 'deviceNode',
      position: { x: bn.canvas_x, y: bn.canvas_y },
      data: {
        label: bn.instance_name || 'Unnamed Device', // Adjust as per your data
        deviceConfigId: bn.device_config_id,
        // Ensure hostnameIp and iconPath are part of the data returned by backend for nodes if needed directly
        // For now, CustomDeviceNode might fetch these or they are part of DeviceConfig fetched by palette
      },
    }));
  };

  const mapBackendEdgesToReactFlow = (backendEdges: labService.EdgeModel[]): Edge[] => {
    return backendEdges.map(be => ({
      id: be.id, // Backend should send string ID
      source: be.source_instance_id, // Backend should send string ID matching node ID
      target: be.target_instance_id, // Backend should send string ID matching node ID
    }));
  };


  // --- Topology Management Functions ---
  const fetchAvailableTopologies = useCallback(async () => {
    if (!token) return;
    setIsLoadingTopologies(true);
    try {
      const topologies = await labService.getLabTopologies(token);
      setAvailableTopologies(topologies);
    } catch (error) {
      console.error("Failed to fetch topologies:", error);
      alert("Failed to load your saved labs.");
    } finally {
      setIsLoadingTopologies(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAvailableTopologies();
  }, [fetchAvailableTopologies]);

  const handleCreateNewTopology = async () => {
    if (!token) { alert("Please login."); return; }
    const newName = prompt("Enter name for new lab topology:", "New Lab");
    if (newName) {
      try {
        const newTopo = await labService.createLabTopology({ name: newName }, token);
        setCurrentTopologyId(newTopo.id);
        setCurrentTopologyName(newTopo.name);
        setNodes(initialNodes); // Clear canvas
        setEdges(initialEdges); // Clear canvas
        fetchAvailableTopologies(); // Refresh list
        alert(`Lab '${newName}' created. You can start building!`);
      } catch (error) {
        console.error("Failed to create new topology:", error);
        alert("Error creating new lab.");
      }
    }
  };

  const handleLoadTopology = async (topologyId: number) => {
    if (!token) { alert("Please login."); return; }
    try {
      const topoData = await labService.getLabTopologyDetail(topologyId, token);
      setNodes(mapBackendNodesToReactFlow(topoData.nodes));
      setEdges(mapBackendEdgesToReactFlow(topoData.edges));
      setCurrentTopologyId(topoData.id);
      setCurrentTopologyName(topoData.name);
      setShowLoadDialog(false);
      // Fit view after loading
      setTimeout(() => reactFlowInstance?.fitView(), 0);
    } catch (error) {
      console.error("Failed to load topology:", error);
      alert("Error loading lab.");
    }
  };

  const handleSaveTopology = async () => {
    if (!currentTopologyId || !token) {
      alert("No active lab to save, or not logged in. Please create or load a lab first.");
      // Optionally, could trigger "Save As" if no currentTopologyId
      return;
    }

    // Transform React Flow nodes/edges to backend format
    const payloadNodes: labService.FrontendNodeForSave[] = nodes.map(n => ({
      id: n.id,
      deviceConfigId: n.data.deviceConfigId,
      instanceName: n.data.label, // Assuming label is the instance name
      x: n.position.x,
      y: n.position.y,
    }));
    const payloadEdges: labService.FrontendEdgeForSave[] = edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }));

    try {
      await labService.saveLabTopology(currentTopologyId, { nodes: payloadNodes, edges: payloadEdges }, token);
      alert(`Lab '${currentTopologyName}' saved successfully!`);
      fetchAvailableTopologies(); // Refresh list in case name changed (though PUT is for that)
    } catch (error) {
      console.error("Failed to save topology:", error);
      alert("Error saving lab.");
    }
  };


  // --- React Flow Callbacks ---
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Function to handle dropping a device from the palette onto the canvas
  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowInstance) {
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect(); // react-flow pane
      const type = event.dataTransfer.getData('application/reactflow-nodetype'); // e.g., 'deviceConfig'
      const deviceConfigString = event.dataTransfer.getData('application/json-deviceconfig');

      if (typeof type === 'undefined' || !type || !deviceConfigString) {
        return;
      }

      const deviceConfig = JSON.parse(deviceConfigString);

      // Calculate position where the node should be created
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<DeviceNodeData> = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID
         type: 'deviceNode', // Use the custom node type
        position,
        data: {
          label: deviceConfig.name || 'New Device',
          deviceConfigId: deviceConfig.id,
          hostnameIp: deviceConfig.hostname_ip, // Store for SSH
          iconPath: deviceConfig.default_icon_path // Store for display in node
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // TODO: Load/Save topology functionality
  // useEffect to load topology data from backend if an ID is provided (e.g., via URL param)
  // Function to save current nodes and edges to backend

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node<DeviceNodeData>) => {
    // event.preventDefault(); // Not usually needed for onNodeClick unless stopping other behaviors
    console.log('Clicked node:', node);
    if (node.data && node.data.hostnameIp) {
      const sshUrl = `ssh://${node.data.hostnameIp}`;
      // Inform user or provide the URL, as direct launch can be blocked or tricky.
      // A common approach is to show the URL and let the user copy it,
      // or try window.open and let the browser/OS handle it.
      // Some browsers might block window.open(sshUrl) for security.
      // An alternative is a small modal displaying the command: putty.exe -ssh user@host or similar

      // Try simple window.open first
      const confirmed = window.confirm(`Launch SSH session to ${node.data.label} (${node.data.hostnameIp})?\n\nURL: ${sshUrl}\n\nNote: Your OS needs an SSH URL handler (e.g., for Putty/SecureCRT).`);
      if (confirmed) {
        window.open(sshUrl, '_blank');
      }
    } else {
      alert(`Device ${node.data.label} does not have a Hostname/IP configured for SSH.`);
    }
  }, []);

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' /* Adjust based on Navbar height */ }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', background: '#f7f7f7' }}>
          <span style={{ marginRight: '20px', fontWeight: 'bold' }}>Lab: {currentTopologyName} {currentTopologyId ? `(ID: ${currentTopologyId})` : '(Unsaved)'}</span>
          <button onClick={handleCreateNewTopology} style={{ marginRight: '10px' }}>New Lab</button>
          <button onClick={() => setShowLoadDialog(true)} style={{ marginRight: '10px' }} disabled={isLoadingTopologies}>
            {isLoadingTopologies ? 'Loading Labs...' : 'Load Lab'}
          </button>
          <button onClick={handleSaveTopology} disabled={!currentTopologyId}>Save Lab</button>
          {/* TODO: Add Save As button */}
        </div>

        {showLoadDialog && (
          <div style={{ border: '1px solid #ddd', padding: '10px', margin: '10px', backgroundColor: 'white' }}>
            <h4>Select a Lab to Load</h4>
            {availableTopologies.length === 0 ? <p>No saved labs found.</p> : (
              <ul>
                {availableTopologies.map(topo => (
                  <li key={topo.id} style={{ marginBottom: '5px' }}>
                    {topo.name} (ID: {topo.id}) - Last updated: {new Date(topo.updated_at).toLocaleDateString()}
                    <button onClick={() => handleLoadTopology(topo.id)} style={{ marginLeft: '10px' }}>Load</button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowLoadDialog(false)}>Close</button>
          </div>
        )}

        <div style={{ display: 'flex', flexGrow: 1 /* Ensure this div takes remaining height */ }}>
          <DevicePalette /> {/* Palette on the left */}
          <div style={{ flexGrow: 1, height: '100%' }} onDrop={onDrop} onDragOver={onDragOver}> {/* Ensure this takes full height of its flex container */}
            <ReactFlow
              nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick} // Add the node click handler
            onInit={setReactFlowInstance} // Save instance for calculations like onDrop
            nodeTypes={nodeTypes} // Pass the custom node types
            fitView // Zooms out to fit all nodes initially
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background gap={16} />
          </ReactFlow>
        </div>
        {/* Optional: Properties panel on the right for selected node/edge */}
      </div>
    </ReactFlowProvider>
  );
};

export default LabEditorPage;
