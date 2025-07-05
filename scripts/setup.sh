#!/bin/bash

# Setup script for Windows Explorer Web Application

echo "Setting up Windows Explorer Web Application..."

# Create directories if they don't exist
mkdir -p /app/logs
mkdir -p /app/backend
mkdir -p /app/frontend

# Set permissions
chmod +x /app/scripts/setup.sh
chmod +x /app/scripts/start.sh

# Install backend dependencies
echo "Installing backend dependencies..."
cd /app/backend
pip install -r requirements.txt

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd /app/frontend
yarn install

# Build frontend for production
echo "Building frontend..."
yarn build

echo "Setup complete!"