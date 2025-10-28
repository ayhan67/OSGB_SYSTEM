#!/bin/bash

# Production deployment validation script for OSGB System

echo "Validating OSGB System production deployment environment..."

# Check if running on Linux or macOS
if [[ "$OSTYPE" != "linux-gnu"* && "$OSTYPE" != "darwin"* ]]; then
    echo "This script is designed for Linux/macOS. For Windows, please use validate-deployment.bat"
    exit 1
fi

# Initialize error counter
errors=0

# Function to check requirement
check_requirement() {
    local requirement=$1
    local check_command=$2
    local error_message=$3
    
    echo -n "Checking $requirement... "
    if eval "$check_command" > /dev/null 2>&1; then
        echo "OK"
    else
        echo "FAILED"
        echo "  Error: $error_message"
        ((errors++))
    fi
}

# Check Docker installation
check_requirement "Docker" "command -v docker" "Docker is not installed. Please install Docker."

# Check Docker Compose installation
check_requirement "Docker Compose" "command -v docker-compose" "Docker Compose is not installed. Please install Docker Compose."

# Check OpenSSL installation
check_requirement "OpenSSL" "command -v openssl" "OpenSSL is not installed. Please install OpenSSL."

# Check if .env.prod exists
check_requirement ".env.prod file" "test -f .env.prod" ".env.prod file not found. Please create it from .env.prod.example."

# Check if required environment variables are set
echo -n "Checking environment variables... "
missing_vars=()
required_vars=("DB_ROOT_PASSWORD" "DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "CORS_ORIGIN" "REACT_APP_API_URL")

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.prod; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
    echo "OK"
else
    echo "FAILED"
    echo "  Missing environment variables: ${missing_vars[*]}"
    ((errors++))
fi

# Check if SSL certificates exist
echo -n "Checking SSL certificates... "
if [ -f "ssl/certificate.crt" ] && [ -f "ssl/private.key" ]; then
    echo "OK"
else
    echo "WARNING - SSL certificates not found. Self-signed certificates will be generated during deployment."
fi

# Check disk space
echo -n "Checking disk space... "
available_space=$(df . | awk 'NR==2 {print $4}')
if [ "$available_space" -gt 1048576 ]; then  # 1GB in KB
    echo "OK (${available_space} KB available)"
else
    echo "WARNING - Low disk space (${available_space} KB available)"
fi

# Check if ports are available
echo "Checking port availability..."
ports=("80" "443" "3306" "5002")
for port in "${ports[@]}"; do
    echo -n "  Port $port... "
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "IN USE"
        echo "    Warning: Port $port is already in use"
    else
        echo "AVAILABLE"
    fi
done

# Summary
echo ""
echo "Validation complete."
if [ $errors -eq 0 ]; then
    echo "✓ All critical requirements met. Ready for deployment."
    exit 0
else
    echo "✗ $errors critical issues found. Please resolve before deployment."
    exit 1
fi