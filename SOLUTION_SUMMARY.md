# OSGB System - Database Connection Issue Solution

## Problem Summary
You're experiencing a database connection timeout error:
```
Unable to connect to the database: ConnectionError [SequelizeConnectionError]: connect ETIMEDOUT
```

This happens because the application cannot connect to the MySQL database at `localhost:3306`.

## Immediate Solutions

### Solution 1: Use SQLite (No Installation Required)
This is the quickest way to get the application running:

1. Start the backend with SQLite:
   ```bash
   cd backend
   npm run start:sqlite
   ```

This will create a local `database.sqlite` file and bypass the MySQL connection issue entirely.

### Solution 2: Install MySQL Database

#### Option A: Using XAMPP (Recommended for Windows)
1. Download XAMPP from https://www.apachefriends.org/download.html
2. Install with default settings
3. Start XAMPP Control Panel
4. Start Apache and MySQL services
5. Access phpMyAdmin and create a database named `osgb_db`

#### Option B: Using Docker (If available)
1. Install Docker Desktop
2. Run: `docker-compose up -d`

#### Option C: Install MySQL Server Directly
1. Download MySQL Community Server
2. Install with default settings
3. Start the MySQL service

## Configuration Files Updated

I've made several improvements to help with the connection issue:

1. **Increased Connection Timeout**: Set to 60 seconds in `config/database.js`
2. **Added Retry Logic**: Will retry connection up to 3 times
3. **Enhanced Error Handling**: Better error messages in `server.js`
4. **Added SQLite Support**: Alternative database option
5. **Health Check Script**: To diagnose connection issues (`npm run healthcheck`)

## Environment Variables
Make sure your `.env` file in the backend directory has:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=osgb_db
DB_PORT=3306
JWT_SECRET=super_secure_random_key_!@#123
PORT=5002
```

## Testing Database Connection
Run the health check script to verify database connectivity:
```bash
cd backend
npm run healthcheck
```

## Running the Application

### With SQLite (Recommended for immediate testing):
```bash
cd backend
npm run start:sqlite
```

### With MySQL (after database setup):
```bash
cd backend
npm start
```

## Next Steps

1. **For immediate development**: Use the SQLite option
2. **For production deployment**: Set up MySQL properly
3. **For team development**: Use Docker to ensure consistent environments

The SQLite option will allow you to run the application immediately without any database installation, while still maintaining full functionality for development and testing purposes.