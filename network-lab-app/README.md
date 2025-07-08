# Network Lab Web Application

## Overview

Network Lab is a web application designed to provide a GNS3-like experience for network engineers and students. It allows users to visually design network topologies using icons for routers, switches, firewalls, and servers. Users can connect these devices and, by clicking on a device icon, launch an SSH session to interact with the (simulated or real) device. The application features user authentication and an admin interface for managing device types and configurations.

## Features

*   **Visual Network Topology Editor:**
    *   Drag-and-drop interface for adding devices to a canvas.
    *   Device palette with configurable device types (Routers, Switches, Firewalls, Servers).
    *   Ability to draw connections between devices.
    *   Customizable icons for devices.
*   **SSH Integration:**
    *   Click on a device instance on the canvas to launch an SSH session.
    *   Utilizes `ssh://` URL protocol handlers, requiring client-side OS configuration (e.g., for Putty, SecureCRT, or system SSH).
*   **User Authentication:**
    *   User registration and login system.
    *   JWT-based authentication for API security.
*   **Admin Panel:**
    *   Manage available Device Types (e.g., "Cisco IOS Router", "Linux Server").
    *   Manage specific Device Configurations (e.g., "CoreRouter1" with IP `10.0.0.1`, using "Cisco IOS Router" type).
*   **Topology Management:**
    *   Save created lab topologies to the backend.
    *   Load saved lab topologies for further editing or viewing.

## Technology Stack

*   **Backend:**
    *   Framework: Flask (Python)
    *   Database: PostgreSQL
    *   ORM: SQLAlchemy with Flask-SQLAlchemy
    *   Migrations: Flask-Migrate (Alembic)
    *   Authentication: JWT (Flask-JWT-Extended)
    *   API: RESTful
*   **Frontend:**
    *   Framework: React (with TypeScript) bootstrapped with Vite
    *   Diagramming: React Flow
    *   State Management: React Context API (for Auth)
    *   API Calls: Axios
    *   Routing: React Router DOM
*   **Development Environment:**
    *   Python Virtual Environment for backend.
    *   Node.js/npm for frontend.

## Project Structure

```
network-lab-app/
├── backend/
│   ├── app/                # Main Flask application package
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── routes/         # API Blueprints (auth, admin, lab)
│   │   ├── __init__.py     # App factory (create_app)
│   │   └── ...
│   ├── migrations/         # Flask-Migrate scripts
│   ├── tests/              # Pytest unit tests
│   ├── venv/               # Python virtual environment (ignored)
│   ├── .flaskenv           # Env vars for Flask CLI
│   ├── config.py           # Configuration classes
│   ├── requirements.txt    # Python dependencies
│   └── run.py              # Flask development server runner
├── frontend/
│   ├── public/             # Static assets (icons, etc.)
│   ├── src/                # React application source
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Contexts (e.g., AuthContext)
│   │   ├── pages/          # Page-level components
│   │   ├── services/       # API service functions
│   │   ├── App.tsx         # Main app component with routing
│   │   ├── main.tsx        # Entry point (renders App)
│   │   └── vite.config.ts  # Vite configuration (proxy, etc.)
│   ├── build/              # Production build output (Vite default is 'dist', ensure .gitignore)
│   ├── node_modules/       # Node.js dependencies (ignored)
│   └── package.json        # Frontend dependencies and scripts
├── .gitignore
└── README.md               # This file
```

## Getting Started

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for setup, installation, and development instructions.
See [USER_GUIDE.md](USER_GUIDE.md) for instructions on how to use the application.

## Contributing

(Details about contributing to the project would go here if applicable - e.g., coding standards, pull request process).

## License

(Specify a license if applicable, e.g., MIT, Apache 2.0).
For now, assume proprietary or specify as per user's requirement.
```
