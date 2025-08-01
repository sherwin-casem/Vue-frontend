#!/bin/bash

# OCCP Frontend - VirtualBox Deployment Script
# This script automates the deployment of OCCP Frontend on Debian-based VirtualBox

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="docker.io/occp-frontend:latest"
CONTAINER_NAME="occp-frontend"
FRONTEND_PORT="${FRONTEND_PORT:-8080}"
API_URL="${VUE_APP_API_BASE_URL:-https://your-backend-server/api/v1}"
LOGIN_ENDPOINT="${VUE_APP_API_LOGIN_ENDPOINT:-/auth/login}"
LOGOUT_ENDPOINT="${VUE_APP_API_LOGOUT_ENDPOINT:-/auth/logout}"
ME_ENDPOINT="${VUE_APP_API_ME_ENDPOINT:-/auth/me}"
NODE_ENV="${NODE_ENV:-development}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Installing Docker..."
        install_docker
    else
        log_success "Docker is already installed"
        docker --version
    fi
}

install_docker() {
    log_info "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    log_success "Docker installed successfully"
    log_warning "Please log out and log back in for group changes to take effect"
}

check_port() {
    log_info "Checking if port $FRONTEND_PORT is available..."
    if netstat -tuln | grep -q ":$FRONTEND_PORT "; then
        log_error "Port $FRONTEND_PORT is already in use"
        read -p "Do you want to use a different port? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Enter new port number: " FRONTEND_PORT
            check_port
        else
            log_error "Cannot proceed with port $FRONTEND_PORT already in use"
            exit 1
        fi
    else
        log_success "Port $FRONTEND_PORT is available"
    fi
}

stop_existing_container() {
    log_info "Checking for existing container..."
    if docker ps -aq -f name=$CONTAINER_NAME | grep -q .; then
        log_warning "Stopping and removing existing container..."
        docker stop $CONTAINER_NAME 2>/dev/null || true
        docker rm $CONTAINER_NAME 2>/dev/null || true
        log_success "Existing container removed"
    fi
}

pull_image() {
    log_info "Pulling Docker image: $DOCKER_IMAGE"
    docker pull $DOCKER_IMAGE
    log_success "Image pulled successfully"
}

start_container() {
    log_info "Starting OCCP Frontend container..."
    
    docker run -d \
        --name $CONTAINER_NAME \
        --restart unless-stopped \
        -p $FRONTEND_PORT:80 \
        -e VUE_APP_API_BASE_URL="$API_URL" \
        -e VUE_APP_API_LOGIN_ENDPOINT="$LOGIN_ENDPOINT" \
        -e VUE_APP_API_LOGOUT_ENDPOINT="$LOGOUT_ENDPOINT" \
        -e VUE_APP_API_ME_ENDPOINT="$ME_ENDPOINT" \
        -e NODE_ENV="$NODE_ENV" \
        $DOCKER_IMAGE
    
    log_success "Container started successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for container to be ready
    sleep 10
    
    # Check container status
    if docker ps | grep -q $CONTAINER_NAME; then
        log_success "Container is running"
    else
        log_error "Container failed to start"
        docker logs $CONTAINER_NAME
        exit 1
    fi
    
    # Check if application is responding
    if curl -f -s "http://localhost:$FRONTEND_PORT" > /dev/null; then
        log_success "Application is responding"
    else
        log_warning "Application might not be ready yet, please check manually"
    fi
}

show_deployment_info() {
    echo
    echo "=================================================="
    log_success "OCCP Frontend Deployment Complete!"
    echo "=================================================="
    echo
    echo "🌐 Frontend URL: http://$(hostname -I | awk '{print $1}'):$FRONTEND_PORT"
    echo "🌐 Local URL: http://localhost:$FRONTEND_PORT"
    echo "🐳 Container Name: $CONTAINER_NAME"
    echo "📡 API URL: $API_URL"
    echo "🔑 Login Endpoint: $LOGIN_ENDPOINT"
    echo "🔑 Logout Endpoint: $LOGOUT_ENDPOINT"
    echo "🔑 Me Endpoint: $ME_ENDPOINT"
    echo "⚙️ Node Environment: $NODE_ENV"
    echo
    echo "📋 Management Commands:"
    echo "  View logs:        docker logs -f $CONTAINER_NAME"
    echo "  Stop container:   docker stop $CONTAINER_NAME"
    echo "  Start container:  docker start $CONTAINER_NAME"
    echo "  Remove container: docker rm -f $CONTAINER_NAME"
    echo
    echo "🔧 Configuration:"
    echo "  To update configuration, restart with new environment variables:"
    echo "  docker stop $CONTAINER_NAME && docker rm $CONTAINER_NAME"
    echo "  export VUE_APP_API_BASE_URL=https://your-backend-server/api/v1"
    echo "  ./deploy-vbox.sh"
    echo
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -p, --port PORT         Frontend port (default: 8080)"
    echo "  -a, --api-url URL       Backend API URL (default: https://your-backend-server/api/v1)"
    echo "  -i, --image IMAGE       Docker image (default: docker.io/occp-frontend:latest)"
    echo "  -h, --help              Show this help message"
    echo
    echo "Environment Variables:"
    echo "  FRONTEND_PORT           Override default port"
    echo "  VUE_APP_API_BASE_URL    Backend API URL"
    echo "  VUE_APP_API_LOGIN_ENDPOINT    Login endpoint"
    echo "  VUE_APP_API_LOGOUT_ENDPOINT   Logout endpoint"
    echo "  VUE_APP_API_ME_ENDPOINT       Me endpoint"
    echo "  NODE_ENV                Environment mode"
    echo
    echo "Examples:"
    echo "  $0                                    # Use defaults"
    echo "  $0 -p 9090                           # Use port 9090"
    echo "  $0 -a https://your-backend-server/api/v1 # Custom backend"
    echo
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        -a|--api-url)
            API_URL="$2"
            shift 2
            ;;
        -i|--image)
            DOCKER_IMAGE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main deployment process
main() {
    echo "=================================================="
    echo "🚀 OCCP Frontend VirtualBox Deployment"
    echo "=================================================="
    echo
    
    log_info "Starting deployment with configuration:"
    echo "  Docker Image: $DOCKER_IMAGE"
    echo "  Frontend Port: $FRONTEND_PORT"
    echo "  API URL: $API_URL"
    echo "  Login Endpoint: $LOGIN_ENDPOINT"
    echo "  Logout Endpoint: $LOGOUT_ENDPOINT"
    echo "  Me Endpoint: $ME_ENDPOINT"
    echo "  Node Environment: $NODE_ENV"
    echo
    
    # Confirm deployment
    read -p "Continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    check_docker
    check_port
    stop_existing_container
    pull_image
    start_container
    verify_deployment
    show_deployment_info
}

# Run main function
main
