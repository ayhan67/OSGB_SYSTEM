# OSGB System Production Deployment Quick Start Guide

## Prerequisites

1. Docker and Docker Compose installed
2. OpenSSL installed
3. At least 4GB RAM and 20GB free disk space
4. Ports 80, 443, 3306, and 5002 available

## Quick Deployment Steps

### 1. Clone Repository
```bash
git clone <repository-url>
cd OSGB_System
```

### 2. Configure Environment
```bash
# Copy template to production environment file
cp .env.prod.example .env.prod

# Edit .env.prod with your production values
nano .env.prod
```

### 3. Validate Environment
```bash
# Linux/macOS
./scripts/validate-deployment.sh

# Windows
scripts\validate-deployment.bat
```

### 4. Deploy Application
```bash
# Linux/macOS
./scripts/deploy-prod.sh

# Windows
scripts\deploy-prod.bat
```

### 5. Verify Deployment
```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Run health check
./scripts/health-check.sh  # Linux/macOS
scripts\health-check.bat   # Windows
```

## Access Application

- Frontend: https://localhost
- Backend API: https://localhost:5002
- Database: mysql://localhost:3306

## Post-Deployment

### Set Up Automated Backups
```bash
# Linux/macOS (run as root)
sudo ./scripts/setup-backup-cron.sh

# Windows (run as Administrator)
scripts\setup-backup-task.bat
```

### Generate Strong JWT Secret
```bash
# Linux/macOS
openssl rand -base64 32

# Windows
powershell -Command "[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))"
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Stop conflicting services or change ports in docker-compose.prod.yml

2. **Permission denied**
   - Ensure proper file permissions, especially for SSL private key

3. **Database connection failed**
   - Verify database credentials in .env.prod

4. **SSL certificate errors**
   - Ensure SSL certificates are properly formatted and accessible

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
```

## Support

For deployment issues, contact:
- Lead Developer: [Your Name]
- System Administrator: [Admin Name]

---

**Version:** 1.0
**Last Updated:** October 2025