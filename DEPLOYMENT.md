# OCPP Frontend - Deployment Guide

This document provides comprehensive instructions for deploying the OCPP Frontend as a Docker container, specifically for Debian-based VirtualBox environments with the OCPP backend.

## Table of Contents

1. [CI/CD Pipeline Overview](#cicd-pipeline-overview)
2. [Prerequisites](#prerequisites)
3. [VirtualBox Deployment Setup](#virtualbox-deployment-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running with Backend](#running-with-backend)
6. [Docker Management](#docker-management)
7. [Troubleshooting](#troubleshooting)

## CI/CD Pipeline Overview

The current CI/CD pipeline for the OCPP Frontend follows these steps:

### 1. Code Commit Workflow

```
Developer → GitHub Repository → GitHub Actions → Docker Registry → Production Deployment
```

### 2. Pipeline Stages

#### Stage 1: Source Code Management

- **Trigger**: Push to `main` branch or Pull Request
- **Actions**: Code checkout from GitHub repository

#### Stage 2: Environment Setup

- **Node.js Setup**: Install Node.js 18.x
- **Dependencies**: Install npm packages via `npm ci`

#### Stage 3: Build Process

- **Linting**: Code quality checks (optional in production)
- **Type Checking**: TypeScript validation (optional in production)
- **Build**: Create production build using `npm run build`
- **Optimization**: Minify and optimize assets

#### Stage 4: Docker Image Creation

- **Base Image**: Node.js 18 Alpine for build stage
- **Build Stage**: Compile Vue.js application
- **Production Stage**: Nginx Alpine for serving static files
- **Image Tagging**: Tag with commit SHA and latest

#### Stage 5: Registry Push

- **Docker Registry**: Push image to container registry
- **Versioning**: Multiple tags (latest, version, commit SHA)

#### Stage 6: Deployment

- **Pull Image**: Download latest image on target server
- **Container Update**: Replace running container with new version
- **Health Check**: Verify deployment success

## Prerequisites

### System Requirements

- **OS**: Debian 10+ or Ubuntu 18.04+
- **Docker**: Version 20.04+
- **Docker Compose**: Version 1.25+ (optional but recommended)
- **Memory**: Minimum 2GB RAM
- **Storage**: At least 5GB free space

### Network Requirements

- **Frontend Port**: 8080 (default) or configurable
- **Backend Access**: Network connectivity to OCPP backend
- **Internet Access**: Required for Docker image pulls

## VirtualBox Deployment Setup

### Step 1: Prepare VirtualBox Environment

1. **Update System Packages**

```bash
sudo apt update && sudo apt upgrade -y
```

2. **Install Docker**

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker-compose --version
```

3. **Configure Docker Service**

```bash
# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Test Docker installation
docker run hello-world
```

### Step 2: Download and Run Frontend Image

#### Option A: Using Pre-built Image (Recommended)

```bash
# Pull the latest frontend image
docker pull your-registry/ocpp-frontend:latest

# Run the frontend container
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VUE_APP_API_BASE_URL=https://localhost:5401/fleet/ocpp/v1 \
  -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login \
  -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout \
  -e VUE_APP_API_ME_ENDPOINT=/auth/me \
  -e NODE_ENV=development \
  your-registry/ocpp-frontend:latest
```

#### Option B: Build from Source

```bash
# Clone repository
git clone https://github.com/your-org/ocpp-frontend.git
cd ocpp-frontend

# Build Docker image
docker build -t ocpp-frontend:local .

# Run the container
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VUE_APP_API_BASE_URL=https://localhost:5401/fleet/ocpp/v1 \
  -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login \
  -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout \
  -e VUE_APP_API_ME_ENDPOINT=/auth/me \
  -e NODE_ENV=development \
  ocpp-frontend:local
```

### Step 3: Verify Installation

```bash
# Check container status
docker ps

# View container logs
docker logs ocpp-frontend

# Test frontend access
curl http://localhost:8080
```

## Environment Configuration

### Environment Variables

Create an environment file for easy configuration:

```bash
# Create .env file
cat > .env << EOF
# API Configuration
VUE_APP_API_BASE_URL=https://your-backend-server/api/v1
VUE_APP_API_LOGIN_ENDPOINT=/auth/login
VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
VUE_APP_API_ME_ENDPOINT=/auth/me

# Build Configuration
NODE_ENV=development
EOF
```

### Docker Compose Setup (Recommended)

Create a `docker-compose.yml` file for easier management:

```bash
cat > docker-compose.yml << EOF
version: '3.8'

services:
  ocpp-frontend:
    image: your-registry/ocpp-frontend:latest
    container_name: ocpp-frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    environment:
      - VUE_APP_API_BASE_URL=https://your-backend-server/api/v1
      - VUE_APP_API_LOGIN_ENDPOINT=/auth/login
      - VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
      - VUE_APP_API_ME_ENDPOINT=/auth/me
      - NODE_ENV=development
    networks:
      - ocpp-network
    depends_on:
      - ocpp-backend

  # Add backend service if running both on same host
  ocpp-backend:
    image: your-registry/ocpp-backend:latest
    container_name: ocpp-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ocpp
    networks:
      - ocpp-network

networks:
  ocpp-network:
    driver: bridge
EOF
```

## Running with Backend

### Scenario 1: Backend on Same VirtualBox

```bash
# Start both services
docker-compose up -d

# Verify both containers are running
docker-compose ps

# View logs
docker-compose logs -f ocpp-frontend
docker-compose logs -f ocpp-backend
```

### Scenario 2: Backend on Different Server

```bash
# Update environment variables
export BACKEND_IP=192.168.1.100
export BACKEND_PORT=8000

# Run frontend with backend connection
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VUE_APP_API_BASE_URL=https://${BACKEND_IP}:5401/fleet/ocpp/v1 \
  -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login \
  -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout \
  -e VUE_APP_API_ME_ENDPOINT=/auth/me \
  -e NODE_ENV=development \
  your-registry/ocpp-frontend:latest
```

### Scenario 3: Production Setup with Reverse Proxy

```bash
# Create nginx proxy configuration
mkdir -p /etc/nginx/sites-available
cat > /etc/nginx/sites-available/ocpp << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /api {
        proxy_pass http://backend-server:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/ocpp /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Docker Management

### Common Commands

```bash
# View running containers
docker ps

# Stop frontend
docker stop ocpp-frontend

# Start frontend
docker start ocpp-frontend

# Restart frontend
docker restart ocpp-frontend

# Remove container
docker rm ocpp-frontend

# View logs
docker logs -f ocpp-frontend

# Execute shell in container
docker exec -it ocpp-frontend sh

# Update to latest image
docker pull your-registry/ocpp-frontend:latest
docker stop ocpp-frontend
docker rm ocpp-frontend
# Run new container with updated image
```

### Image Management

```bash
# List images
docker images

# Remove old images
docker image prune -a

# Tag image
docker tag ocpp-frontend:latest your-registry/ocpp-frontend:v1.0.0

# Push image
docker push your-registry/ocpp-frontend:v1.0.0
```

### System Cleanup

```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete system cleanup
docker system prune -a
```

## Troubleshooting

### Container Won't Start

```bash
# Check container logs
docker logs ocpp-frontend

# Common issues:
# 1. Port already in use
sudo netstat -tulpn | grep :8080

# 2. Image not found
docker images | grep ocpp-frontend

# 3. Environment variable issues
docker exec ocpp-frontend env
```

### Frontend Can't Connect to Backend

```bash
# Test backend connectivity from container
docker exec ocpp-frontend wget -q --spider http://backend-ip:8000/health

# Check network connectivity
docker network ls
docker inspect ocpp-network

# Verify environment variables
docker exec ocpp-frontend printenv | grep VITE_
```

### Performance Issues

```bash
# Check container resource usage
docker stats ocpp-frontend

# Check system resources
htop
df -h

# Optimize nginx configuration
docker exec ocpp-frontend cat /etc/nginx/conf.d/default.conf
```

### SSL/HTTPS Setup

```bash
# Install certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Update nginx configuration for HTTPS
sudo nginx -t && sudo systemctl reload nginx
```

## Security Considerations

### Container Security

```bash
# Run container with non-root user
docker run -d \
  --name ocpp-frontend \
  --user 1000:1000 \
  --restart unless-stopped \
  -p 8080:80 \
  your-registry/ocpp-frontend:latest

# Limit container resources
docker run -d \
  --name ocpp-frontend \
  --memory="512m" \
  --cpus="0.5" \
  --restart unless-stopped \
  -p 8080:80 \
  your-registry/ocpp-frontend:latest
```

### Network Security

```bash
# Create custom network
docker network create --driver bridge ocpp-secure-network

# Run containers in custom network
docker run -d \
  --name ocpp-frontend \
  --network ocpp-secure-network \
  --restart unless-stopped \
  -p 8080:80 \
  your-registry/ocpp-frontend:latest
```

### Firewall Configuration

```bash
# Allow only required ports
sudo ufw allow 8080/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# Check firewall status
sudo ufw status
```

## Monitoring and Logging

### Log Management

```bash
# Configure log rotation
sudo vim /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker service
sudo systemctl restart docker
```

### Health Monitoring

```bash
# Add health check to docker-compose.yml
services:
  ocpp-frontend:
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

## Backup and Recovery

### Backup Strategy

```bash
# Backup configuration files
tar -czf ocpp-frontend-config-$(date +%Y%m%d).tar.gz \
  docker-compose.yml .env nginx.conf

# Backup Docker volumes (if any)
docker run --rm -v /var/lib/docker/volumes:/backup \
  alpine tar -czf /backup/ocpp-volumes-$(date +%Y%m%d).tar.gz .
```

### Recovery Process

```bash
# Restore configuration
tar -xzf ocpp-frontend-config-YYYYMMDD.tar.gz

# Restart services
docker-compose down
docker-compose up -d
```

This deployment guide provides a complete reference for setting up and managing the OCPP Frontend in a Docker environment on VirtualBox with Debian Linux.
