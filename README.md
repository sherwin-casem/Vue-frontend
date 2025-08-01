# OCPP Frontend

A modern Vue.js frontend for managing an OCPP-based Central System backend, designed for electric vehicle charging station management.

## 🚀 Quick Start

### Development

```bash
npm install
npm run serve
```

### Production (Docker)

```bash
docker pull docker.io/ocpp-frontend:latest
docker run -p 8080:80 -e VUE_APP_API_BASE_URL=https://your-backend:5401/fleet/ocpp/v1 -e VUE_APP_API_LOGIN_ENDPOINT=/auth/login -e VUE_APP_API_LOGOUT_ENDPOINT=/auth/logout -e VUE_APP_API_ME_ENDPOINT=/auth/me docker.io/ocpp-frontend:latest
```

### Production (Docker Compose)

```bash
cp .env.example .env
# Edit .env with your configuration
docker-compose up -d
```

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Configuration](#configuration)
- [Features](#features)
- [Contributing](#contributing)

## 📚 Documentation

- **[🚀 Quick Start Guide](./QUICKSTART.md)** - Fast deployment on VirtualBox
- **[📖 Comprehensive Deployment Guide](./DEPLOYMENT.md)** - Detailed deployment instructions
- **[🔄 CI/CD Pipeline Summary](./CI-CD-SUMMARY.md)** - Complete CI/CD documentation

## 🎯 Project Overview

This project provides a comprehensive web-based interface for managing electric vehicle charging infrastructure through an OCPP (Open Charge Point Protocol) Central System. It enables operators to monitor, configure, and manage charging stations remotely.

### Key Capabilities

- **Real-time Monitoring**: Live status of charging points and sessions
- **Configuration Management**: Setup and modify charging profiles
- **User Management**: Role-based access control
- **Reporting**: Generate usage and performance reports
- **Multi-language Support**: Internationalization ready

## 🛠 Technology Stack

- **Frontend Framework**: Vue 3 (Composition API)
- **UI Framework**: Vuetify 3 + Kendo UI Vue
- **State Management**: Pinia
- **Router**: Vue Router 4 (with role-based guards)
- **HTTP Client**: Axios
- **Authentication**: JWT with refresh tokens
- **Internationalization**: Vue I18n
- **Build Tool**: Vue CLI 5
- **Type Safety**: TypeScript
- **Containerization**: Docker + Nginx
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
ocpp-frontend/
├── .github/workflows/       # CI/CD pipeline configuration
│   └── ci.yml               # GitHub Actions workflow
├── public/                  # Static assets
│   ├── index.html           # Main HTML template
│   └── *.png                # Application icons and images
├── src/                     # Source code
│   ├── assets/              # Static assets (CSS, images)
│   │   └── css/             # Global stylesheets
│   ├── components/          # Reusable Vue components
│   │   ├── *DataGrid.vue    # Data grid components
│   │   ├── *Form.vue        # Form components
│   │   └── *.vue            # Other UI components
│   ├── composables/         # Vue composition functions
│   │   ├── useGroupBy.ts    # Data grouping logic
│   │   ├── useTranslations.ts # Translation utilities
│   │   └── *.ts             # Other composables
│   ├── i18n/                # Internationalization
│   │   ├── locales/         # Translation files (en, de, es, fr, ru)
│   │   └── index.ts         # i18n configuration
│   ├── plugins/             # Vue plugins
│   ├── router/              # Vue Router configuration
│   │   └── index.ts         # Route definitions and guards
│   ├── stores/              # Pinia state management
│   │   ├── auth.ts          # Authentication store
│   │   ├── chargepoints.ts  # Charge points data store
│   │   └── *.ts             # Other stores
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── views/               # Page components
│   │   ├── LoginView.vue    # Authentication page
│   │   ├── DashboardView.vue # Main dashboard
│   │   └── *.vue            # Other pages
│   ├── App.vue              # Root component
│   └── main.ts              # Application entry point
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker build instructions
├── nginx.conf               # Nginx configuration for production
├── .env.example             # Environment variables template
├── DEPLOYMENT.md            # Detailed deployment guide
└── package.json             # Project dependencies and scripts
```

## 🔧 Development Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Git**: For version control

### Installation

1. **Clone the Repository**

```bash
git clone https://github.com/your-org/ocpp-frontend.git
cd ocpp-frontend
```

2. **Install Dependencies**

```bash
npm install
```

3. **Environment Configuration**

```bash
cp .env.example .env
# Edit .env with your local backend configuration
```

4. **Start Development Server**

```bash
npm run serve
```

The application will be available at [http://localhost:8080](http://localhost:8080).

### Development Commands

```bash
# Start development server
npm run serve

# Build for production
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check

# Build with type checking
npm run build:type-check
```

## 🚀 Production Deployment

### Docker Deployment (Recommended)

#### Option 1: Docker Compose (Full Stack)

```bash
# 1. Clone and configure
git clone https://github.com/your-org/ocpp-frontend.git
cd ocpp-frontend
cp .env.example .env

# 2. Update .env file with your configuration
nano .env

# 3. Deploy
docker-compose up -d

# 4. Verify deployment
docker-compose ps
docker-compose logs -f ocpp-frontend
```

#### Option 2: Standalone Docker Container

```bash
# Pull latest image
docker pull docker.io/ocpp-frontend:latest

# Run container
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  -e VITE_API_BASE_URL=http://your-backend:8000/api \
  -e VITE_WS_URL=ws://your-backend:8000/ws \
  docker.io/ocpp-frontend:latest
```

#### Option 3: Build from Source

```bash
# Build image
docker build -t ocpp-frontend:local .

# Run container
docker run -d \
  --name ocpp-frontend \
  --restart unless-stopped \
  -p 8080:80 \
  ocpp-frontend:local
```

### VirtualBox Deployment

For VirtualBox deployment, choose your preferred method:

- **🚀 Quick Start**: Follow [QUICKSTART.md](./QUICKSTART.md) for fast deployment
- **📖 Comprehensive Guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions
- **🔄 CI/CD Information**: Review [CI-CD-SUMMARY.md](./CI-CD-SUMMARY.md) for pipeline details

## 🔄 CI/CD Pipeline

### Pipeline Overview

The CI/CD pipeline automatically builds, tests, and deploys the application using GitHub Actions.

#### Workflow Stages

1. **🔍 Code Analysis**

   - Checkout source code
   - Setup Node.js environment
   - Install dependencies

2. **🏗️ Build & Test**

   - Build Vue.js application
   - Generate production assets
   - Upload build artifacts

3. **🐳 Docker Build**

   - Create multi-stage Docker image
   - Push to Docker registry
   - Tag with branch and commit SHA

4. **🚀 Deployment**

   - Deploy to staging (develop branch)
   - Deploy to production (main branch)
   - Create deployment packages

5. **🔒 Security Scanning**
   - Vulnerability scanning with Trivy
   - Upload security reports

### Triggering Deployments

- **Development**: Push to `develop` branch
- **Production**: Push to `main` branch
- **Release**: Create GitHub release

### Required Secrets

Configure these secrets in your GitHub repository:

```bash
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
```

### Pipeline Configuration

The pipeline is defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) and includes:

- **Multi-platform builds** (AMD64, ARM64)
- **Caching strategies** for faster builds
- **Automatic versioning** based on Git tags
- **Security scanning** with vulnerability reports
- **Deployment packages** for easy distribution

## ⚙️ Configuration

### Environment Variables

| Variable                      | Description          | Default                              | Required |
| ----------------------------- | -------------------- | ------------------------------------ | -------- |
| `VUE_APP_API_BASE_URL`        | Backend API endpoint | `https://your-backend-server/api/v1` | ✅       |
| `VUE_APP_API_LOGIN_ENDPOINT`  | Login endpoint       | `/auth/login`                        | ✅       |
| `VUE_APP_API_LOGOUT_ENDPOINT` | Logout endpoint      | `/auth/logout`                       | ✅       |
| `VUE_APP_API_ME_ENDPOINT`     | Me endpoint          | `/auth/me`                           | ✅       |
| `NODE_ENV`                    | Environment mode     | `development`                        | ✅       |

### Docker Configuration

The application uses a multi-stage Docker build:

1. **Build Stage**: Node.js 18 Alpine

   - Installs dependencies
   - Builds Vue.js application

2. **Production Stage**: Nginx Alpine
   - Serves static files
   - Configured for SPA routing
   - Optimized for performance

### Nginx Configuration

Production deployment uses Nginx with:

- **Gzip compression** for better performance
- **Cache headers** for static assets
- **SPA routing** support
- **Security headers**

## ✨ Features

### Current Implementation

#### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control
- Automatic token refresh
- Secure logout functionality

#### 📊 Dashboard & Monitoring

- Real-time charge point status
- Usage statistics and KPIs
- Performance metrics
- Alert notifications

#### ⚡ Charge Point Management

- Add/edit/delete charge points
- Configure charging parameters
- Monitor charging sessions
- Remote control capabilities

#### 📅 Charging Profile Management

- Create charging schedules
- Time-based pricing
- Load balancing profiles
- Smart charging algorithms

#### 🌍 Internationalization

- Multi-language support (EN, DE, ES, FR, RU)
- Dynamic language switching
- Localized date/time formats
- Currency formatting

#### 📈 Data Management

- Advanced data grids with Kendo UI
- Export functionality (Excel, PDF)
- Filtering and sorting
- Grouping and aggregation

### Code Standards

- **Vue 3 Composition API** for new components
- **TypeScript** for type safety
- **ESLint + Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Component-based architecture**


## 📄 License

Proprietary - Fleet Velia

## 🆘 Support

- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/ocpp-frontend/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ocpp-frontend/discussions)

---

**Built with ❤️ using Vue.js and modern web technologies**
