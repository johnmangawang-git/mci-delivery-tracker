# MCI Delivery Tracker - Centralized Database Usage Instructions

This document explains how to use the centralized database feature that allows your data to sync across multiple devices.

## What This Feature Does

The centralized database feature ensures that:
- All your delivery data is stored in the cloud
- When you log in from any device, you see the same data
- Changes made on one device appear on all other devices
- Data is never lost, even if a device is lost or damaged

## How to Use This Feature

### Initial Setup (One-time only)
1. Follow the setup guide in [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Create a Supabase account and project
3. Configure your application with the correct Supabase credentials
4. Set up the database tables using the provided SQL files

### Daily Usage
1. **Log In**: Open the application and log in with your credentials
2. **Use the App**: Add deliveries, customers, and E-POD records as normal
3. **Switch Devices**: Log in with the same credentials on any other device
4. **See Synced Data**: All your data will be there automatically

## Step-by-Step Example

### On Your Work Laptop:
1. Open the MCI Delivery Tracker
2. Log in with your email and password
3. Add a new delivery with DR Number: DR-001
4. Add customer information
5. Close the application

### On Your Home Laptop:
1. Open the MCI Delivery Tracker
2. Log in with the same email and password
3. Observe that DR-001 appears in your deliveries list
4. Add another delivery with DR Number: DR-002
5. Close the application

### Back on Your Work Laptop:
1. Open the MCI Delivery Tracker
2. Log in with your email and password
3. Observe that both DR-001 and DR-002 appear in your deliveries list

## Offline Usage

The application works even when you're offline:
1. Data is temporarily stored on your device
2. When you reconnect to the internet, data automatically syncs
3. No data is lost during offline periods

## Troubleshooting Common Issues

### Issue: I don't see my data on another device
**Solution**:
1. Ensure you're logged in with the same account
2. Check your internet connection
3. Refresh the page (Ctrl+F5 or Cmd+R)

### Issue: Data isn't syncing immediately
**Solution**:
1. The application syncs data automatically
2. If there's a delay, try refreshing the page
3. Check that your Supabase configuration is correct

### Issue: I see old data
**Solution**:
1. Refresh the page to force a data reload
2. Check your internet connection
3. Verify that you're logged in with the correct account

## Best Practices

1. **Always Log Out**: When using shared computers, always log out when finished
2. **Use Strong Passwords**: Protect your data with a strong, unique password
3. **Regular Backups**: While data is stored in the cloud, consider backing up important information
4. **Keep Software Updated**: Use the latest version of the application for best performance

## Security Features

1. **User Isolation**: Your data is completely separate from other users' data
2. **Encrypted Connection**: All data is transmitted securely over HTTPS
3. **Authentication**: Only you can access your data with your credentials
4. **Row Level Security**: Database-level protection ensures data isolation

## What Data is Synced

The following data types are synchronized across devices:
- Delivery records (including DR numbers, destinations, etc.)
- Customer information
- E-POD signatures and records
- Additional costs
- User preferences and settings

## Limitations

1. **Internet Required for Sync**: Data sync requires an internet connection
2. **Same Account Required**: You must use the same login credentials on all devices
3. **Database Size Limits**: Free Supabase tier has storage limitations

## Getting Help

If you experience issues with data synchronization:
1. Check the [SETUP_GUIDE.md](SETUP_GUIDE.md) for configuration instructions
2. Review the [SUPABASE_INTEGRATION.md](SUPABASE_INTEGRATION.md) for technical details
3. Run the connection test at [test-supabase-connection.html](public/test-supabase-connection.html)
4. Contact support if problems persist