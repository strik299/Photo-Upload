#!/bin/bash
# Exit on error
set -o errexit

echo "🚀 Starting Build Process..."

# 1. Install Python Dependencies
echo "📦 Installing Python dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# 2. Install Node Dependencies & Build Frontend
echo "⚛️ Building Frontend..."
cd ../frontend
npm install
npm run build

# 3. Move Build Artifacts to Backend
echo "🚚 Moving build files to backend..."
# Ensure destination exists
mkdir -p ../backend/static
# Remove old build if exists
rm -rf ../backend/static/*
# Copy new build
cp -r dist/* ../backend/static/

echo "✅ Build Complete!"
