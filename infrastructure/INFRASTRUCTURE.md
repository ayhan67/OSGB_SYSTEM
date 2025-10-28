# OSGB System Infrastructure Documentation

This document provides detailed information about the infrastructure setup for the OSGB System.

## 1. Architecture Overview

The OSGB System follows a microservices architecture deployed on Kubernetes with the following components:

1. **Frontend Service**: React-based web application
2. **Backend Service**: Node.js REST API
3. **Database**: MySQL 8.0
4. **Monitoring**: Prometheus and Grafana
5. **Logging**: Fluentd and Elasticsearch
6. **Load Balancer**: Kubernetes LoadBalancer service

## 2. Infrastructure as Code (IaC)

### Terraform Configuration

We use Terraform to provision the entire infrastructure on AWS:

- **VPC**: Custom VPC with public and private subnets
- **EKS Cluster**: Managed Kubernetes cluster
- **Node Groups**: Worker nodes for running applications
- **RDS**: Managed MySQL database
- **Security Groups**: Network access control
- **IAM Roles**: Permissions for EKS and RDS

### Kubernetes Manifests

Kubernetes manifests are stored in the `k8s/` directory:

- `namespace.yaml`: Kubernetes namespace
- `secrets.yaml`: Sensitive configuration
- `mysql-deployment.yaml`: Database deployment
- `backend-deployment.yaml`: Backend API deployment
- `frontend-deployment.yaml`: Frontend web application deployment

## 3. Deployment Process

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. kubectl installed and configured
3. Terraform installed
4. Docker installed

### Deployment Steps

1. **Initialize Terraform**:
   ```bash
   terraform init
   ```

2. **Apply Infrastructure**:
   ```bash
   terraform apply
   ```

3. **Update kubeconfig**:
   ```bash
   aws eks update-kubeconfig --name osgb-cluster
   ```

4. **Deploy Applications**:
   ```bash
   kubectl apply -f k8s/
   ```

### Automated Deployment

Use the provided deployment scripts:
- `k8s-deploy.sh` (Linux/Mac)
- `k8s-deploy.bat` (Windows)

## 4. Security Considerations

### Network Security

- VPC with isolated subnets
- Security groups for each service
- Private endpoints for database access
- Load balancer for external access

### Secrets Management

- Kubernetes secrets for sensitive data
- Base64 encoding for secret values
- Environment-specific secret files

### Access Control

- IAM roles for EKS and RDS
- RBAC for Kubernetes cluster
- Service accounts for applications

## 5. Scalability

### Horizontal Scaling

- Kubernetes deployments with replica sets
- Auto-scaling groups for worker nodes
- Horizontal Pod Autoscaler for applications

### Vertical Scaling

- Resource requests and limits for containers
- Node group scaling based on resource usage

## 6. Monitoring and Logging

### Monitoring

- Prometheus for metrics collection
- Grafana for visualization
- Kubernetes health checks

### Logging

- Fluentd for log collection
- Elasticsearch for log storage
- Kibana for log visualization

## 7. Backup and Disaster Recovery

### Database Backup

- Automated RDS snapshots
- Point-in-time recovery
- Cross-region replication

### Application Backup

- Container image versioning
- Configuration backups
- Persistent volume snapshots

## 8. Cost Optimization

### Resource Management

- Right-sizing of EC2 instances
- Spot instances for development environments
- Reserved instances for production

### Storage Optimization

- EBS volume optimization
- S3 lifecycle policies
- Database storage optimization

## 9. CI/CD Integration

### GitHub Actions

- Automated testing
- Security scanning
- Infrastructure validation
- Deployment automation

### Pipeline Stages

1. Security scan
2. Infrastructure validation
3. Build and test
4. Deploy to Kubernetes

## 10. Environment Management

### Development Environment

- Local Docker Compose setup
- Minikube for local Kubernetes
- Development-specific configurations

### Production Environment

- EKS cluster with multiple availability zones
- RDS with multi-AZ deployment
- Production-specific configurations

## 11. Troubleshooting

### Common Issues

1. **Deployment failures**: Check pod logs and events
2. **Connectivity issues**: Verify network policies and security groups
3. **Resource constraints**: Check resource requests and limits
4. **Authentication issues**: Verify secrets and IAM roles

### Diagnostic Commands

```bash
# Check pod status
kubectl get pods -n osgb-system

# Check service status
kubectl get services -n osgb-system

# Check pod logs
kubectl logs <pod-name> -n osgb-system

# Check deployment status
kubectl describe deployment <deployment-name> -n osgb-system
```

This infrastructure setup ensures a robust, scalable, and secure deployment of the OSGB System in the cloud.