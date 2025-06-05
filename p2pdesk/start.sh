#!/bin/bash

# P2P Desktop Application Development Server
echo "🚀 Starting P2P Desktop Application..."

# Kill any existing processes on port 8080
echo "Stopping any existing server on port 8080..."
pkill -f "node.*server" 2>/dev/null || true

# Change to p2pdesk directory
cd /app/p2pdesk

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build
npm run build:client

# Start the server
echo "🌐 Starting server on http://localhost:8080"
npm start
