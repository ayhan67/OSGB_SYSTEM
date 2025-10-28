#!/bin/bash

# Deployment Preparation Script for OSGB System

echo "===================================================="
echo "OSGB System Deployment Preparation"
echo "===================================================="

echo "Checking system requirements..."

# Check if Docker is installed
echo ""
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "[OK] Docker is installed"
    docker --version
    docker_installed=1
else
    echo "[WARNING] Docker is not installed or not in PATH"
    echo "Please install Docker:"
    echo "  macOS: https://www.docker.com/products/docker-desktop"
    echo "  Linux: sudo apt-get install docker-ce docker-ce-cli containerd.io"
    docker_installed=0
fi

# Check if Docker Compose is installed
echo ""
echo "Checking Docker Compose installation..."
if command -v docker-compose &> /dev/null; then
    echo "[OK] Docker Compose is installed"
    docker-compose --version
    compose_installed=1
else
    echo "[WARNING] Docker Compose is not installed or not in PATH"
    if [ $docker_installed -eq 1 ]; then
        echo "Docker Compose should be included with Docker Desktop"
        echo "Please ensure Docker Desktop is properly installed and running"
    else
        echo "Please install Docker Desktop which includes Docker Compose"
    fi
    compose_installed=0
fi

# Check if OpenSSL is installed
echo ""
echo "Checking OpenSSL installation..."
if command -v openssl &> /dev/null; then
    echo "[OK] OpenSSL is installed"
    openssl version
    openssl_installed=1
else
    echo "[WARNING] OpenSSL is not installed or not in PATH"
    echo "Please install OpenSSL:"
    echo "  macOS: brew install openssl"
    echo "  Linux: sudo apt-get install openssl"
    openssl_installed=0
fi

# Summary
echo ""
echo "===================================================="
echo "System Check Summary:"
echo "===================================================="
if [ $docker_installed -eq 1 ]; then
    echo "[OK] Docker: Installed"
else
    echo "[ERROR] Docker: Not installed"
fi

if [ $compose_installed -eq 1 ]; then
    echo "[OK] Docker Compose: Installed"
else
    echo "[ERROR] Docker Compose: Not installed"
fi

if [ $openssl_installed -eq 1 ]; then
    echo "[OK] OpenSSL: Installed"
else
    echo "[ERROR] OpenSSL: Not installed"
fi

# Check environment file
echo ""
echo "Checking environment configuration..."
if [ -f ".env.prod" ]; then
    echo "[OK] Production environment file found"
else
    echo "[WARNING] Production environment file not found"
    echo "Creating from template..."
    if [ -f ".env.prod.example" ]; then
        cp ".env.prod.example" ".env.prod"
        echo "[OK] Created .env.prod from template"
        echo "Please edit .env.prod with your production values"
    else
        echo "[ERROR] Template file .env.prod.example not found"
    fi
fi

# Final instructions
echo ""
echo "===================================================="
echo "Next Steps:"
echo "===================================================="

if [ $docker_installed -eq 1 ] && [ $compose_installed -eq 1 ] && [ $openssl_installed -eq 1 ]; then
    echo "All requirements are met. You can now deploy the application:"
    echo ""
    echo "1. Edit .env.prod with your production values"
    echo "2. Run the deployment script:"
    echo "   ./scripts/deploy-prod.sh"
    echo ""
    echo "For production deployment, obtain SSL certificates from a CA"
    echo "and place them in the ssl directory."
else
    echo "Some requirements are missing. Please install the missing components:"
    echo ""
    if [ $docker_installed -ne 1 ]; then echo "- Install Docker"; fi
    if [ $openssl_installed -ne 1 ]; then echo "- Install OpenSSL"; fi
    echo ""
    echo "After installing the required components, run this script again."
fi

echo ""
echo "For detailed instructions, see docs/FINAL_DEPLOYMENT_PREPARATION.md"