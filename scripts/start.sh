#!/bin/bash

# Start script for Windows Explorer Web Application

echo "Starting Windows Explorer Web Application..."

# Start backend server
echo "Starting backend server..."
cd /app/backend
python server.py &

# Start frontend development server (for development)
echo "Starting frontend development server..."
cd /app/frontend
yarn start &

echo "Services started!"
echo "Backend API: http://localhost:8001"
echo "Frontend: http://localhost:3000"