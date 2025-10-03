const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8107; // Changed to port 8107 to avoid conflicts

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});