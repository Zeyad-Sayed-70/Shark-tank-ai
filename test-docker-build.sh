#!/bin/bash

# Script to test Docker build locally before pushing to GitHub

echo "🔨 Testing Docker build..."

# Build the image
echo "Building Docker image..."
docker build -t shark-tank-ai:test .

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Show image size
    echo ""
    echo "📦 Image size:"
    docker images shark-tank-ai:test
    
    echo ""
    echo "🚀 To run the container:"
    echo "docker run -p 3000:3000 --env-file .env shark-tank-ai:test"
    echo ""
    echo "🧪 To test health endpoint:"
    echo "curl http://localhost:3000/health"
else
    echo "❌ Build failed!"
    echo ""
    echo "Try the alternative Dockerfile:"
    echo "docker build -f Dockerfile.alternative -t shark-tank-ai:test ."
    exit 1
fi
