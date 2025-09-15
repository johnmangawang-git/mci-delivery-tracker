const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8095; // Changed to 8095 to avoid conflicts

// For Node.js 18+, fetch is built-in. For older versions, we need to import it.
let fetch;
if (!global.fetch) {
    fetch = require('node-fetch');
} else {
    fetch = global.fetch;
}

// Serve static files from public directory
app.use(express.static('public'));

// Proxy endpoint for Nominatim API to avoid CORS issues
app.get('/api/geocode', async (req, res) => {
    try {
        const { q, limit = 5 } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        // Use Nominatim API with proper identification
        const appEmail = 'mci-delivery-tracker@example.com';
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&email=${appEmail}&limit=${limit}&addressdetails=1&countrycodes=ph`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MCI-Delivery-Tracker/1.0 (mci-delivery-tracker@example.com)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform Nominatim results to match expected format
        const transformedData = data.map(result => ({
            lat: result.lat,
            lng: result.lon,
            display_name: result.display_name,
            place_id: result.place_id,
            importance: result.importance
        }));

        res.json(transformedData);
    } catch (error) {
        console.error('Error fetching geocoding data from Nominatim:', error);
        res.status(500).json({ error: 'Failed to fetch geocoding data' });
    }
});

// Handle SPA routing - serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 MCI Delivery System running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://192.168.1.x:${PORT}`);
    console.log(`\n📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`\n🛑 Press Ctrl+C to stop the server`);
});