# OSGB System - Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- MySQL database (or Docker for containerized setup)

## Database Setup Options

### Option 1: Using Docker (Recommended)
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Open terminal in the project root directory
3. Run: `docker-compose up -d`
4. Wait for containers to start (may take a few minutes)

### Option 2: Local MySQL Installation
1. Install MySQL Server
2. Create database and user:
   ```sql
   CREATE DATABASE osgb_db;
   CREATE USER 'root'@'localhost' IDENTIFIED BY '';
   GRANT ALL PRIVILEGES ON osgb_db.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Check database connection: `npm run healthcheck`
4. Start server: `npm start`

## Frontend Setup
1. Navigate to frontend directory: `cd frontend/OSGB.Frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm start`

## Environment Variables
Make sure your `.env` file in the backend directory contains:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=osgb_db
DB_PORT=3306
JWT_SECRET=super_secure_random_key_!@#123
PORT=5002
```

## Troubleshooting
If you encounter connection timeouts:
1. Verify MySQL service is running
2. Check firewall settings
3. Confirm database credentials
4. Increase connection timeout in `config/database.js`