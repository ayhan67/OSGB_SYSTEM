# OSGB System Deployment Checklist

## Pre-deployment Requirements

### Infrastructure
- [ ] Docker installed on target server
- [ ] Docker Compose installed on target server
- [ ] OpenSSL installed on target server
- [ ] Sufficient disk space for application and backups
- [ ] Firewall configured to allow ports 80, 443, 3306, 5002

### SSL Certificates
- [ ] Production SSL certificates obtained from CA (or self-signed for testing)
- [ ] Certificate files placed in [ssl](../ssl/) directory:
  - [ ] `certificate.crt` - SSL certificate
  - [ ] `private.key` - Private key
  - [ ] `ca_bundle.crt` - CA bundle (if applicable)

### Environment Configuration
- [ ] Production environment variables configured in [.env.prod](../.env.prod):
  - [ ] `DB_ROOT_PASSWORD` - Secure MySQL root password
  - [ ] `DB_USER` - Database user
  - [ ] `DB_PASSWORD` - Secure database password
  - [ ] `DB_NAME` - Database name
  - [ ] `JWT_SECRET` - Strong JWT secret key
  - [ ] `CORS_ORIGIN` - Allowed origins for CORS
  - [ ] `REACT_APP_API_URL` - API URL for frontend

## Deployment Steps

### 1. Initial Setup
- [ ] Clone repository to production server
- [ ] Navigate to project root directory
- [ ] Verify all required files are present

### 2. SSL Certificate Setup
- [ ] Place SSL certificates in [ssl](../ssl/) directory
- [ ] Verify certificate permissions (600 for private key)

### 3. Environment Configuration
- [ ] Update [.env.prod](../.env.prod) with production values
- [ ] Verify all required environment variables are set

### 4. Database Initialization
- [ ] Run deployment script: `./scripts/deploy-prod.sh` (Linux/Mac) or `scripts\deploy-prod.bat` (Windows)
- [ ] Verify database initialization completed successfully

### 5. Service Verification
- [ ] Check service status: `docker-compose -f docker-compose.prod.yml ps`
- [ ] Verify frontend is accessible at https://localhost
- [ ] Verify backend API is accessible at https://localhost:5002
- [ ] Verify database is accessible at mysql://localhost:3306

### 6. Health Checks
- [ ] Run health check script: `./scripts/health-check.sh` (Linux/Mac) or `scripts\health-check.bat` (Windows)
- [ ] Verify all services report healthy status

## Post-deployment Tasks

### Backup Configuration
- [ ] Set up automated backups:
  - Linux/Mac: Run `sudo ./scripts/setup-backup-cron.sh`
  - Windows: Run `scripts\setup-backup-task.bat` as Administrator

### Monitoring Setup
- [ ] Configure log monitoring
- [ ] Set up alerting for service downtime
- [ ] Configure performance monitoring

### Security Hardening
- [ ] Update firewall rules to restrict unnecessary access
- [ ] Rotate passwords and secrets after initial deployment
- [ ] Enable automatic security updates for OS

## Rollback Procedure

In case of deployment failure:

1. Stop all services: `docker-compose -f docker-compose.prod.yml down`
2. Restore database from latest backup: `./scripts/restore.sh`
3. Revert to previous code version if necessary
4. Re-run deployment with corrected configuration

## Troubleshooting

### Common Issues

1. **Services won't start**
   - Check logs: `docker-compose -f docker-compose.prod.yml logs`
   - Verify environment variables
   - Check SSL certificate permissions

2. **Database connection issues**
   - Verify database credentials in .env.prod
   - Check database service status
   - Ensure database is initialized

3. **Frontend not loading**
   - Check Nginx configuration
   - Verify SSL certificate installation
   - Check CORS configuration

### Support Contacts

- Lead Developer: [Your Name]
- System Administrator: [Admin Name]
- Security Officer: [Security Contact]

---

**Last Updated:** October 2025
**Version:** 1.0