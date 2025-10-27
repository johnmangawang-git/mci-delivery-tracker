/**
 * Simple local test server for Chart.js fix testing
 * Runs isolated from main application and Supabase
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080; // Using port 8080 for testing

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Server Error</h1>');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache' // Prevent caching during testing
            });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Add CORS headers for testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    console.log(`📡 ${req.method} ${pathname}`);
    
    // Route handling
    if (pathname === '/' || pathname === '/test') {
        // Serve the isolated test page
        serveFile('./test-chart-fix-isolated.html', res);
    } else if (pathname === '/chart-fix') {
        // Serve the chart fix script
        serveFile('./public/assets/js/chart-canvas-fix.js', res);
    } else if (pathname.startsWith('/public/')) {
        // Serve public assets
        const filePath = '.' + pathname;
        serveFile(filePath, res);
    } else if (pathname === '/status') {
        // Health check endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            message: 'Chart Fix Test Server Running',
            timestamp: new Date().toISOString(),
            port: PORT
        }));
    } else {
        // 404 for other routes
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <h1>404 - Not Found</h1>
            <p>Available routes:</p>
            <ul>
                <li><a href="/">/ - Chart Fix Test Page</a></li>
                <li><a href="/status">/status - Server Status</a></li>
            </ul>
        `);
    }
});

server.listen(PORT, () => {
    console.log('🚀 Chart Fix Test Server Started');
    console.log(`📍 Server running at: http://localhost:${PORT}`);
    console.log(`🧪 Test page: http://localhost:${PORT}/`);
    console.log(`📊 Status: http://localhost:${PORT}/status`);
    console.log('');
    console.log('🔧 This server is completely isolated from your main app');
    console.log('✅ No Supabase connections will be made');
    console.log('🛡️ Safe to test without affecting production data');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Chart Fix Test Server...');
    server.close(() => {
        console.log('✅ Server stopped successfully');
        process.exit(0);
    });
});

// Error handling
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try a different port or stop the other server');
    } else {
        console.error('❌ Server error:', err);
    }
});