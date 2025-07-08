from flask import Blueprint, request, jsonify
from ..models import db, DeviceType, DeviceConfig, User # Added User for created_by_id
from flask_jwt_extended import jwt_required, get_jwt

admin_bp = Blueprint('admin_bp', __name__)

def check_admin():
    """Helper function to check if current user is admin."""
    claims = get_jwt()
    return claims.get("is_admin", False)

# --- DeviceType Routes ---
@admin_bp.route('/device-types', methods=['GET'])
@jwt_required()
def get_device_types():
    # No admin check here, allow authenticated users to see types for selection
    types = DeviceType.query.all()
    return jsonify([{"id": t.id, "name": t.name, "default_icon_path": t.default_icon_path} for t in types]), 200

@admin_bp.route('/device-types', methods=['POST'])
@jwt_required()
def create_device_type():
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    data = request.get_json()
    name = data.get('name')
    default_icon_path = data.get('default_icon_path')

    if not name:
        return jsonify({"msg": "Device type name is required"}), 400

    if DeviceType.query.filter_by(name=name).first():
        return jsonify({"msg": "Device type with this name already exists"}), 400

    new_type = DeviceType(name=name, default_icon_path=default_icon_path)
    db.session.add(new_type)
    db.session.commit()
    return jsonify({"id": new_type.id, "name": new_type.name, "default_icon_path": new_type.default_icon_path}), 201

@admin_bp.route('/device-types/<int:type_id>', methods=['PUT'])
@jwt_required()
def update_device_type(type_id):
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    device_type = DeviceType.query.get_or_404(type_id)
    data = request.get_json()

    name = data.get('name')
    if name:
        existing_type = DeviceType.query.filter(DeviceType.name == name, DeviceType.id != type_id).first()
        if existing_type:
            return jsonify({"msg": "Another device type with this name already exists"}), 400
        device_type.name = name

    # Allows setting default_icon_path to null or empty string by providing the key
    if 'default_icon_path' in data:
        device_type.default_icon_path = data.get('default_icon_path')

    db.session.commit()
    return jsonify({"id": device_type.id, "name": device_type.name, "default_icon_path": device_type.default_icon_path}), 200

@admin_bp.route('/device-types/<int:type_id>', methods=['DELETE'])
@jwt_required()
def delete_device_type(type_id):
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    device_type = DeviceType.query.get_or_404(type_id)

    # Check if any DeviceConfig is using this DeviceType
    if DeviceConfig.query.filter_by(device_type_id=type_id).first():
        return jsonify({"msg": "Cannot delete: Device type is in use by one or more device configurations."}), 409

    db.session.delete(device_type)
    db.session.commit()
    return '', 204

# --- DeviceConfig Routes ---
@admin_bp.route('/device-configs', methods=['GET'])
@jwt_required()
def get_device_configs():
    # No admin check, allow authenticated users to see configs for lab building
    configs = DeviceConfig.query.all()
    results = []
    for cfg in configs:
        # Eager load or ensure device_type is accessible
        device_type_name = cfg.device_type.name if cfg.device_type else "Unknown"
        icon_path = cfg.default_icon_path or (cfg.device_type.default_icon_path if cfg.device_type else None)
        results.append({
            "id": cfg.id,
            "name": cfg.name,
            "device_type_id": cfg.device_type_id,
            "device_type_name": device_type_name,
            "hostname_ip": cfg.hostname_ip,
            "default_icon_path": icon_path,
            "notes": cfg.notes
        })
    return jsonify(results), 200

@admin_bp.route('/device-configs', methods=['POST'])
@jwt_required()
def create_device_config():
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    data = request.get_json()
    name = data.get('name')
    device_type_id = data.get('device_type_id')
    hostname_ip = data.get('hostname_ip')
    notes = data.get('notes')
    default_icon_path = data.get('default_icon_path')

    if not all([name, device_type_id, hostname_ip]):
        return jsonify({"msg": "Missing required fields (name, device_type_id, hostname_ip)"}), 400

    device_type = DeviceType.query.get(device_type_id)
    if not device_type:
        return jsonify({"msg": "Invalid device_type_id"}), 400

    if DeviceConfig.query.filter_by(name=name).first():
        return jsonify({"msg": "Device config with this name already exists"}), 400

    claims = get_jwt()
    current_user_id = claims["sub"] # "sub" is the standard claim for user ID in JWT

    new_config = DeviceConfig(
        name=name,
        device_type_id=device_type_id,
        hostname_ip=hostname_ip,
        notes=notes,
        default_icon_path=default_icon_path,
        created_by_id=current_user_id
    )
    db.session.add(new_config)
    db.session.commit()

    icon_path = new_config.default_icon_path or (device_type.default_icon_path if device_type else None)
    return jsonify({
        "id": new_config.id,
        "name": new_config.name,
        "device_type_id": new_config.device_type_id,
        "device_type_name": device_type.name,
        "hostname_ip": new_config.hostname_ip,
        "default_icon_path": icon_path,
        "notes": new_config.notes
    }), 201

@admin_bp.route('/device-configs/<int:config_id>', methods=['GET'])
@jwt_required()
def get_device_config_detail(config_id):
    config = DeviceConfig.query.get_or_404(config_id)
    device_type_name = config.device_type.name if config.device_type else "Unknown"
    icon_path = config.default_icon_path or (config.device_type.default_icon_path if config.device_type else None)
    return jsonify({
        "id": config.id,
        "name": config.name,
        "device_type_id": config.device_type_id,
        "device_type_name": device_type_name,
        "hostname_ip": config.hostname_ip,
        "default_icon_path": icon_path,
        "notes": config.notes
    }), 200

@admin_bp.route('/device-configs/<int:config_id>', methods=['PUT'])
@jwt_required()
def update_device_config(config_id):
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    config = DeviceConfig.query.get_or_404(config_id)
    data = request.get_json()

    config.name = data.get('name', config.name)
    config.device_type_id = data.get('device_type_id', config.device_type_id)
    config.hostname_ip = data.get('hostname_ip', config.hostname_ip)
    config.notes = data.get('notes', config.notes)
    # Allow clearing the custom icon path by sending null or empty string
    if 'default_icon_path' in data:
        config.default_icon_path = data.get('default_icon_path')


    device_type = DeviceType.query.get(config.device_type_id)
    if not device_type:
        return jsonify({"msg": "Invalid device_type_id"}), 400

    existing_config_name = DeviceConfig.query.filter(DeviceConfig.name == config.name, DeviceConfig.id != config_id).first()
    if existing_config_name:
        return jsonify({"msg": "Another device config with this name already exists"}), 400

    db.session.commit()

    updated_icon_path = config.default_icon_path or (device_type.default_icon_path if device_type else None)
    return jsonify({
        "id": config.id,
        "name": config.name,
        "device_type_id": config.device_type_id,
        "device_type_name": device_type.name,
        "hostname_ip": config.hostname_ip,
        "default_icon_path": updated_icon_path,
        "notes": config.notes
    }), 200

@admin_bp.route('/device-configs/<int:config_id>', methods=['DELETE'])
@jwt_required()
def delete_device_config(config_id):
    if not check_admin():
        return jsonify({"msg": "Administration rights required"}), 403

    config = DeviceConfig.query.get_or_404(config_id)

    # Check if this config is used in any lab instances
    if config.lab_instances: # Assumes lab_instances relationship is defined in DeviceConfig model
        return jsonify({"msg": "Cannot delete: Device configuration is used in one or more lab topologies."}), 409

    db.session.delete(config)
    db.session.commit()
    return '', 204
