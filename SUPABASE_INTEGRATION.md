# MCI Delivery Tracker - Supabase Integration

This document explains how the centralized database system works in the MCI Delivery Tracker application.

## How Data Synchronization Works

The application uses Supabase as a centralized database to synchronize data across multiple devices:

1. **User Authentication**: Each user has a unique account
2. **Data Isolation**: All data is associated with the user's account
3. **Cross-Device Sync**: When a user logs in from any device, they see the same data
4. **Offline Fallback**: If the database is unavailable, data is stored locally and synced when reconnected

## Database Schema

The application uses the following tables:

### 1. Profiles
Stores user profile information:
- `id` (UUID) - User ID from authentication
- `full_name` (TEXT) - User's full name
- `avatar_url` (TEXT) - URL to user's avatar
- `role` (TEXT) - User role (default: 'user')

### 2. Deliveries
Stores delivery information:
- `id` (SERIAL) - Primary key
- `dr_number` (TEXT) - Delivery receipt number
- `date` (TIMESTAMP) - Delivery date
- `origin` (TEXT) - Starting location
- `destination` (TEXT) - Ending location
- `distance` (NUMERIC) - Distance in kilometers
- `user_id` (UUID) - Reference to user

### 3. Customers
Stores customer information:
- `id` (SERIAL) - Primary key
- `company_name` (TEXT) - Company name
- `contact_person` (TEXT) - Contact person name
- `email` (TEXT) - Contact email
- `phone` (TEXT) - Contact phone
- `address` (TEXT) - Company address
- `account_type` (TEXT) - Type of account
- `status` (TEXT) - Customer status
- `user_id` (UUID) - Reference to user

### 4. Additional Costs
Stores additional costs for deliveries:
- `id` (SERIAL) - Primary key
- `delivery_id` (INTEGER) - Reference to delivery
- `description` (TEXT) - Cost description
- `amount` (NUMERIC) - Cost amount
- `created_at` (TIMESTAMP) - Creation timestamp

### 5. E-POD Records
Stores electronic proof of delivery records:
- `id` (SERIAL) - Primary key
- `dr_number` (TEXT) - Delivery receipt number
- `customer_name` (TEXT) - Customer name
- `customer_contact` (TEXT) - Customer contact
- `truck_plate` (TEXT) - Truck plate number
- `origin` (TEXT) - Starting location
- `destination` (TEXT) - Ending location
- `signature` (TEXT) - Base64 encoded signature
- `status` (TEXT) - Delivery status
- `signed_at` (TIMESTAMP) - Signature timestamp
- `user_id` (UUID) - Reference to user

### 6. Warehouses
Stores warehouse information:
- `id` (SERIAL) - Primary key
- `name` (TEXT) - Warehouse name
- `address` (TEXT) - Warehouse address
- `capacity` (INTEGER) - Storage capacity
- `current_utilization` (INTEGER) - Current usage

## Row Level Security (RLS)

All tables have Row Level Security policies to ensure users only see their own data:

- Users can only view, create, and update records associated with their user ID
- Authentication is required for all database operations
- Anonymous access is restricted

## Implementation Details

### Authentication Flow
1. User logs in through the login page
2. Supabase authentication validates credentials
3. User session is established
4. All subsequent database operations include the user ID

### Data Operations
The [dataService.js](public/assets/js/dataService.js) file handles all database operations:
- Automatically detects if Supabase is available
- Falls back to localStorage if database is unavailable
- Associates all records with the current user ID
- Handles errors gracefully

### Fallback Mechanism
If Supabase is unavailable:
1. Data is stored in localStorage
2. When connection is restored, data is synced to the database
3. Conflicts are handled by preserving the most recent data

## Testing the Integration

To test the Supabase integration:

1. Open [test-supabase-connection.html](public/test-supabase-connection.html) in your browser
2. Click "Run Tests" to verify the connection
3. Check the results for any issues

## Using the Application Across Devices

To use the application with synchronized data across multiple devices:

1. Create an account on one device
2. Add some delivery data
3. Log in with the same account on another device
4. Verify that the data appears on the second device

The synchronization happens automatically when you're connected to the internet and logged in.

## Troubleshooting

Common issues and solutions:

### 1. Data not syncing between devices
- Ensure you're logged in with the same account
- Check your internet connection
- Verify that the Supabase configuration is correct

### 2. Seeing old data
- Refresh the page to force a data reload
- Check if there are any network connectivity issues

### 3. Database connection errors
- Verify the Supabase URL and anon key in the HTML files
- Check if the Supabase project is active
- Ensure the database tables have been created

## Configuration

The Supabase configuration is set in the HTML files:
- [index.html](public/index.html)
- [login.html](public/login.html)

Make sure these values match your Supabase project settings:
```javascript
window.SUPABASE_URL = 'your-project-url.supabase.co';
window.SUPABASE_ANON_KEY = 'your-anon-key';
```

## Database Migrations

The database schema is defined in SQL migration files:
- [20231001000000_init.sql](supabase/migrations/20231001000000_init.sql)
- [20231001000001_add_epod_table.sql](supabase/migrations/20231001000001_add_epod_table.sql)

These files can be used to set up the database schema in a new Supabase project.