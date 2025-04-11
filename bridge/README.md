# Vessel Management Bridge Application

This application serves as a bridge between the Vessel Management System web application and your database. It allows you to connect to the database, view vessel data, and synchronize information.

## Features

- Direct database connection to view vessel data
- Connection to the Vessel Management System API
- Automatic data synchronization
- Easy-to-use interface
- Persistence of connection settings

## Requirements

- Windows operating system
- .NET Framework 4.7.2 or higher
- MySQL database server
- Vessel Management System API running (NodeJS application)

## NuGet Packages Required

The following NuGet packages need to be installed:

- `MySql.Data` - For database connectivity
- `Newtonsoft.Json` - For JSON parsing

## Setup Instructions

1. **Create a new C# Windows Forms Application project in Visual Studio.**

2. **Add NuGet Packages**
   - Right-click on the project in Solution Explorer and select "Manage NuGet Packages"
   - Search for and install:
     - `MySql.Data`
     - `Newtonsoft.Json`

3. **Add the provided files to your project:**
   - `MainForm.cs` and `MainForm.Designer.cs` - The main application form
   - `Program.cs` - The application entry point
   - `App.config` - Application configuration
   - Create the Settings class in Properties folder

4. **Build and Run the application**

## Connecting to the Database

1. Enter your database connection details:
   - API URL: The URL where your Vessel Management System API is running
   - DB Host: Your MySQL database server address
   - DB Port: Your MySQL database server port (typically 3306)
   - DB Name: The name of your database
   - DB User: The username for your database
   - DB Password: The password for your database user

2. Click "Connect" to establish a connection.

3. Once connected, the application will display the current vessels in your database.

## Synchronization

The "Sync Vessels" button will synchronize data between the database and the web application. The application automatically refreshes data every 30 seconds when connected.

## Database Schema

The application expects a database table named `vessels` with the following structure:

```sql
CREATE TABLE IF NOT EXISTS vessels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection VARCHAR(20) NOT NULL,
    inspectionTiming VARCHAR(20) NOT NULL,
    vessels VARCHAR(100) NOT NULL,
    etb VARCHAR(20) NOT NULL,
    etd VARCHAR(20) NOT NULL,
    port VARCHAR(50) NOT NULL,
    comments TEXT,
    departed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

If the table doesn't exist, the application will create it automatically.

## Troubleshooting

- **Connection Issues**: Ensure your database server is running and accessible from your network.
- **API Connection**: Make sure the Vessel Management System API is running and accessible at the URL you specified.
- **Sync Issues**: Check the database credentials and permissions for the database user.
