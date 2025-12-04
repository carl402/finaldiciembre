#!/bin/bash
echo "🚀 Building Take a Look system..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Build client
echo "🎨 Building React client..."
cd client
npm install
npm run build
cd ..

echo "✅ Build completed successfully!"