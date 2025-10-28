#!/bin/bash

# Health check script for OSGB System

echo "Checking OSGB System health..."

# Check if docker is running
if ! command -v docker &> /dev/null
then
    echo "ERROR: Docker is not installed or not in PATH"
    exit 1
fi

# Check if docker-compose is running
if ! command -v docker-compose &> /dev/null
then
    echo "ERROR: docker-compose is not installed or not in PATH"
    exit 1
fi

# Check container status
echo "Checking container status..."
docker-compose -f docker-compose.prod.yml ps

# Check backend health
echo "Checking backend health..."
BACKEND_STATUS=$(docker inspect --format='{{.State.Status}}' osgb_backend_prod 2>/dev/null)
if [ "$BACKEND_STATUS" = "running" ]; then
    echo "✓ Backend container is running"
    
    # Check backend API health endpoint
    BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5002/health 2>/dev/null || echo "000")
    if [ "$BACKEND_HEALTH" = "200" ]; then
        echo "✓ Backend API is healthy"
    else
        echo "✗ Backend API is not responding (HTTP $BACKEND_HEALTH)"
    fi
else
    echo "✗ Backend container is not running (status: $BACKEND_STATUS)"
fi

# Check frontend health
echo "Checking frontend health..."
FRONTEND_STATUS=$(docker inspect --format='{{.State.Status}}' osgb_frontend_prod 2>/dev/null)
if [ "$FRONTEND_STATUS" = "running" ]; then
    echo "✓ Frontend container is running"
    
    # Check frontend health
    FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost 2>/dev/null || echo "000")
    if [ "$FRONTEND_HEALTH" = "200" ]; then
        echo "✓ Frontend is healthy"
    else
        echo "✗ Frontend is not responding (HTTP $FRONTEND_HEALTH)"
    fi
else
    echo "✗ Frontend container is not running (status: $FRONTEND_STATUS)"
fi

# Check database health
echo "Checking database health..."
DATABASE_STATUS=$(docker inspect --format='{{.State.Status}}' osgb_database_prod 2>/dev/null)
if [ "$DATABASE_STATUS" = "running" ]; then
    echo "✓ Database container is running"
    
    # Check database connectivity
    DB_HEALTH=$(docker exec osgb_database_prod mysqladmin ping -h localhost 2>/dev/null | grep -c "mysqld is alive" || echo "0")
    if [ "$DB_HEALTH" = "1" ]; then
        echo "✓ Database is healthy"
    else
        echo "✗ Database is not responding"
    fi
else
    echo "✗ Database container is not running (status: $DATABASE_STATUS)"
fi

echo "Health check completed."