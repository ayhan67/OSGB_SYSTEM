# Final Deployment Preparation Guide

## Prerequisites Installation

Before deploying the OSGB System to production, you need to install the following dependencies:

### 1. Docker Installation

#### Windows
1. Download Docker Desktop for Windows from https://www.docker.com/products/docker-desktop
2. Run the installer and follow the installation wizard
3. Restart your computer after installation
4. Start Docker Desktop from the Start menu

#### macOS
1. Download Docker Desktop for Mac from https://www.docker.com/products/docker-desktop
2. Run the installer and follow the installation wizard
3. Start Docker Desktop from the Applications folder

#### Linux (Ubuntu/Debian)
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group (optional)
sudo usermod -aG docker $USER
```

### 2. Docker Compose Installation

#### Windows and macOS
Docker Compose is included with Docker Desktop, so no additional installation is required.

#### Linux
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 3. OpenSSL Installation

#### Windows
1. Download OpenSSL for Windows from https://slproweb.com/products/Win32OpenSSL.html
2. Choose the appropriate version (Light version is sufficient)
3. Run the installer and follow the installation wizard
4. Add OpenSSL to your system PATH during installation

#### macOS
```bash
# Using Homebrew
brew install openssl

# Using MacPorts
sudo port install openssl
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install openssl
```

## Environment Configuration

### 1. Configure Environment Variables
1. Copy [.env.prod.example](../.env.prod.example) to [.env.prod](../.env.prod):
   ```bash
   cp .env.prod.example .env.prod
   ```
   
2. Edit [.env.prod](../.env.prod) with your production values:
   - Set secure passwords for database
   - Generate a strong JWT secret
   - Update CORS origin with your domain
   - Update API URL with your domain

### 2. Generate Strong JWT Secret
```bash
# Linux/macOS
openssl rand -base64 32

# Windows
powershell -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"
```

## SSL Certificate Setup

### For Production
1. Obtain SSL certificates from a Certificate Authority (CA)
2. Place the following files in the [ssl](../ssl/) directory:
   - `certificate.crt` - Your SSL certificate
   - `private.key` - Your private key
   - `ca_bundle.crt` - CA bundle (if applicable)

### For Testing
The deployment script will automatically generate self-signed certificates if none are found.

## Deployment Steps

### 1. Validate Environment
```bash
# Linux/macOS
./scripts/validate-deployment.sh

# Windows
scripts\validate-deployment.bat
```

### 2. Deploy Application
```bash
# Linux/macOS
./scripts/deploy-prod.sh

# Windows
scripts\deploy-prod.bat
```

### 3. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Run health check
./scripts/health-check.sh  # Linux/macOS
scripts\health-check.bat   # Windows
```

## Post-Deployment Configuration

### 1. Set Up Automated Backups
```bash
# Linux/macOS (run as root)
sudo ./scripts/setup-backup-cron.sh

# Windows (run as Administrator)
scripts\setup-backup-task.bat
```

### 2. Initialize Database (if needed)
```bash
docker exec osgb_backend_prod node init-db.js
```

## Accessing the Application

After successful deployment, the application will be available at:
- Frontend: https://localhost
- Backend API: https://localhost:5002
- Database: mysql://localhost:3306

## Troubleshooting

### Common Issues

1. **Docker permission denied**
   - On Linux, add your user to the docker group or run commands with sudo

2. **Port already in use**
   - Stop conflicting services or change ports in docker-compose.prod.yml

3. **SSL certificate errors**
   - Ensure SSL certificates are properly formatted and accessible
   - Check file permissions (600 for private key)

4. **Database connection failed**
   - Verify database credentials in .env.prod
   - Check if database service is running

### Useful Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop services
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Access database
docker exec -it osgb_database_prod mysql -u osgb_user -p
```

## Support

For deployment issues, contact:
- Lead Developer: [Your Name]
- System Administrator: [Admin Name]

---

**Version:** 1.0
**Last Updated:** October 2025