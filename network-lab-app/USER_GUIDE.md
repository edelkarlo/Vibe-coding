# Network Lab Web Application - User Guide

Welcome to the Network Lab Web Application! This guide will help you understand how to use its features.

## 1. Introduction

This application allows you to create, visualize, and manage network topologies. You can add devices like routers, switches, firewalls, and servers to a canvas, connect them, and (if configured) launch SSH sessions to interact with them.

## 2. Getting Started

### 2.1. Registration
- If you are a new user, navigate to the **Register** page (usually linked from the Login page or top navigation).
- Enter your desired username and a secure password. Confirm your password.
- Click "Register". If successful, you will be prompted to log in.

### 2.2. Login
- Navigate to the **Login** page.
- Enter your registered username and password.
- Click "Login". Upon successful login, you will be redirected to the application's main page (Homepage or Lab Editor).

### 2.3. SSH Client Configuration (Important for SSH Feature)
- To launch SSH sessions by clicking devices on the lab canvas, your operating system needs to be configured to handle `ssh://` URL protocols.
- **Windows:**
    - You can configure Putty or SecureCRT to be the default handler for `ssh://` URLs.
    - **Putty:** Requires registry edits. Search for "putty ssh url handler windows".
    - **SecureCRT:** Often registers itself during installation, or can be configured via its settings.
- **macOS/Linux:**
    - Your system's default terminal and SSH client usually handle `ssh://` URLs correctly by default.
    - If not, you may need to configure your default browser or desktop environment settings.

## 3. Main Interface

Once logged in, you'll typically see:
- **Navbar:** At the top, with links to "Network Lab" (Homepage), "Lab Editor", your username, and "Logout". Admin users will also see an "(Admin Panel)" link.
- **Homepage:** A welcome page.
- **Lab Editor:** The main workspace for creating and managing network labs.

## 4. Using the Lab Editor (`/lab/editor`)

The Lab Editor is where you build your network topologies.

### 4.1. Managing Lab Topologies
- **New Lab:** Click the "New Lab" button. You'll be prompted to enter a name for your new lab. The canvas will then be cleared for you to start building.
- **Load Lab:**
    - Click the "Load Lab" button. A dialog or list will appear showing your saved labs.
    - Click the "Load" button next to the desired lab. The canvas will be populated with that lab's devices and connections.
- **Save Lab:**
    - After making changes to a lab (adding/moving devices, connecting them), click the "Save Lab" button. This will save the current state of the active lab.
    - *Note:* You must have a lab loaded or have created a new one (which assigns it an ID) to save. If it's an "Untitled Lab", you might be prompted to save it as a new lab first (functionality may vary).

### 4.2. Device Palette
- Located on the left side of the Lab Editor.
- It lists all available "Device Configurations" (e.g., "CoreRouter1", "WebServerVM") that have been set up by an administrator.
- Each item shows an icon and the device configuration name.

### 4.3. Building Your Topology
- **Adding Devices:** Drag a device from the Device Palette and drop it onto the main canvas area. A visual representation (node) of that device will appear.
- **Moving Devices:** Click and drag any device node on the canvas to reposition it.
- **Connecting Devices:**
    - Device nodes have connection points (handles), typically at the top, bottom, left, and right.
    - Click and drag from one device's handle to another device's handle to draw a connection (edge) between them.
- **Launching SSH:**
    - Click on a device node on the canvas.
    - A confirmation dialog will appear, showing the `ssh://<hostname_or_IP>` URL for that device (this IP is configured by the admin for that Device Configuration).
    - Click "OK" or "Confirm". Your browser will attempt to open this URL.
    - If your OS and an SSH client are correctly configured for `ssh://` URLs (see section 2.3), your SSH client should launch and attempt to connect to the device. You will then be prompted for credentials by the SSH client itself.

## 5. Admin Panel (`/admin` - For Admin Users Only)

If you are an administrator, you will have access to the Admin Panel.

### 5.1. Managing Device Types
- **View:** See a list of all existing device types (e.g., Router, Switch, Firewall, Server).
- **Add:** Create new device types by providing a name and an optional default SVG icon path (e.g., `icons/custom_type.svg`). Icons should be placed in the `frontend/public/icons/` directory by a developer.
- **Edit:** Modify the name or icon path of existing device types.
- **Delete:** Remove device types, but only if they are not currently used by any Device Configurations.

### 5.2. Managing Device Configurations
- **View:** See a list of all specific device configurations. This includes their name, associated device type, and the Hostname/IP address used for SSH.
- **Add:** Create new device configurations:
    - Give it a unique name (e.g., "BranchOfficeRouter2").
    - Select its Device Type from the dropdown.
    - Specify the Hostname or IP Address that will be used for the `ssh://` URL.
    - Optionally add a custom icon path (overrides the type's default) and notes.
- **Edit:** Modify details of existing device configurations.
- **Delete:** Remove device configurations, but only if they are not currently used in any saved lab topologies.

## 6. Troubleshooting

- **Cannot SSH:**
    - Ensure the Device Configuration for the device has the correct Hostname/IP address.
    - Verify your operating system and SSH client are configured to handle `ssh://` URLs (see section 2.3).
    - Ensure the target device is actually running and accessible on your network at that IP/hostname. The web app only *launches* the SSH client; it doesn't manage the devices themselves.
- **Login/Registration Issues:** Double-check your username and password. Ensure cookies are enabled in your browser.
- **Admin Features Not Visible:** Ensure you are logged in with an administrator account.

---
Enjoy using the Network Lab application!
```
