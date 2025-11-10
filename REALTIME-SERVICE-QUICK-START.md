# RealtimeService Quick Start Guide

## What is RealtimeService?

RealtimeService enables live data synchronization across all connected clients using Supabase real-time features. When data changes in the database, all subscribed clients receive instant updates.

## Quick Setup

### 1. Include the Script
```html
<script src="public/assets/js/dataService.js"></script>
<script src="public/assets/js/realtimeService.js"></script>
```

### 2. Initialize
```javascript
// Initialize DataService first
const dataService = new DataService();
await dataService.initialize();

// Create RealtimeService
const realtimeService = new RealtimeService(dataService);
```

### 3. Subscribe to Changes
```javascript
// Subscribe to deliveries table
realtimeService.subscribeToTable('deliveries', (payload) => {
    console.log('Change detected:', payload.eventType);
    console.log('New data:', payload.new);
    console.log('Old data:', payload.old);
    
    // Update your UI here
    refreshDeliveriesTable();
});
```

## Common Use Cases

### Auto-Refresh Delivery List
```javascript
// Subscribe when page loads
realtimeService.subscribeToTable('deliveries', (payload) => {
    // Reload deliveries when any change occurs
    loadActiveDeliveries();
});
```

### Show Real-Time Notifications
```javascript
realtimeService.subscribeToTable('deliveries', (payload) => {
    if (payload.eventType === 'INSERT') {
        showToast(`New delivery: ${payload.new.dr_number}`, 'success');
    } else if (payload.eventType === 'UPDATE') {
        showToast(`Delivery updated: ${payload.new.dr_number}`, 'info');
    }
});
```

### Update Specific UI Elements
```javascript
realtimeService.subscribeToTable('deliveries', (payload) => {
    switch (payload.eventType) {
        case 'INSERT':
            addDeliveryRow(payload.new);
            break;
        case 'UPDATE':
            updateDeliveryRow(payload.new);
            break;
        case 'DELETE':
            removeDeliveryRow(payload.old.id);
            break;
    }
});
```

### Listen to Specific Events Only
```javascript
// Only listen for new deliveries
realtimeService.subscribeToTable('deliveries', (payload) => {
    console.log('New delivery created:', payload.new);
}, {
    event: 'INSERT' // Only INSERT events
});

// Only listen for updates
realtimeService.subscribeToTable('deliveries', (payload) => {
    console.log('Delivery updated:', payload.new);
}, {
    event: 'UPDATE' // Only UPDATE events
});
```

## Cleanup

### Unsubscribe from Specific Table
```javascript
realtimeService.unsubscribeFromTable('deliveries');
```

### Cleanup All Subscriptions
```javascript
// Call when user logs out or page closes
realtimeService.cleanup();
```

### Auto-Cleanup on Page Unload
```javascript
window.addEventListener('beforeunload', () => {
    realtimeService.cleanup();
});
```

## Monitoring

### Check Active Subscriptions
```javascript
const tables = realtimeService.getActiveSubscriptions();
console.log('Subscribed to:', tables); // ['deliveries', 'customers']
```

### Check if Subscribed
```javascript
if (realtimeService.isSubscribed('deliveries')) {
    console.log('Already subscribed to deliveries');
}
```

### Get Statistics
```javascript
const stats = realtimeService.getStats();
console.log('Active subscriptions:', stats.activeSubscriptions);
console.log('Network status:', stats.isOnline);
console.log('Tables:', stats.tables);
```

## Error Handling

The service automatically handles:
- ✅ Connection drops (auto-reconnect)
- ✅ Network offline/online (auto-reconnect)
- ✅ Subscription errors (retry with backoff)
- ✅ Duplicate subscriptions (auto-unsubscribe old)

## Payload Structure

When a change occurs, your callback receives a payload:

```javascript
{
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    new: { /* new record data */ },      // For INSERT and UPDATE
    old: { /* old record data */ },      // For UPDATE and DELETE
    schema: 'public',
    table: 'deliveries',
    commit_timestamp: '2025-11-08T...'
}
```

## Best Practices

### ✅ DO
- Subscribe after initial data load
- Cleanup subscriptions on logout
- Use specific event filters when possible
- Handle all event types (INSERT, UPDATE, DELETE)
- Show user feedback for real-time updates

### ❌ DON'T
- Subscribe multiple times to the same table
- Forget to cleanup subscriptions
- Perform heavy operations in callbacks
- Ignore error handling
- Subscribe before DataService is initialized

## Example: Complete Integration

```javascript
// app.js
let realtimeService = null;

async function initializeApp() {
    // Initialize DataService
    const dataService = new DataService();
    await dataService.initialize();
    
    // Initialize RealtimeService
    realtimeService = new RealtimeService(dataService);
    
    // Load initial data
    await loadActiveDeliveries();
    
    // Subscribe to real-time updates
    realtimeService.subscribeToTable('deliveries', handleDeliveryChange);
    
    console.log('Real-time sync enabled');
}

function handleDeliveryChange(payload) {
    console.log('Delivery changed:', payload.eventType);
    
    // Show notification
    if (payload.eventType === 'INSERT') {
        showToast('New delivery added', 'success');
    }
    
    // Refresh the table
    loadActiveDeliveries();
}

// Cleanup on logout
function logout() {
    if (realtimeService) {
        realtimeService.cleanup();
    }
    // ... rest of logout logic
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (realtimeService) {
        realtimeService.cleanup();
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);
```

## Testing

Open `test-realtime-service.html` to:
1. Test all features interactively
2. Monitor real-time events
3. Simulate network issues
4. View subscription statistics

## Troubleshooting

### Not Receiving Updates?
1. Check if subscribed: `realtimeService.isSubscribed('table_name')`
2. Check network status: `realtimeService.getStats().isOnline`
3. Verify Supabase real-time is enabled for your table
4. Check browser console for errors

### Multiple Updates?
- Ensure you're not subscribing multiple times
- Use `isSubscribed()` before subscribing

### Connection Issues?
- The service auto-reconnects (up to 5 attempts)
- Check network connectivity
- Verify Supabase credentials

## Support

For issues or questions:
1. Check the completion report: `TASK-7-REALTIME-SERVICE-COMPLETION.md`
2. Run verification: `node verify-realtime-service.js`
3. Review test suite: `test-realtime-service.html`

---

**Ready to use!** The RealtimeService is production-ready and fully tested. Start by subscribing to your first table and watch the magic happen! ✨
