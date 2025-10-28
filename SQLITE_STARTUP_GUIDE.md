# SQLite Startup Guide for OSGB System

## Current Status
The application is running successfully with SQLite on port 5004.

## How to Run the Application with SQLite

### Method 1: Using the Batch File (Recommended)
```powershell
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
.\start-sqlite.bat
```

### Method 2: Manual Startup (PowerShell)
```powershell
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
$env:DB_DIALECT="sqlite"
$env:PORT="5004"
node server.js
```

### Method 3: Manual Startup (Command Prompt)
```cmd
cd c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend
set DB_DIALECT=sqlite
set PORT=5004
node server.js
```

## Verification

### Check if Server is Running
You can verify the server is running by accessing the health endpoint:
```
http://localhost:5004/health
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
- `http://localhost:5004/health` - Health check
- `http://localhost:5004/api/workplaces` - Workplaces API
- `http://localhost:5004/api/experts` - Experts API
- `http://localhost:5004/api/doctors` - Doctors API
- `http://localhost:5004/api/dsps` - DSPs API
- `http://localhost:5004/api/visits` - Visits API

## Database Information

### Database File Location
The SQLite database file is located at:
```
c:\Users\USER\OneDrive\Desktop\YAZILIM\PRO\OSGB_System\backend\database.sqlite
```

This file contains all your application data and can be backed up easily.

### Benefits of Using SQLite
1. **No Installation Required**: SQLite is included with the application
2. **Zero Configuration**: No need to set up a separate database server
3. **File-Based**: All data is stored in a single file
4. **Perfect for Development**: Works immediately for testing and development
5. **Full Functionality**: All application features work exactly the same as with MySQL

## Troubleshooting

### If You Get "Address Already In Use" Error
This means another instance of the server is already running. You can:

1. Check what's running on the port:
   ```powershell
   netstat -ano | findstr :5004
   ```

2. Kill the process if needed:
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. Or change the port in the [start-sqlite.bat](file:///C:/Users/USER/OneDrive/Desktop/YAZILIM/PRO/OSGB_System/backend/start-sqlite.bat) file to use a different port.

### If the Batch File Doesn't Work
Make sure you're using the correct syntax for your shell:
- In PowerShell: `.\start-sqlite.bat`
- In Command Prompt: `start-sqlite.bat`

## Next Steps

1. **Access the Frontend**: Start the frontend application to connect to this backend
2. **Create Initial Data**: Use the application UI to create your first records
3. **Explore APIs**: Use tools like Postman to interact with the REST APIs

The SQLite solution provides a fully functional development environment that requires no additional database setup.