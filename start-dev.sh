#!/bin/bash

echo "🚀 Starting MCI Delivery System Development Server..."
echo ""
echo "Choose your preferred method:"
echo "1. Express Server (Recommended)"
echo "2. Simple HTTP Server (serve)"
echo "3. Python HTTP Server (if Python installed)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "Starting Express server..."
        node server.js
        ;;
    2)
        echo "Starting serve..."
        npx serve public -p 3000
        ;;
    3)
        echo "Starting Python server..."
        cd public
        python3 -m http.server 3000
        ;;
    *)
        echo "Invalid choice. Starting Express server by default..."
        node server.js
        ;;
esac