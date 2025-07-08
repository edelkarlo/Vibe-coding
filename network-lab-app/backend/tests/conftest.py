import pytest
import os
from app import create_app, db
from app.models import User, DeviceType # Import models that might be needed for setup

# Use a specific testing configuration
# This should ideally be the first thing set before 'create_app' is called anywhere.
# Pytest runs conftest.py before collecting tests from other files.
os.environ['FLASK_CONFIG'] = 'testing'
# Ensure this is effective if create_app is called implicitly elsewhere or if run.py is imported early.

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask app."""

    # Create an app instance using the 'testing' configuration
    # The TestingConfig in config.py should specify an appropriate test database URI
    # e.g., SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:" or a dedicated test PostgreSQL DB.
    # For simplicity and to avoid external DB dependency in basic tests,
    # let's assume TestingConfig uses an in-memory SQLite database.
    # If it uses PostgreSQL, the DB server must be running for tests.

    # To ensure SQLite in-memory for this test session if not default in TestingConfig:
    # You could pass a dictionary of config overrides if your create_app supports it:
    # test_config_overrides = {
    #     'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
    #     'TESTING': True,
    #     'WTF_CSRF_ENABLED': False, # Common for tests
    #     'JWT_SECRET_KEY': 'test-super-secret-jwt-key-for-testing'
    # }
    # app_instance = create_app(config_name='testing', **test_config_overrides)
    # For now, relying on TestingConfig in config.py:
    app_instance = create_app(config_name='testing')


    with app_instance.app_context():
        db.create_all() # Create all tables

        # Seed initial data
        if DeviceType.query.count() == 0:
            dt_router = DeviceType(name="Router", default_icon_path="icons/router.svg")
            dt_switch = DeviceType(name="Switch", default_icon_path="icons/switch.svg")
            db.session.add_all([dt_router, dt_switch])
            db.session.commit()

        # Create test users if they don't exist
        test_users = {
            "testadmin": {"password": "password", "is_admin": True},
            "testuser": {"password": "password", "is_admin": False}
        }
        for username, details in test_users.items():
            if User.query.filter_by(username=username).first() is None:
                user = User(username=username, is_admin=details["is_admin"])
                user.set_password(details["password"])
                db.session.add(user)
        db.session.commit()

    yield app_instance

    # Teardown: runs after all tests in the session are complete
    with app_instance.app_context():
        db.session.remove()
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """A test client for the Flask app. Function scope for test isolation."""
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    """
    Provides a database session for tests. Rolls back changes after each test.
    This ensures test isolation for database operations.
    """
    with app.app_context():
        # db.session.begin_nested() # Alternative: use nested transactions
        yield db.session
        db.session.rollback() # Rollback any changes made during the test
        # db.session.remove() # Ensure session is closed, good practice

# Helper function to log in a user and get a token
def get_auth_token(client, username, password):
    response = client.post('/api/auth/login', json={'username': username, 'password': password})
    if response.status_code == 200:
        return response.get_json()['access_token']
    print(f"Failed to get token for {username}: {response.status_code} - {response.data.decode()}")
    return None

@pytest.fixture(scope='function')
def regular_user_token(client):
    """Provides an auth token for a regular test user."""
    token = get_auth_token(client, "testuser", "password")
    if not token:
        pytest.fail("Failed to retrieve token for regular_user (testuser). Check user creation and login.")
    return token

@pytest.fixture(scope='function')
def admin_user_token(client):
    """Provides an auth token for an admin test user."""
    token = get_auth_token(client, "testadmin", "password")
    if not token:
        pytest.fail("Failed to retrieve token for admin_user (testadmin). Check user creation and login.")
    return token
