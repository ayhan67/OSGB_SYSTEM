# OSGB System Infrastructure Setup

## Overview

This document describes the infrastructure setup for the OSGB (Occupational Health and Safety) Tracking System. The system is designed to be deployed in a cloud environment using containerization and orchestration technologies.

## Architecture Components

### 1. Containerization with Docker

The system is containerized using Docker with the following components:

- **Frontend**: React application served by Nginx
- **Backend**: Node.js/Express API with JWT authentication
- **Database**: MySQL 8.0 for production, SQLite for development

### 2. Orchestration with Docker Compose

For local development and testing, Docker Compose is used to orchestrate the services:

```bash
docker-compose up -d
```

### 3. Kubernetes Deployment

For production deployment, Kubernetes manifests are provided:

- Namespace configuration
- Secret management
- Service deployments for all components
- Persistent volume claims for database storage

### 4. CI/CD Pipeline

GitHub Actions workflow is configured for:

- Automated testing
- Docker image building
- Kubernetes deployment

### 5. Monitoring and Logging

- Prometheus for metrics collection
- Grafana for dashboard visualization
- Centralized logging solution

## Deployment Instructions

### Local Development

1. Clone the repository
2. Run `docker-compose up -d`
3. Access the application at `http://localhost`

### Production Deployment

1. Configure Kubernetes cluster
2. Update secrets in `k8s/secrets.yaml`
3. Apply Kubernetes manifests:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/mysql-deployment.yaml
   kubectl apply -f k8s/backend-deployment.yaml
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

## Security Considerations

- JWT tokens with short expiration times
- Rate limiting for authentication endpoints
- Input validation and sanitization
- Secure database connections
- Non-root user for container processes
- Health checks for all services

## Backup and Recovery

- Automated database backup script
- 30-day retention policy
- Disaster recovery procedures

## Scaling Considerations

- Horizontal pod autoscaling
- Database connection pooling
- Load balancing
- CDN for static assets