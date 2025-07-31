# OCPP Frontend

A modern Vue.js frontend for managing an OCPP-based Central System backend.

## Project Overview

This project is a Vue 3 application that provides a user interface for managing electric vehicle charging stations through an OCPP Central System backend. It includes features for managing charge points, charging profiles, and tariffs.

## Technology Stack

- **Frontend Framework**: Vue 3 (Composition API) with Vuetify
- **State Management**: Pinia
- **Router**: Vue Router (with role-based guards)
- **HTTP Client**: Axios
- **Authentication**: JWT
- **Containerization**: Docker (Nginx)

## Project Structure

```
ocpp-frontend/
├── src/                    # Source code
│   ├── assets/             # Static assets
│   ├── components/         # Reusable Vue components
│   ├── router/             # Vue Router configuration
│   ├── stores/             # Pinia stores
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   └── main.js             # Application entry point
├── public/                 # Public static assets
├── .github/                # GitHub Actions workflows
├── Dockerfile              # Docker configuration
├── nginx.conf              # Nginx configuration for Docker
└── package.json            # Project dependencies and scripts
```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 8 or higher

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run serve
```

The application will be available at http://localhost:8080.

## Building for Production

```bash
# Build for production
npm run build
```

The built files will be in the `dist/` directory.

## Docker Deployment

This project can be deployed as a Docker container:

```bash
# Build the Docker image
docker build -t ocpp-frontend .

# Run the container
docker run -p 80:80 ocpp-frontend
```

The application will be available at http://localhost.

## Features

### Current Implementation

- **Authentication**: Login/logout with JWT
- **Dashboard**: Overview of charging network performance
- **Charge Points**: Management of charging stations
- **Charging Profiles**: Configuration of charging schedules
- **Tariff Management**: Setting up pricing structures

### Note

This is a placeholder implementation with static data. The actual API integration will be implemented in future versions.

## License

Proprietary - eh-systemhaus e.K.