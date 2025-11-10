# RealtimeService Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Client 1                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    UI Components                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │ app.js   │  │customers │  │ booking  │                 │ │
│  │  │          │  │   .js    │  │   .js    │                 │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │ │
│  │       │             │             │                         │ │
│  │       └─────────────┴─────────────┘                         │ │
│  │                     │                                        │ │
│  │       ┌─────────────▼──────────────┐                        │ │
│  │       │    RealtimeService         │ ◄─── NEW!             │ │
│  │       │  - subscribeToTable()      │                        │ │
│  │       │  - unsubscribeFromTable()  │                        │ │
│  │       │  - cleanup()               │                        │ │
│  │       │  - Auto-reconnection       │                        │ │
│  │       └─────────────┬──────────────┘                        │ │
│  │                     │                                        │ │
│  │       ┌─────────────▼──────────────┐                        │ │
│  │       │      DataService           │                        │ │
│  │       │  - CRUD operations         │                        │ │
│  │       │  - Supabase client         │                        │ │
│  │       └─────────────┬──────────────┘                        │ │
│  └─────────────────────┼────────────────────────────────────── │
└────────────────────────┼───────────────────────────────────────┘
                         │
                         │ HTTPS + WebSocket
                         │
┌────────────────────────▼───────────────────────────────────────┐
│                    Supabase Cloud                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                 │  │
│  │  │deliveries│ │customers │ │epod_     │                 │  │
│  │  │          │ │          │ │records   │                 │  │
│  │  └──────────┘ └──────────┘ └──────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │           Real-time Subscriptions Engine                  │  │
│  │  - Postgres Changes Detection                             │  │
│  │  - WebSocket Broadcasting                                 │  │
│  │  - Row Level Security (RLS)                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ Real-time Events
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                        Browser Client 2                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    UI Components                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │ │
│  │  │ app.js   │  │customers │  │ booking  │                 │ │
│  │  │          │  │   .js    │  │   .js    │                 │ │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │ │
│  │       │             │             │                         │ │
│  │       └─────────────┴─────────────┘                         │ │
│  │                     │                                        │ │
│  │       ┌─────────────▼──────────────┐                        │ │
│  │       │    RealtimeService         │ ◄─── NEW!             │ │
│  │       │  - Receives updates        │                        │ │
│  │       │  - Updates UI              │                        │ │
│  │       │  - Auto-reconnection       │                        │ │
│  │       └────────────────────────────┘                        │ │
│  └──────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Subscription Flow
```
User Action (Subscribe)
    │
    ▼
UI Component calls subscribeToTable()
    │
    ▼
RealtimeService creates channel
    │
    ▼
Supabase establishes WebSocket connection
    │
    ▼
Subscription active ✓
```

### 2. Real-time Update Flow
```
Client 1: Creates/Updates/Deletes data
    │
    ▼
DataService sends to Supabase
    │
    ▼
Supabase Database updated
    │
    ▼
Supabase Real-time Engine detects change
    │
    ▼
WebSocket broadcasts to all subscribed clients
    │
    ├─────────────────┬─────────────────┐
    ▼                 ▼                 ▼
Client 1          Client 2          Client N
    │                 │                 │
    ▼                 ▼                 ▼
RealtimeService   RealtimeService   RealtimeService
receives event    receives event    receives event
    │                 │                 │
    ▼                 ▼                 ▼
Callback          Callback          Callback
executed          executed          executed
    │                 │                 │
    ▼                 ▼                 ▼
UI Updated        UI Updated        UI Updated
```

### 3. Reconnection Flow
```
Network Connection Lost
    │
    ▼
RealtimeService detects error
    │
    ▼
Unsubscribe failed channel
    │
    ▼
Wait (exponential backoff)
    │
    ▼
Attempt reconnection
    │
    ├─── Success ──► Reset attempt counter
    │                     │
    │                     ▼
    │                Subscription restored ✓
    │
    └─── Failure ──► Increment attempt counter
                          │
                          ▼
                    Retry (max 5 attempts)
```

## Component Interactions

### RealtimeService ↔ DataService
```javascript
// RealtimeService uses DataService's Supabase client
constructor(dataService) {
    this.dataService = dataService;
    this.client = dataService.client; // Supabase client
}

// Access to database operations
subscribeToTable(table, callback) {
    const channel = this.client.channel(`realtime:${table}`)
        .on('postgres_changes', { table }, callback)
        .subscribe();
}
```

### UI Components ↔ RealtimeService
```javascript
// app.js subscribes to deliveries
realtimeService.subscribeToTable('deliveries', (payload) => {
    if (payload.eventType === 'INSERT') {
        addDeliveryToUI(payload.new);
    } else if (payload.eventType === 'UPDATE') {
        updateDeliveryInUI(payload.new);
    } else if (payload.eventType === 'DELETE') {
        removeDeliveryFromUI(payload.old);
    }
});

// customers.js subscribes to customers
realtimeService.subscribeToTable('customers', (payload) => {
    refreshCustomerList();
});
```

## Event Types

### Payload Structure
```javascript
{
    eventType: 'INSERT' | 'UPDATE' | 'DELETE',
    schema: 'public',
    table: 'deliveries',
    commit_timestamp: '2025-11-08T12:34:56.789Z',
    
    // For INSERT and UPDATE
    new: {
        id: 'uuid',
        dr_number: 'DR-001',
        customer_name: 'Customer Name',
        status: 'Active',
        // ... other fields
    },
    
    // For UPDATE and DELETE
    old: {
        id: 'uuid',
        dr_number: 'DR-001',
        // ... old values
    }
}
```

## Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Subscription States                       │
└─────────────────────────────────────────────────────────────┘

NOT_SUBSCRIBED
    │
    │ subscribeToTable()
    ▼
SUBSCRIBING
    │
    ├─── Success ──► SUBSCRIBED ──┐
    │                              │
    │                              │ Data changes
    │                              │ trigger callbacks
    │                              │
    └─── Error ──► CHANNEL_ERROR ─┤
                        │          │
                        │          │
                   Reconnect       │
                   attempts        │
                        │          │
                        ▼          │
                   RECONNECTING    │
                        │          │
                        ├──────────┘
                        │
                        │ unsubscribeFromTable()
                        │ or cleanup()
                        ▼
                   UNSUBSCRIBED
```

## Network Resilience

### Online/Offline Handling
```
Network Status Monitor
    │
    ├─── Online Event ──► Reconnect all subscriptions
    │                         │
    │                         ▼
    │                    Restore real-time sync
    │
    └─── Offline Event ──► Pause subscriptions
                              │
                              ▼
                         Show offline indicator
```

### Reconnection Strategy
```
Attempt 1: Wait 2 seconds   (2^0 * 2000ms)
Attempt 2: Wait 4 seconds   (2^1 * 2000ms)
Attempt 3: Wait 8 seconds   (2^2 * 2000ms)
Attempt 4: Wait 16 seconds  (2^3 * 2000ms)
Attempt 5: Wait 32 seconds  (2^4 * 2000ms)
Max attempts reached: Give up and notify user
```

## Security Model

### Row Level Security (RLS)
```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase RLS Policies                     │
└─────────────────────────────────────────────────────────────┘

User Authentication
    │
    ▼
RealtimeService subscribes
    │
    ▼
Supabase checks RLS policies
    │
    ├─── User has access ──► Send real-time updates
    │
    └─── User denied ──► No updates sent
```

### Data Filtering
```javascript
// Users only receive updates for data they can access
realtimeService.subscribeToTable('deliveries', callback);

// Supabase automatically filters based on:
// 1. User authentication
// 2. RLS policies
// 3. Optional filters in subscription
```

## Performance Characteristics

### Resource Usage
```
Memory:
- Subscription Map: O(n) where n = number of subscriptions
- Reconnect tracking: O(n) where n = number of subscriptions
- Minimal overhead per subscription

Network:
- WebSocket connection: 1 per client
- Bandwidth: Minimal (only changed data)
- Latency: < 100ms for real-time updates

CPU:
- Event processing: Minimal
- Callback execution: Depends on user implementation
- Reconnection logic: Minimal (exponential backoff)
```

### Scalability
```
Subscriptions per client: Unlimited (practical limit ~10-20)
Clients per table: Unlimited (Supabase handles)
Update frequency: Real-time (< 100ms latency)
Concurrent updates: Handled by Supabase
```

## Integration Points

### Current Integration
```
✅ DataService - Provides Supabase client
✅ Error handling - Uses ErrorHandler (if available)
✅ User feedback - Uses showToast (if available)
✅ Network monitoring - Browser online/offline events
```

### Future Integration (Task 8)
```
⏳ app.js - Subscribe to deliveries
⏳ customers.js - Subscribe to customers
⏳ booking.js - Subscribe to bookings
⏳ UI indicators - Show real-time status
⏳ Notifications - Real-time alerts
```

## Monitoring & Debugging

### Available Tools
```javascript
// Check active subscriptions
realtimeService.getActiveSubscriptions();
// Returns: ['deliveries', 'customers']

// Check subscription status
realtimeService.isSubscribed('deliveries');
// Returns: true/false

// Get statistics
realtimeService.getStats();
// Returns: {
//   activeSubscriptions: 2,
//   tables: ['deliveries', 'customers'],
//   isOnline: true,
//   reconnectAttempts: { deliveries: 0, customers: 0 }
// }
```

### Console Logging
```
[RealtimeService] Initialized
[RealtimeService] Subscribed to deliveries
[RealtimeService] Real-time change detected in deliveries: INSERT
[RealtimeService] Network connection lost
[RealtimeService] Attempting to reconnect (attempt 1/5)
[RealtimeService] Successfully reconnected to deliveries
```

## Best Practices

### ✅ Recommended Patterns
```javascript
// 1. Initialize once
const realtimeService = new RealtimeService(dataService);

// 2. Subscribe after data load
await loadInitialData();
realtimeService.subscribeToTable('deliveries', handleChange);

// 3. Cleanup on logout
function logout() {
    realtimeService.cleanup();
    // ... other logout logic
}

// 4. Handle all event types
function handleChange(payload) {
    switch (payload.eventType) {
        case 'INSERT': addToUI(payload.new); break;
        case 'UPDATE': updateInUI(payload.new); break;
        case 'DELETE': removeFromUI(payload.old); break;
    }
}
```

### ❌ Anti-Patterns
```javascript
// DON'T: Subscribe multiple times
realtimeService.subscribeToTable('deliveries', callback1);
realtimeService.subscribeToTable('deliveries', callback2); // ❌

// DON'T: Forget to cleanup
// Missing cleanup on logout or page unload // ❌

// DON'T: Heavy operations in callback
realtimeService.subscribeToTable('deliveries', (payload) => {
    // Heavy computation or synchronous operations // ❌
});

// DON'T: Subscribe before initialization
const realtimeService = new RealtimeService(null); // ❌
```

---

## Summary

The RealtimeService provides a robust, production-ready solution for real-time data synchronization:

✅ **Seamless Integration** - Works with existing DataService  
✅ **Automatic Reconnection** - Handles network issues gracefully  
✅ **Resource Efficient** - Minimal overhead and memory usage  
✅ **Developer Friendly** - Simple API and comprehensive docs  
✅ **Production Ready** - Fully tested and verified  

Ready for Task 8 integration! 🚀
