from flask import Blueprint, request, jsonify
from ..models import db, LabTopology, LabDeviceInstance, LabConnection, DeviceConfig, DeviceType
from flask_jwt_extended import jwt_required, get_jwt_identity

lab_bp = Blueprint('lab_bp', __name__)

@lab_bp.route('/topologies', methods=['GET'])
@jwt_required()
def get_lab_topologies():
    current_user_id = get_jwt_identity()
    topologies = LabTopology.query.filter_by(user_id=current_user_id).all()
    return jsonify([{
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None
    } for t in topologies]), 200

@lab_bp.route('/topologies', methods=['POST'])
@jwt_required()
def create_lab_topology():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    if not name:
        return jsonify({"msg": "Topology name is required"}), 400

    new_topology = LabTopology(
        name=name,
        description=description,
        user_id=current_user_id
    )
    db.session.add(new_topology)
    db.session.commit()
    return jsonify({
        "id": new_topology.id,
        "name": new_topology.name,
        "description": new_topology.description,
        "created_at": new_topology.created_at.isoformat() if new_topology.created_at else None,
        "updated_at": new_topology.updated_at.isoformat() if new_topology.updated_at else None
    }), 201

@lab_bp.route('/topologies/<int:topology_id>', methods=['GET'])
@jwt_required()
def get_lab_topology_detail(topology_id):
    current_user_id = get_jwt_identity()
    topology = LabTopology.query.filter_by(id=topology_id, user_id=current_user_id).first_or_404()

    device_instances_data = []
    # Ensure relationships are loaded or handle potential None values gracefully
    for instance in topology.device_instances or []:
        device_config = instance.device_config
        if device_config:
            device_type = device_config.device_type
            icon_path = device_config.default_icon_path or (device_type.default_icon_path if device_type else None)

            device_instances_data.append({
                "id": str(instance.id),
                "type": 'deviceNode',
                "position": {"x": instance.canvas_x, "y": instance.canvas_y},
                "data": {
                    "label": instance.instance_name or device_config.name,
                    "deviceConfigId": instance.device_config_id,
                    "hostnameIp": device_config.hostname_ip,
                    "iconPath": icon_path,
                }
            })

    connections_data = []
    for conn in topology.connections or []:
        connections_data.append({
            "id": f"edge_{conn.source_instance_id}-{conn.target_instance_id}_{conn.id}", # More unique edge ID
            "source": str(conn.source_instance_id),
            "target": str(conn.target_instance_id),
        })

    return jsonify({
        "id": topology.id,
        "name": topology.name,
        "description": topology.description,
        "nodes": device_instances_data,
        "edges": connections_data,
        "created_at": topology.created_at.isoformat() if topology.created_at else None,
        "updated_at": topology.updated_at.isoformat() if topology.updated_at else None
    }), 200

@lab_bp.route('/topologies/<int:topology_id>', methods=['PUT'])
@jwt_required()
def update_lab_topology_metadata(topology_id):
    current_user_id = get_jwt_identity()
    topology = LabTopology.query.filter_by(id=topology_id, user_id=current_user_id).first_or_404()
    data = request.get_json()

    topology.name = data.get('name', topology.name)
    topology.description = data.get('description', topology.description)

    db.session.commit()
    return jsonify({
        "id": topology.id,
        "name": topology.name,
        "description": topology.description,
        "created_at": topology.created_at.isoformat() if topology.created_at else None,
        "updated_at": topology.updated_at.isoformat() if topology.updated_at else None
    }), 200


@lab_bp.route('/topologies/<int:topology_id>/save', methods=['POST'])
@jwt_required()
def save_lab_topology_full(topology_id):
    current_user_id = get_jwt_identity()
    topology = LabTopology.query.filter_by(id=topology_id, user_id=current_user_id).first_or_404()
    data = request.get_json()

    # Delete existing connections first
    LabConnection.query.filter_by(topology_id=topology_id).delete(synchronize_session='fetch')
    # Then delete existing device instances
    LabDeviceInstance.query.filter_by(topology_id=topology_id).delete(synchronize_session='fetch')

    db.session.flush()

    frontend_node_id_to_backend_instance_id = {}

    for node_data in data.get('nodes', []):
        frontend_node_id = node_data.get('id')
        device_config_id = node_data.get('data', {}).get('deviceConfigId') # Correctly access nested data
        position = node_data.get('position', {})
        instance_name = node_data.get('data', {}).get('label')


        if not device_config_id:
             db.session.rollback()
             return jsonify({"msg": f"Missing deviceConfigId for node {frontend_node_id}"}), 400

        if not DeviceConfig.query.get(device_config_id):
            db.session.rollback()
            return jsonify({"msg": f"Invalid device_config_id: {device_config_id} for node {frontend_node_id}"}), 400

        instance = LabDeviceInstance(
            topology_id=topology_id,
            device_config_id=device_config_id,
            instance_name=instance_name,
            canvas_x=position.get('x', 0),
            canvas_y=position.get('y', 0)
        )
        db.session.add(instance)
        db.session.flush()

        if frontend_node_id: # Ensure frontend_node_id is present
             frontend_node_id_to_backend_instance_id[frontend_node_id] = instance.id

    for edge_data in data.get('edges', []):
        frontend_source_id = edge_data.get('source')
        frontend_target_id = edge_data.get('target')

        backend_source_instance_id = frontend_node_id_to_backend_instance_id.get(frontend_source_id)
        backend_target_instance_id = frontend_node_id_to_backend_instance_id.get(frontend_target_id)

        if backend_source_instance_id and backend_target_instance_id:
            connection = LabConnection(
                topology_id=topology_id,
                source_instance_id=backend_source_instance_id,
                target_instance_id=backend_target_instance_id
            )
            db.session.add(connection)
        else:
            print(f"Warning: Could not map frontend edge {edge_data.get('id')} to backend instances. Missing mapping for Source: {frontend_source_id} (maps to {backend_source_instance_id}) or Target: {frontend_target_id} (maps to {backend_target_instance_id})")
            # Consider whether to error out or just skip faulty edges
            # For now, skipping.

    db.session.commit()
    return get_lab_topology_detail(topology_id)

@lab_bp.route('/topologies/<int:topology_id>', methods=['DELETE'])
@jwt_required()
def delete_lab_topology(topology_id):
    current_user_id = get_jwt_identity()
    topology = LabTopology.query.filter_by(id=topology_id, user_id=current_user_id).first_or_404()

    db.session.delete(topology)
    db.session.commit()
    return '', 204
