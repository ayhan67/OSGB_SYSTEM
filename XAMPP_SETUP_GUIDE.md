# XAMPP Setup Guide for OSGB System

## Prerequisites
- XAMPP installed and running
- MySQL service started in XAMPP Control Panel

## Setup Instructions

### 1. Start XAMPP Services
1. Open XAMPP Control Panel
2. Start Apache service
3. Start MySQL service

### 2. Create Database
1. Click "Admin" button next to MySQL in XAMPP Control Panel
2. This will open phpMyAdmin in your browser
3. In phpMyAdmin, click "New" to create a new database
4. Name the database `osgb_db`
5. Click "Create"

### 3. Configure Environment Variables
The application is already configured to work with XAMPP's default MySQL settings:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=     (empty by default in XAMPP)
DB_NAME=osgb_db
DB_PORT=3306
```

### 4. Run the Application
You can start the application using one of these methods:

#### Method 1: Using the batch file
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
start-mysql.bat
```

#### Method 2: Direct command
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
npm start
```

### 5. Test Database Connection
To verify the MySQL connection is working:
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
npm run test:mysql
```

## Verification

### Check if Server is Running
You can verify the server is running by accessing the health endpoint:
```
http://localhost:5002/health
```

You should receive a response like:
```json
{
  "status": "OK",
  "timestamp": "2025-10-20T08:13:23.688Z",
  "uptime": 66.14401
}
```

### Available API Endpoints
Once running, you can access the following endpoints:
- `http://localhost:5002/health` - Health check
- `http://localhost:5002/api/workplaces` - Workplaces API
- `http://localhost:5002/api/experts` - Experts API
- `http://localhost:5002/api/doctors` - Doctors API
- `http://localhost:5002/api/dsps` - DSPs API
- `http://localhost:5002/api/visits` - Visits API

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Failed
- Ensure MySQL service is running in XAMPP
- Verify database name is `osgb_db`
- Check that port 3306 is not blocked by firewall

#### 2. Port Already In Use
- Change PORT in .env file to a different port
- Or stop the service using port 5002

#### 3. Database Doesn't Exist
- Make sure you created the `osgb_db` database in phpMyAdmin

#### 4. Authentication Error
- XAMPP MySQL typically has no password for root user by default
- If you set a password, update the DB_PASSWORD field in .env

## Benefits of Using XAMPP

1. **Full MySQL Compatibility**: Uses the same database engine as production environments
2. **Better Performance**: MySQL typically performs better than SQLite for web applications
3. **Advanced Features**: Supports more advanced database features like stored procedures
4. **Industry Standard**: More closely matches production environments
5. **Easy Management**: phpMyAdmin provides a web interface for database management

## Switching Between SQLite and MySQL

### To use SQLite:
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
.\start-sqlite.bat
```

### To use MySQL:
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
.\start-mysql.bat
```

Or simply:
```bash
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
npm start
```