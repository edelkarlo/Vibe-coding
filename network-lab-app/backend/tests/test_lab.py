import pytest
from app.models import LabTopology, LabDeviceInstance, LabConnection, DeviceConfig, DeviceType, User

# Helper function to create a basic device config for tests
def ensure_device_config(db_session, user_id):
    dt = DeviceType.query.filter_by(name="Router").first() # Assumes Router type exists from conftest
    if not dt:
        dt = DeviceType(name="RouterTest", default_icon_path="icons/router.svg")
        db_session.add(dt)
        db_session.commit()

    dc = DeviceConfig.query.filter_by(name="TestConfigForLab").first()
    if not dc:
        dc = DeviceConfig(
            name="TestConfigForLab",
            device_type_id=dt.id,
            hostname_ip="1.1.1.1",
            created_by_id=user_id
        )
        db_session.add(dc)
        db_session.commit()
    return dc

@pytest.fixture(scope="function")
def sample_device_config(db_session, admin_user_token): # Using admin to create, but could be any user if allowed
    # Get admin user to associate as creator
    # This relies on admin_user_token fixture to work, which logs in admin
    # A more direct way would be to query for admin user if user_id is needed directly
    admin_user = User.query.filter_by(username="testadmin").first()
    assert admin_user is not None, "Admin user 'testadmin' not found for sample_device_config"

    return ensure_device_config(db_session, admin_user.id)


def test_create_lab_topology(client, regular_user_token):
    """Test creating a new lab topology."""
    payload = {'name': 'MyFirstLab', 'description': 'A basic test lab.'}
    response = client.post('/api/lab/topologies', json=payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name'] == 'MyFirstLab'
    assert 'id' in json_data
    assert LabTopology.query.filter_by(name='MyFirstLab').count() == 1

def test_get_lab_topologies_for_user(client, regular_user_token, db_session):
    """Test getting all lab topologies for the authenticated user."""
    # Create a topology for this user first
    user = User.query.filter_by(username="testuser").first() # from conftest
    topo1 = LabTopology(name="UserLab1", user_id=user.id)
    topo2 = LabTopology(name="UserLab2", user_id=user.id)
    db_session.add_all([topo1, topo2])
    db_session.commit()

    response = client.get('/api/lab/topologies', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert isinstance(json_data, list)
    # Including any previously created ones by this user in other tests if db state persists across test functions (it shouldn't with function-scoped db_session rollback)
    # For isolated test, expect 2 if db_session fixture ensures clean start.
    # Let's check for the names we just created.
    names_in_response = [t['name'] for t in json_data]
    assert "UserLab1" in names_in_response
    assert "UserLab2" in names_in_response


def test_get_lab_topology_detail(client, regular_user_token, db_session, sample_device_config):
    """Test getting details of a specific lab topology."""
    user = User.query.filter_by(username="testuser").first()
    topology = LabTopology(name="DetailedLab", user_id=user.id)
    db_session.add(topology)
    db_session.commit() # Commit to get topology.id

    # Add a device instance to this topology
    instance1 = LabDeviceInstance(
        topology_id=topology.id,
        device_config_id=sample_device_config.id,
        instance_name="R1",
        canvas_x=100, canvas_y=100
    )
    db_session.add(instance1)
    db_session.commit() # Commit to get instance1.id

    response = client.get(f'/api/lab/topologies/{topology.id}', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['id'] == topology.id
    assert json_data['name'] == "DetailedLab"
    assert len(json_data['nodes']) == 1
    assert json_data['nodes'][0]['data']['label'] == "R1"
    assert json_data['nodes'][0]['data']['deviceConfigId'] == sample_device_config.id
    assert json_data['nodes'][0]['id'] == str(instance1.id) # Ensure ID is string for React Flow

def test_update_lab_topology_metadata(client, regular_user_token, db_session):
    """Test updating a lab topology's metadata (name, description)."""
    user = User.query.filter_by(username="testuser").first()
    topology = LabTopology(name="LabToUpdate", user_id=user.id, description="Old desc")
    db_session.add(topology)
    db_session.commit()

    payload = {'name': 'UpdatedLabName', 'description': 'New description'}
    response = client.put(f'/api/lab/topologies/{topology.id}', json=payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == 'UpdatedLabName'
    assert json_data['description'] == 'New description'

    updated_topo = LabTopology.query.get(topology.id)
    assert updated_topo.name == 'UpdatedLabName'

def test_save_lab_topology_full(client, regular_user_token, db_session, sample_device_config):
    """Test saving the full state (nodes and edges) of a lab topology."""
    user = User.query.filter_by(username="testuser").first()
    topology = LabTopology(name="LabToSaveFull", user_id=user.id)
    db_session.add(topology)
    db_session.commit()

    # Frontend-like payload
    save_payload = {
        "nodes": [
            {"id": "frontend_node_1", "data": {"deviceConfigId": sample_device_config.id, "label": "RouterA"}, "position": {"x": 50, "y": 50}},
            {"id": "frontend_node_2", "data": {"deviceConfigId": sample_device_config.id, "label": "RouterB"}, "position": {"x": 200, "y": 100}}
        ],
        "edges": [
            {"id": "frontend_edge_1", "source": "frontend_node_1", "target": "frontend_node_2"}
        ]
    }
    # Adjust payload to match what backend expects (based on lab.py save route)
    # Backend save route expects: { nodes: [{id (frontend_id), deviceConfigId, instanceName, x, y}], connections: [{source, target}] }
    # My lab.py save_lab_topology_full expects node_data.get('data').get('deviceConfigId')
    # and node_data.get('position') for x,y

    # Corrected payload based on backend's expected structure from FrontendNodeForSave like interface
    # The backend's save_lab_topology_full was updated to expect this:
    # nodes: [{ id (frontend_id), data: {deviceConfigId, label}, position: {x, y} }]
    # edges: [{ id (frontend_id), source, target }]

    # Let's ensure the payload matches the one defined in labService.ts FrontendNodeForSave / FrontendEdgeForSave
    # which is then processed by the backend.
    # The backend `save_lab_topology_full` was updated to parse:
    # node_data.get('deviceConfigId'), node_data.get('instanceName'), node_data.get('x'), node_data.get('y')
    # This means the payload from frontend should be flatter for nodes.

    # Re-adjusting payload to match what the current backend save function expects:
    # It expects: data.get('nodes', []) where node_data has 'id', 'data.deviceConfigId', 'data.label', 'position.x', 'position.y'
    # And data.get('edges', []) where edge_data has 'source', 'target'

    # The current backend save_lab_topology_full in the last overwrite of lab.py expects:
    # node_data.get('id'), node_data.get('data', {}).get('deviceConfigId'), node_data.get('position', {}), node_data.get('data', {}).get('label')
    # This matches React Flow node structure more closely.

    response = client.post(f'/api/lab/topologies/{topology.id}/save', json=save_payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()

    assert len(json_data['nodes']) == 2
    assert len(json_data['edges']) == 1

    # Verify DB state
    db_instances = LabDeviceInstance.query.filter_by(topology_id=topology.id).all()
    assert len(db_instances) == 2
    db_connections = LabConnection.query.filter_by(topology_id=topology.id).all()
    assert len(db_connections) == 1

    # Check if mapping was correct
    # Example: find RouterA and RouterB instances and check their connection
    router_a_instance = next((inst for inst in db_instances if inst.instance_name == "RouterA"), None)
    router_b_instance = next((inst for inst in db_instances if inst.instance_name == "RouterB"), None)
    assert router_a_instance is not None
    assert router_b_instance is not None

    # Verify the connection links these two instances
    connection_found = False
    for conn in db_connections:
        if (conn.source_instance_id == router_a_instance.id and conn.target_instance_id == router_b_instance.id) or \
           (conn.source_instance_id == router_b_instance.id and conn.target_instance_id == router_a_instance.id):
            connection_found = True
            break
    assert connection_found


def test_delete_lab_topology(client, regular_user_token, db_session):
    """Test deleting a lab topology."""
    user = User.query.filter_by(username="testuser").first()
    topology = LabTopology(name="LabToDelete", user_id=user.id)
    db_session.add(topology)
    db_session.commit()
    topo_id = topology.id

    response = client.delete(f'/api/lab/topologies/{topo_id}', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 204
    assert LabTopology.query.get(topo_id) is None

def test_get_non_existent_topology_detail(client, regular_user_token):
    """Test getting detail for a non-existent topology."""
    response = client.get('/api/lab/topologies/99999', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 404

def test_unauthorized_access_to_others_topology(client, regular_user_token, admin_user_token, db_session):
    """Test that a regular user cannot access/modify another user's topology."""
    admin = User.query.filter_by(username="testadmin").first()
    admin_topo = LabTopology(name="AdminOnlyLab", user_id=admin.id)
    db_session.add(admin_topo)
    db_session.commit()

    # Regular user tries to GET admin's topology
    response_get = client.get(f'/api/lab/topologies/{admin_topo.id}', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response_get.status_code == 404 # Should be 404 as it's not found for this user

    # Regular user tries to PUT admin's topology
    response_put = client.put(f'/api/lab/topologies/{admin_topo.id}', json={'name': 'Hacked'}, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response_put.status_code == 404

    # Regular user tries to SAVE admin's topology
    response_save = client.post(f'/api/lab/topologies/{admin_topo.id}/save', json={"nodes": [], "edges": []}, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response_save.status_code == 404

    # Regular user tries to DELETE admin's topology
    response_delete = client.delete(f'/api/lab/topologies/{admin_topo.id}', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response_delete.status_code == 404

    # Admin should still be able to access their own topology
    response_admin_get = client.get(f'/api/lab/topologies/{admin_topo.id}', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response_admin_get.status_code == 200
    assert response_admin_get.get_json()['name'] == "AdminOnlyLab"
