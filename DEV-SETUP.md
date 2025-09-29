# MCI Delivery System - Development Setup

## Quick Start

### Option 1: Express Server (Recommended)
```bash
npm install
npm start
```
Then open: http://localhost:3000

### Option 2: Using the Start Scripts
**Windows:**
```bash
start-dev.bat
```

**Mac/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Option 3: Simple HTTP Server
```bash
npm run serve
```

## Available Scripts

- `npm start` - Start Express development server
- `npm run dev` - Same as start (alias)
- `npm run serve` - Use simple HTTP server
- `npm test` - Open browser to test environment

## Development Features

### Current Features Available:
✅ Delivery Booking System
✅ Analytics Dashboard
✅ Active Deliveries Tracking
✅ Delivery History
✅ Customer Management
✅ Interactive Warehouse Map
✅ Settings Panel

### Testing URLs:
- Main App: http://localhost:3000
- Booking: http://localhost:3000#booking
- Analytics: http://localhost:3000#analytics
- Warehouse Map: http://localhost:3000#warehouse-map

## File Structure
```
public/
├── index.html          # Main application
├── assets/
│   ├── js/
│   │   ├── main.js     # Core functionality
│   │   └── warehouse.js # Map functionality
│   └── css/
│       └── style.css   # Styles
└── ...

server.js               # Express development server
dev-config.json        # Development configuration
```

## Troubleshooting

### Port Already in Use
If port 3000 is busy, the server will automatically try the next available port.

### CORS Issues
The Express server includes CORS headers for development.

### Map Not Loading
Make sure you have internet connection for Leaflet map tiles.

## Browser Compatibility
- Chrome (Recommended)
- Firefox
- Safari
- Edge

## Development Tips
1. Use browser dev tools (F12) for debugging
2. Check console for any JavaScript errors
3. Network tab shows API calls and resource loading
4. Use responsive design mode to test mobile layout