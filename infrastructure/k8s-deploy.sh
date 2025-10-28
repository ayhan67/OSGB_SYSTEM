#!/bin/bash

# Kubernetes deployment script for OSGB System

set -e  # Exit on any error

echo "Starting OSGB System Kubernetes deployment..."

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null
then
    echo "kubectl could not be found. Please install kubectl first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null
then
    echo "Terraform could not be found. Please install Terraform first."
    exit 1
fi

# Initialize Terraform
echo "Initializing Terraform..."
terraform init

# Apply Terraform configuration
echo "Applying Terraform configuration..."
terraform apply -auto-approve

# Get cluster information
echo "Getting cluster information..."
CLUSTER_NAME=$(terraform output -raw cluster_name)
DB_ENDPOINT=$(terraform output -raw db_endpoint)

echo "Cluster name: $CLUSTER_NAME"
echo "Database endpoint: $DB_ENDPOINT"

# Update kubeconfig
echo "Updating kubeconfig..."
aws eks update-kubeconfig --name $CLUSTER_NAME

# Create namespace
echo "Creating namespace..."
kubectl apply -f ../k8s/namespace.yaml

# Create secrets
echo "Creating secrets..."
kubectl apply -f ../k8s/secrets.yaml

# Update database endpoint in secrets
echo "Updating database endpoint in secrets..."
kubectl patch secret mysql-secret -p="{\"data\":{\"db-host\": \"$(echo -n $DB_ENDPOINT | base64)\"}}"

# Deploy MySQL (if using internal MySQL instead of RDS)
echo "Deploying MySQL..."
kubectl apply -f ../k8s/mysql-deployment.yaml

# Deploy backend
echo "Deploying backend..."
kubectl apply -f ../k8s/backend-deployment.yaml

# Deploy frontend
echo "Deploying frontend..."
kubectl apply -f ../k8s/frontend-deployment.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s deployment/osgb-backend
kubectl wait --for=condition=available --timeout=600s deployment/osgb-frontend
kubectl wait --for=condition=ready --timeout=600s pod -l app=osgb,tier=backend
kubectl wait --for=condition=ready --timeout=600s pod -l app=osgb,tier=frontend

# Get service information
echo "Getting service information..."
kubectl get services -n osgb-system

echo "OSGB System deployment completed successfully!"

# Display ingress information if available
echo "Checking for ingress..."
kubectl get ingress -n osgb-system 2>/dev/null || echo "No ingress found"

# Display pod status
echo "Pod status:"
kubectl get pods -n osgb-system