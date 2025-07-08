import pytest
from flask import jsonify # Not typically needed in tests directly, but good for knowing structure
from app.models import User

def test_register_user(client, db_session):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'password': 'newpassword'
    })
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['msg'] == 'User registered successfully'
    assert json_data['user']['username'] == 'newuser'

    # Verify user in database
    user = User.query.filter_by(username='newuser').first()
    assert user is not None
    assert not user.is_admin # Default should not be admin unless it's the very first user

def test_register_existing_user(client, db_session):
    """Test registration with an existing username."""
    # First, register a user (or use one from conftest like testuser)
    client.post('/api/auth/register', json={'username': 'existinguser', 'password': 'password'})

    # Try to register again with the same username
    response = client.post('/api/auth/register', json={
        'username': 'existinguser',
        'password': 'newpassword'
    })
    assert response.status_code == 400
    json_data = response.get_json()
    assert json_data['msg'] == 'Username already exists'

def test_register_missing_fields(client):
    """Test registration with missing username or password."""
    response = client.post('/api/auth/register', json={'username': 'nouser'})
    assert response.status_code == 400 # Assuming your backend validation catches this
    assert 'Username and password are required' in response.get_json()['msg']

    response = client.post('/api/auth/register', json={'password': 'nopassword'})
    assert response.status_code == 400
    assert 'Username and password are required' in response.get_json()['msg']

def test_login_successful(client, regular_user_token): # regular_user_token fixture implicitly tests login
    """Test successful login."""
    # The regular_user_token fixture already performs a login for 'testuser'.
    # We can just assert it's not None if we want to be explicit, but the fixture handles failure.
    assert regular_user_token is not None

    # Optionally, make another login call here to verify response structure
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'access_token' in json_data
    assert json_data['user']['username'] == 'testuser'
    assert json_data['user']['is_admin'] == False

def test_login_admin_successful(client, admin_user_token):
    """Test successful admin login."""
    assert admin_user_token is not None
    response = client.post('/api/auth/login', json={
        'username': 'testadmin',
        'password': 'password'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'access_token' in json_data
    assert json_data['user']['username'] == 'testadmin'
    assert json_data['user']['is_admin'] == True


def test_login_invalid_username(client):
    """Test login with a non-existent username."""
    response = client.post('/api/auth/login', json={
        'username': 'nonexistentuser',
        'password': 'password'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['msg'] == 'Invalid username or password'

def test_login_invalid_password(client):
    """Test login with an incorrect password."""
    response = client.post('/api/auth/login', json={
        'username': 'testuser', # User created in conftest
        'password': 'wrongpassword'
    })
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['msg'] == 'Invalid username or password'

def test_get_me_regular_user(client, regular_user_token):
    """Test the /me endpoint for a regular authenticated user."""
    response = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {regular_user_token}'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['username'] == 'testuser'
    assert json_data['is_admin'] == False

def test_get_me_admin_user(client, admin_user_token):
    """Test the /me endpoint for an admin authenticated user."""
    response = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {admin_user_token}'
    })
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['username'] == 'testadmin'
    assert json_data['is_admin'] == True

def test_get_me_unauthenticated(client):
    """Test the /me endpoint without authentication."""
    response = client.get('/api/auth/me')
    assert response.status_code == 401 # Expecting @jwt_required

def test_logout(client, regular_user_token):
    """Test the logout endpoint."""
    # First, ensure user is "logged in" (token is valid)
    me_response_before_logout = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {regular_user_token}'
    })
    assert me_response_before_logout.status_code == 200

    # Perform logout
    logout_response = client.post('/api/auth/logout', headers={
        'Authorization': f'Bearer {regular_user_token}'
    })
    assert logout_response.status_code == 200
    assert logout_response.get_json()['msg'] == 'Successfully logged out'

    # Try accessing a protected route again; it should fail
    me_response_after_logout = client.get('/api/auth/me', headers={
        'Authorization': f'Bearer {regular_user_token}' # Using the same (now blocklisted) token
    })
    # This depends on whether your JWT blocklist is effective immediately and for this test setup.
    # If using a simple set() for blocklist, this should work.
    assert me_response_after_logout.status_code == 401 # Token should be invalid/blocklisted
    # The specific error message might be 'Token has been revoked' or similar depending on JWTManager config
    # For this test, 401 is sufficient to indicate the token is no longer valid for access.
    assert "Token has been revoked" in me_response_after_logout.get_json().get("msg", "") or \
           "Invalid token" in me_response_after_logout.get_json().get("msg", "") # Adjust based on actual error
