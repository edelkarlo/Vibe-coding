import pytest
from app.models import DeviceType, DeviceConfig

# --- DeviceType Tests ---

def test_get_device_types_admin(client, admin_user_token):
    """Admin can get device types."""
    response = client.get('/api/admin/device-types', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 200
    # Initial conftest might add 2 types (Router, Switch)
    assert len(response.get_json()) >= 2

def test_get_device_types_regular_user(client, regular_user_token):
    """Regular user can also get device types (as per current backend logic)."""
    response = client.get('/api/admin/device-types', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    assert len(response.get_json()) >= 2

def test_create_device_type_admin(client, admin_user_token, db_session):
    """Admin can create a new device type."""
    payload = {'name': 'Firewall', 'default_icon_path': 'icons/firewall.svg'}
    response = client.post('/api/admin/device-types', json=payload, headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name'] == 'Firewall'
    assert DeviceType.query.filter_by(name='Firewall').count() == 1

def test_create_device_type_regular_user(client, regular_user_token):
    """Regular user cannot create a device type."""
    payload = {'name': 'UnauthorizedType', 'default_icon_path': 'icons/unauth.svg'}
    response = client.post('/api/admin/device-types', json=payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 403 # Forbidden

def test_create_device_type_duplicate_name_admin(client, admin_user_token):
    """Admin cannot create a device type with a duplicate name."""
    client.post('/api/admin/device-types', json={'name': 'Server', 'default_icon_path': 'icons/server.svg'}, headers={'Authorization': f'Bearer {admin_user_token}'})
    response = client.post('/api/admin/device-types', json={'name': 'Server', 'default_icon_path': 'icons/server2.svg'}, headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 400
    assert 'already exists' in response.get_json()['msg']

def test_update_device_type_admin(client, admin_user_token, db_session):
    """Admin can update an existing device type."""
    # Create a type to update
    dt = DeviceType(name="OldTypeName", default_icon_path="old.svg")
    db_session.add(dt)
    db_session.commit()

    payload = {'name': 'NewTypeName', 'default_icon_path': 'new.svg'}
    response = client.put(f'/api/admin/device-types/{dt.id}', json=payload, headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == 'NewTypeName'
    assert json_data['default_icon_path'] == 'new.svg'
    updated_dt = DeviceType.query.get(dt.id)
    assert updated_dt.name == 'NewTypeName'

def test_update_device_type_regular_user(client, regular_user_token, db_session):
    """Regular user cannot update a device type."""
    dt = DeviceType.query.filter_by(name="Router").first() # From conftest
    payload = {'name': 'AttemptedUpdate'}
    response = client.put(f'/api/admin/device-types/{dt.id}', json=payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 403

def test_delete_device_type_admin(client, admin_user_token, db_session):
    """Admin can delete an unused device type."""
    dt_to_delete = DeviceType(name="ToDelete", default_icon_path="delete.svg")
    db_session.add(dt_to_delete)
    db_session.commit()
    dt_id = dt_to_delete.id

    response = client.delete(f'/api/admin/device-types/{dt_id}', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 204
    assert DeviceType.query.get(dt_id) is None

def test_delete_used_device_type_admin(client, admin_user_token, db_session):
    """Admin cannot delete a device type that is in use by a DeviceConfig."""
    dt_in_use = DeviceType.query.filter_by(name="Router").first() # From conftest
    # Create a DeviceConfig using this type
    dc = DeviceConfig(name="TestRouterConfig", device_type_id=dt_in_use.id, hostname_ip="1.1.1.1")
    db_session.add(dc)
    db_session.commit()

    response = client.delete(f'/api/admin/device-types/{dt_in_use.id}', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 409 # Conflict
    assert 'in use by one or more device configurations' in response.get_json()['msg']
    assert DeviceType.query.get(dt_in_use.id) is not None # Should still exist


# --- DeviceConfig Tests ---

def test_get_device_configs_admin(client, admin_user_token, db_session):
    """Admin can get device configurations."""
    # Create a sample DeviceConfig first
    router_type = DeviceType.query.filter_by(name="Router").first()
    if not router_type: # Should be seeded by conftest
        router_type = DeviceType(name="Router", default_icon_path="icons/router.svg")
        db_session.add(router_type)
        db_session.commit()

    dc = DeviceConfig(name="TestR1", device_type_id=router_type.id, hostname_ip="10.0.0.1")
    db_session.add(dc)
    db_session.commit()

    response = client.get('/api/admin/device-configs', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 200
    configs = response.get_json()
    assert isinstance(configs, list)
    assert any(c['name'] == 'TestR1' for c in configs)

def test_get_device_configs_regular_user(client, regular_user_token):
    """Regular user can also get device configs (for palette)."""
    response = client.get('/api/admin/device-configs', headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 200
    assert isinstance(response.get_json(), list)


def test_create_device_config_admin(client, admin_user_token, db_session):
    """Admin can create a new device configuration."""
    router_type = DeviceType.query.filter_by(name="Router").first()
    assert router_type is not None, "Router DeviceType not found, check conftest seeding."

    payload = {
        'name': 'CoreRouter01',
        'device_type_id': router_type.id,
        'hostname_ip': '192.168.1.1',
        'notes': 'Main core router'
    }
    response = client.post('/api/admin/device-configs', json=payload, headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['name'] == 'CoreRouter01'
    assert json_data['device_type_name'] == router_type.name
    assert DeviceConfig.query.filter_by(name='CoreRouter01').count() == 1

def test_create_device_config_regular_user(client, regular_user_token):
    """Regular user cannot create a device configuration."""
    router_type = DeviceType.query.filter_by(name="Router").first()
    payload = {'name': 'UserRouter', 'device_type_id': router_type.id, 'hostname_ip': '1.2.3.4'}
    response = client.post('/api/admin/device-configs', json=payload, headers={'Authorization': f'Bearer {regular_user_token}'})
    assert response.status_code == 403

def test_update_device_config_admin(client, admin_user_token, db_session):
    """Admin can update an existing device configuration."""
    router_type = DeviceType.query.filter_by(name="Router").first()
    dc = DeviceConfig(name="ConfigToUpdate", device_type_id=router_type.id, hostname_ip="1.1.1.1")
    db_session.add(dc)
    db_session.commit()

    payload = {'name': 'UpdatedConfigName', 'hostname_ip': '1.1.1.2', 'notes': 'Updated note.'}
    response = client.put(f'/api/admin/device-configs/{dc.id}', json=payload, headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['name'] == 'UpdatedConfigName'
    assert json_data['hostname_ip'] == '1.1.1.2'
    updated_dc = DeviceConfig.query.get(dc.id)
    assert updated_dc.name == 'UpdatedConfigName'
    assert updated_dc.notes == 'Updated note.'

def test_delete_device_config_admin(client, admin_user_token, db_session):
    """Admin can delete an unused device configuration."""
    router_type = DeviceType.query.filter_by(name="Router").first()
    dc_to_delete = DeviceConfig(name="ConfigToDelete", device_type_id=router_type.id, hostname_ip="2.2.2.2")
    db_session.add(dc_to_delete)
    db_session.commit()
    dc_id = dc_to_delete.id

    response = client.delete(f'/api/admin/device-configs/{dc_id}', headers={'Authorization': f'Bearer {admin_user_token}'})
    assert response.status_code == 204
    assert DeviceConfig.query.get(dc_id) is None

# Note: Test for deleting a DeviceConfig that's in use by a LabDeviceInstance would require setting up a LabTopology and LabDeviceInstance.
# This can be added when testing lab functionalities.
# For now, the backend route for DELETE /device-configs/<id> checks for this.
# We can trust that check or add a more complex test later.
