# OSGB System - Complete Setup Instructions

## Database Connection Issue Resolution

The error you're experiencing is due to the application being unable to connect to the MySQL database. Here's how to resolve it:

## Option 1: Install MySQL Using XAMPP (Easiest for Windows)

1. Download XAMPP from https://www.apachefriends.org/download.html
2. Install XAMPP with default settings
3. Start XAMPP Control Panel
4. Start Apache and MySQL services
5. Click "Admin" button next to MySQL to open phpMyAdmin
6. Create a new database named `osgb_db`

## Option 2: Install MySQL Server Directly

1. Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
2. Run the installer as Administrator
3. Choose "Server only" setup type
4. Configure MySQL with these settings:
   - Root password: Leave empty (to match your .env file) or set one and update .env
   - Port: 3306 (default)

## Option 3: Use Docker (If Docker is available)

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Open PowerShell as Administrator in the project directory
3. Run: `docker-compose up -d`

## After Database Installation

1. Verify your backend/.env file contains:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=osgb_db
   DB_PORT=3306
   JWT_SECRET=super_secure_random_key_!@#123
   PORT=5002
   ```

2. If you set a password for MySQL root user, update the DB_PASSWORD field accordingly

3. Test the connection by running:
   ```bash
   cd backend
   npm run healthcheck
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

## Manual Database Setup (If needed)

If the database needs to be set up manually:

1. Open MySQL command line or phpMyAdmin
2. Run these SQL commands:
   ```sql
   CREATE DATABASE IF NOT EXISTS osgb_db;
   USE osgb_db;
   
   -- Grant privileges to root user
   GRANT ALL PRIVILEGES ON osgb_db.* TO 'root'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Troubleshooting Tips

1. **Connection Timeout**: 
   - Check if MySQL service is running
   - Verify firewall settings
   - Try increasing connection timeout in `config/database.js`

2. **Authentication Error**:
   - Verify username/password in .env file
   - Check if MySQL user has proper privileges

3. **Port Already in Use**:
   - Change DB_PORT in .env to a different port
   - Or stop the service using port 3306

4. **Database Doesn't Exist**:
   - Create the database manually using the SQL command above

## Testing the Setup

After setting up the database:

1. Run the health check:
   ```bash
   cd backend
   npm run healthcheck
   ```

2. If successful, start the server:
   ```bash
   npm start
   ```

3. You should see:
   ```
   Server is running on port 5002
   Database connection established successfully.
   ```

## Alternative: Use SQLite for Development

If you continue having issues with MySQL, you can temporarily switch to SQLite:

1. Modify `config/database.js` to use SQLite:
   ```javascript
   const sequelize = new Sequelize({
     dialect: 'sqlite',
     storage: './database.sqlite'
   });
   ```

2. Install SQLite dependency:
   ```bash
   npm install sqlite3
   ```

This will create a local SQLite file and avoid MySQL connection issues entirely.