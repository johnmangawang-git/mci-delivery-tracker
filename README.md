# MCI Delivery Tracker

A comprehensive delivery management system with e-signature capabilities, real-time tracking, and complete delivery lifecycle management.

## 🚀 Features

### Core Functionality
- **📦 Delivery Management** - Create, track, and manage deliveries
- **🖊️ E-Signature Integration** - Complete digital signature workflow
- **📊 Real-time Dashboard** - Live analytics and metrics
- **📍 GPS Tracking** - Location-based delivery tracking
- **📋 Delivery History** - Complete audit trail of completed deliveries
- **📄 Export Capabilities** - PDF and Excel export functionality

### Advanced Features
- **🔄 Auto-refresh** - Real-time data updates
- **✅ Status Management** - Dynamic delivery status tracking
- **🏢 Customer Management** - Integrated customer database
- **🚛 Vehicle Tracking** - Truck and driver management
- **📱 Responsive Design** - Mobile-friendly interface
- **🔐 Data Persistence** - Reliable localStorage with backup
- **☁️ Cloud-First Storage** - Supabase-primary with offline resilience (NEW)

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Modern semantic markup
- **CSS3** - Responsive design with Bootstrap 5
- **JavaScript (ES6+)** - Modern JavaScript features
- **Bootstrap 5** - UI framework
- **Leaflet.js** - Interactive maps
- **Chart.js** - Data visualization

### Backend & Data
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Supabase** - Cloud database (PostgreSQL) - **Single source of truth**
- **Real-time Subscriptions** - Live data synchronization

### Architecture
- **Database-Centric Design** - Supabase as single source of truth
- **No localStorage for Business Data** - All data persisted in cloud database
- **Real-time Sync** - Instant updates across all connected clients
- **Async-First** - All data operations are asynchronous
- **Service Layer Pattern** - Clean separation of concerns

### Libraries & Dependencies
- **Bootstrap Icons** - Icon library
- **Signature Pad** - Digital signature capture
- **XLSX** - Excel file processing
- **Leaflet** - Map functionality
- **Supabase Client** - Cloud database integration

## 📁 Project Structure

```
mci-delivery-tracker/
├── public/                     # Frontend assets
│   ├── assets/
│   │   ├── css/               # Stylesheets
│   │   │   ├── style.css      # Main styles
│   │   │   └── leaflet.css    # Map styles
│   │   └── js/                # JavaScript files
│   │       ├── app.js         # Main application logic
│   │       ├── booking.js     # Booking management
│   │       ├── customers.js   # Customer management
│   │       ├── analytics.js   # Analytics and reporting
│   │       │
│   │       ├── dataService.js        # Data access layer (Supabase)
│   │       ├── realtimeService.js    # Real-time subscriptions
│   │       ├── cacheService.js       # In-memory caching
│   │       ├── networkStatusService.js # Network monitoring
│   │       │
│   │       ├── dataValidator.js      # Input validation
│   │       ├── errorHandler.js       # Error handling
│   │       └── logger.js             # Logging service
│   │
│   ├── migration-tool.html    # Data migration utility
│   └── index.html             # Main application page
│
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # Architecture overview
│   ├── DATASERVICE-API.md     # DataService API docs
│   └── MIGRATION-GUIDE.md     # Migration guide
│
├── tests/                     # Test files
│   ├── dataService.test.js    # Unit tests
│   ├── integration-workflows.test.js # Integration tests
│   └── README.md              # Testing guide
│
├── supabase/                  # Database schema and migrations
│   ├── schema.sql             # Database schema
│   └── migrations/            # Migration scripts
│
├── package.json              # Node.js dependencies
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnmangawang-git/mci-delivery-tracker.git
   cd mci-delivery-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   ./start-dev.sh  # Linux/Mac
   ./start-dev.bat # Windows
   ```

4. **Open your browser**
   ```
   http://localhost:8086
   ```

## 📖 Usage Guide

### Creating a New Delivery
1. Navigate to **Active Deliveries**
2. Click **"Add New Booking"**
3. Fill in delivery details:
   - DR Number
   - Customer Information
   - Pickup and Delivery Locations
   - Vehicle Information
4. Click **"Save Booking"**

### E-Signature Process
1. Select delivery from **Active Deliveries**
2. Click **"E-Signature"** button
3. Complete the digital signature
4. Click **"Save Signature"**
5. Delivery automatically moves to **Delivery History**

### Viewing Reports
1. Navigate to **Analytics** section
2. View real-time metrics and charts
3. Export data using **Export** buttons
4. Generate PDF reports for completed deliveries

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=8086
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database-Centric Architecture

The application follows a **database-centric architecture** with Supabase as the single source of truth:

1. **Single Source of Truth**: All business data stored exclusively in Supabase
2. **No localStorage**: Business data is NOT stored in localStorage (only UI preferences)
3. **Real-time Sync**: Instant updates across all connected clients
4. **Async Operations**: All data operations are asynchronous
5. **Service Layer**: Clean separation between UI and data access

**Key Services:**
- `DataService` - Unified interface for all database operations
- `RealtimeService` - Real-time data synchronization
- `CacheService` - In-memory caching for performance
- `NetworkStatusService` - Network connectivity monitoring
- `DataValidator` - Input validation before database operations
- `ErrorHandler` - Centralized error handling
- `Logger` - Logging and monitoring

**See [Architecture Documentation](./docs/ARCHITECTURE.md) for details.**

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- dataService.test.js
npm test -- integration-workflows.test.js

# Run tests in watch mode
npm test -- --watch
```

### Test Suites
- **Unit Tests** (`tests/dataService.test.js`) - Test individual DataService methods
- **Integration Tests** (`tests/integration-workflows.test.js`) - Test complete workflows
- **Manual Tests** - HTML test files for browser testing

### Manual Testing
1. Open test files in browser (e.g., `test-dataservice-unit-tests.html`)
2. Follow on-screen instructions
3. Verify functionality works as expected

**See [Testing Guide](./tests/README.md) for detailed testing instructions.**

## 🐛 Troubleshooting

### Common Issues

**"DataService not initialized" error:**
- Ensure `dataService.initialize()` is called before any operations
- Check browser console for Supabase client errors
- Verify Supabase credentials in environment variables

**Data not loading:**
- Check network connectivity (look for offline indicator)
- Verify Supabase connection in browser console
- Check browser console for error messages
- Verify data exists in Supabase dashboard

**Slow performance:**
- Check network speed
- Verify database indexes are in place
- Consider implementing pagination for large datasets
- Check CacheService is working properly

**Real-time updates not working:**
- Verify RealtimeService is initialized
- Check Supabase real-time is enabled
- Look for subscription errors in console
- Test in multiple browser tabs

### Debug Tools
- Browser Developer Tools (F12)
- Supabase Dashboard (check data and logs)
- Logger service (check application logs)
- Network tab (monitor API calls)

**See [Migration Guide](./docs/MIGRATION-GUIDE.md) for migration-specific troubleshooting.**

## 📊 Performance

### Optimization Features
- **In-Memory Caching** - CacheService for frequently accessed data (60s TTL)
- **Pagination** - Load large datasets in chunks (50 records per page)
- **Optimistic UI Updates** - Immediate feedback with background sync
- **Database Indexes** - Optimized queries for fast data retrieval
- **Efficient Rendering** - Minimal DOM manipulation
- **Responsive Design** - Mobile-optimized
- **Real-time Updates** - Instant synchronization across clients

### Performance Targets
- **Initial Load**: < 3 seconds
- **CRUD Operations**: < 1 second
- **Real-time Updates**: < 500ms
- **Page Navigation**: < 200ms

### Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📚 Documentation

### Core Documentation
- **[Architecture Overview](./docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[DataService API](./docs/DATASERVICE-API.md)** - Complete API reference for DataService
- **[Migration Guide](./docs/MIGRATION-GUIDE.md)** - Guide for migrating from localStorage

### Additional Documentation
- **[Error Handling Guide](./ERROR-HANDLING-GUIDE.md)** - Error handling patterns
- **[Testing Guide](./tests/README.md)** - Testing strategies and examples
- **[Query Optimization Guide](./QUERY-OPTIMIZATION-GUIDE.md)** - Database query optimization

## 🔄 Migration from localStorage

If you're upgrading from a previous version that used localStorage:

1. **Backup your data** - Export localStorage data using migration tool
2. **Run migration** - Use `public/migration-tool.html` to migrate data to Supabase
3. **Verify data** - Check Supabase dashboard to ensure all data migrated
4. **Clear localStorage** - Remove old localStorage data after verification

**See [Migration Guide](./docs/MIGRATION-GUIDE.md) for detailed instructions.**

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Follow the database-centric architecture patterns
2. All data operations must go through DataService
3. Add proper error handling and logging
4. Write tests for new features
5. Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.