# Testing Supabase Integration

This document explains how to test that your Supabase integration is working correctly for cross-device data synchronization.

## Prerequisites

1. Python 3.x installed on your system (comes pre-installed on most modern systems)
2. Your Supabase account is already set up (which it is based on your .env file)

## Testing Steps

### 1. Start the Local Server

Double-click on the `start-server.bat` file, or run it from the command line:

```
start-server.bat
```

This will start a simple HTTP server on port 8000.

### 2. Open the Verification Page

Open your web browser and navigate to:

```
http://localhost:8000/verify-supabase.html
```

### 3. Run the Verification Tests

Click the "Run Verification Tests" button to check:

1. Supabase client initialization
2. Data service initialization
3. Database connectivity
4. User authentication status
5. Data creation capabilities

### 4. Expected Results

If everything is working correctly, you should see:

- Green checkmarks for all tests
- A message indicating Supabase is available (not using localStorage fallback)
- Successful data creation and cleanup

### 5. Testing Cross-Device Synchronization

To test that data syncs across devices:

1. Open the application on Device 1 (your current computer)
2. Log in with your credentials
3. Create a test delivery record
4. Open the application on Device 2 (another computer or browser)
5. Log in with the same credentials
6. Verify that the test delivery record appears on Device 2

## Troubleshooting

### If Tests Fail

1. **Connection Failed**: Check your internet connection and Supabase credentials in the .env file
2. **Authentication Issues**: Make sure you've created a user account through the login page
3. **Table Not Found**: Ensure you've run the database migrations

### If Data Doesn't Sync

1. Ensure you're logged in with the same account on both devices
2. Check that both devices have internet connectivity
3. Refresh the page on the second device to force data reload

## How It Works

The application automatically syncs data across devices through these mechanisms:

1. **User Authentication**: All data is associated with your user account
2. **Database Storage**: Data is stored in Supabase tables with Row Level Security
3. **Automatic Sync**: When you make changes on one device, they're immediately stored in the database
4. **Cross-Device Retrieval**: When you log in on another device, data is fetched from the database

## Database Tables

The following tables should exist in your Supabase database:

- `profiles` - User profile information
- `deliveries` - Delivery records
- `customers` - Customer information
- `additional_costs` - Additional cost records
- `e_pod_records` - Electronic proof of delivery records
- `warehouses` - Warehouse information

## Security

Your data is secure because:

1. Each user can only access their own data (Row Level Security)
2. All communication is encrypted (HTTPS)
3. Authentication is required for all database operations

## Next Steps

Once you've verified that the integration is working:

1. Start using the application normally
2. All data will automatically sync across your devices
3. If you go offline, data will be stored locally and synced when you reconnect