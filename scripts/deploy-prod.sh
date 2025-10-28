#!/bin/bash

# Production deployment script for OSGB System

set -e  # Exit on any error

echo "Starting OSGB System production deployment..."

# Check if docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "docker-compose could not be found. Please install docker-compose first."
    exit 1
fi

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null
then
    echo "OpenSSL could not be found. Please install OpenSSL first."
    exit 1
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/logs
mkdir -p ssl

# Check if SSL certificates exist, generate if not
if [ ! -f "ssl/certificate.crt" ] || [ ! -f "ssl/private.key" ]; then
    echo "SSL certificates not found. Generating self-signed certificates for testing..."
    ./scripts/generate-certificates.sh
else
    echo "SSL certificates found."
fi

# Build and deploy services
echo "Building and deploying services..."
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 30

# Check service status
echo "Checking service status..."
docker-compose -f docker-compose.prod.yml ps

# Run database initialization if needed
echo "Initializing database..."
docker exec osgb_backend_prod node init-db.js

echo "OSGB System production deployment completed successfully!"

echo "Access the application at:"
echo "  Frontend: https://localhost (HTTPS)"
echo "  Backend API: https://localhost:5002"
echo "  Database: mysql://localhost:3306"

echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"