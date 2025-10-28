@echo off
REM Kubernetes deployment script for OSGB System

echo Starting OSGB System Kubernetes deployment...

REM Check if kubectl is installed
kubectl version >nul 2>&1
if %errorlevel% neq 0 (
    echo kubectl could not be found. Please install kubectl first.
    exit /b 1
)

REM Check if Terraform is installed
terraform version >nul 2>&1
if %errorlevel% neq 0 (
    echo Terraform could not be found. Please install Terraform first.
    exit /b 1
)

REM Initialize Terraform
echo Initializing Terraform...
terraform init

REM Apply Terraform configuration
echo Applying Terraform configuration...
terraform apply -auto-approve

REM Get cluster information
echo Getting cluster information...
for /f "tokens=*" %%i in ('terraform output -raw cluster_name') do set CLUSTER_NAME=%%i
for /f "tokens=*" %%i in ('terraform output -raw db_endpoint') do set DB_ENDPOINT=%%i

echo Cluster name: %CLUSTER_NAME%
echo Database endpoint: %DB_ENDPOINT%

REM Update kubeconfig
echo Updating kubeconfig...
aws eks update-kubeconfig --name %CLUSTER_NAME%

REM Create namespace
echo Creating namespace...
kubectl apply -f ..\k8s\namespace.yaml

REM Create secrets
echo Creating secrets...
kubectl apply -f ..\k8s\secrets.yaml

REM Deploy MySQL
echo Deploying MySQL...
kubectl apply -f ..\k8s\mysql-deployment.yaml

REM Deploy backend
echo Deploying backend...
kubectl apply -f ..\k8s\backend-deployment.yaml

REM Deploy frontend
echo Deploying frontend...
kubectl apply -f ..\k8s\frontend-deployment.yaml

REM Wait for deployments to be ready
echo Waiting for deployments to be ready...
kubectl wait --for=condition=available --timeout=600s deployment/osgb-backend
kubectl wait --for=condition=available --timeout=600s deployment/osgb-frontend

echo OSGB System deployment completed successfully!

REM Display service information
echo Getting service information...
kubectl get services -n osgb-system

REM Display pod status
echo Pod status:
kubectl get pods -n osgb-system

pause