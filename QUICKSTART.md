# Quick Start Guide - VirtualBox Deployment

This guide helps you quickly deploy the OCPP Frontend on a Debian VirtualBox with your backend.

## 🚀 Option 1: Automated Deployment

### Prerequisites

- Debian 10+ or Ubuntu 18.04+ VirtualBox
- Internet connection
- Backend running on accessible host

### Quick Deploy

```bash
# 1. Download the deployment script
wget https://raw.githubusercontent.com/your-org/ocpp-frontend/main/deploy-vbox.sh
chmod +x deploy-vbox.sh

# 2. Run deployment (replace with your backend URL)
export VUE_APP_API_BASE_URL=https://your-backend-server/api/v1
export VUE_APP_API_LOGIN_ENDPOINT=/auth/login
export VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
export VUE_APP_API_ME_ENDPOINT=/auth/me
export NODE_ENV=development
./deploy-vbox.sh
```

## 🐳 Option 2: Manual Docker Commands

### Step 1: Install Docker (if not installed)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Restart session or reboot
sudo reboot
```

### Step 2: Deploy Frontend

```bash
# Stop any existing container
docker stop ocpp-frontend 2>/dev/null || true
docker rm ocpp-frontend 2>/dev/null || true

# Pull and run the latest image
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VUE_APP_API_BASE_URL=https://your-backend-server/api/v1 \
  -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login \
  -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout \
  -e VUE_APP_API_ME_ENDPOINT=/auth/me \
  -e NODE_ENV=development \
  docker.io/ocpp-frontend:latest
```

### Step 3: Verify Deployment

```bash
# Check container status
docker ps

# View logs
docker logs ocpp-frontend

# Test access
curl http://localhost:8080
```

## 📋 Option 3: Docker Compose (Recommended)

### Step 1: Download Configuration

```bash
# Create project directory
mkdir ocpp-frontend && cd ocpp-frontend

# Download configuration files
wget https://raw.githubusercontent.com/your-org/ocpp-frontend/main/docker-compose.yml
wget https://raw.githubusercontent.com/your-org/ocpp-frontend/main/.env.example

# Copy and edit environment file
cp .env.example .env
nano .env
```

### Step 2: Update Configuration

Edit `.env` file with your settings:

```bash
# Frontend Configuration
FRONTEND_PORT=8080

# Backend Configuration (UPDATE THESE!)
VUE_APP_API_BASE_URL=https://your-backend-server/api/v1
VUE_APP_API_LOGIN_ENDPOINT=/auth/login
VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
VUE_APP_API_ME_ENDPOINT=/auth/me

# Application Settings
NODE_ENV=development
```

### Step 3: Deploy

```bash
# Start the application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔧 Configuration Examples

### Example 1: Backend on Same VirtualBox

```bash
# If backend runs on same machine
VUE_APP_API_BASE_URL=https://localhost/api/v1
VUE_APP_API_LOGIN_ENDPOINT=/auth/login
VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
VUE_APP_API_ME_ENDPOINT=/auth/me
```

### Example 2: Backend on Different Server

```bash
# If backend runs on different machine
VUE_APP_API_BASE_URL=https://your-backend-server/api/v1
VUE_APP_API_LOGIN_ENDPOINT=/auth/login
VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout
VUE_APP_API_ME_ENDPOINT=/auth/me
```

### Example 3: Custom Port

```bash
# If you want frontend on different port
FRONTEND_PORT=9090

# Then access via: http://your-vbox-ip:9090
```

## 📱 Access Your Application

After successful deployment:

1. **Local Access**: http://localhost:8080
2. **Network Access**: http://YOUR_VBOX_IP:8080
3. **Find VirtualBox IP**: `hostname -I | awk '{print $1}'`

## 🛠 Management Commands

### Container Management

```bash
# View container status
docker ps

# Stop frontend
docker stop ocpp-frontend

# Start frontend
docker start ocpp-frontend

# Restart frontend
docker restart ocpp-frontend

# Remove container
docker rm -f ocpp-frontend

# View logs
docker logs -f ocpp-frontend
```

### Update to Latest Version

```bash
# Pull latest image
docker pull docker.io/ocpp-frontend:latest

# Stop and remove old container
docker stop ocpp-frontend
docker rm ocpp-frontend

# Start new container (same command as deployment)
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VUE_APP_API_BASE_URL=https://your-backend-server/api/v1 \
  -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login \
  -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout \
  -e VUE_APP_API_ME_ENDPOINT=/auth/me \
  docker.io/ocpp-frontend:latest
```

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Check what's using port 8080
sudo netstat -tulpn | grep :8080

# Use different port
docker run -p 9090:80 ... # Use port 9090 instead
```

### Can't Connect to Backend

```bash
# Test backend connectivity from VirtualBox
curl http://YOUR_BACKEND_IP:8000/api/health

# Check if backend allows connections from your VirtualBox IP
# Update backend CORS settings if needed
```

### Container Won't Start

```bash
# Check Docker service
sudo systemctl status docker

# Check container logs
docker logs ocpp-frontend

# Check available disk space
df -h
```

### Permission Issues

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Restart session
exit
# Log back in
```

## 🔒 Security Considerations

### Firewall Setup

```bash
# Allow frontend port
sudo ufw allow 8080/tcp

# Allow SSH (recommended)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable
```

### Production Security

```bash
# Run with limited resources
docker run -d \
  --name ocpp-frontend \
  --memory="512m" \
  --cpus="0.5" \
  --restart unless-stopped \
  -p 8080:80 \
  docker.io/ocpp-frontend:latest
```

## 📞 Support

If you encounter issues:

1. Check the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide
2. Review container logs: `docker logs ocpp-frontend`
3. Verify backend connectivity
4. Check VirtualBox network settings
5. Ensure proper environment variables

**Access URL**: Once deployed, access your application at `http://YOUR_VBOX_IP:8080`
