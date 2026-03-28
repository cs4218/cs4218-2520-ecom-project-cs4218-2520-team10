#!/bin/bash
# Automated spike test runner
# Seeds database, starts server, runs k6 tests, then cleans up

set -e  # Exit on error

# Configuration
API_URL="${API_URL:-http://localhost:6060/api/v1}"
PORT="${PORT:-6060}"
TIMEOUT=30  # seconds to wait for server

echo "🔧 Setting up spike test environment..."

# 1. Seed database with spike data
echo "📦 Seeding database with spike data..."
USE_SPIKE_DATA=true node tests/db-seed.js
if [ $? -ne 0 ]; then
    echo "❌ Database seeding failed"
    exit 1
fi

# 2. Start server in silent mood
echo "🚀 Starting server on port $PORT..."
PORT=$PORT npm run server > /dev/null 2>&1 &
SERVER_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        # Kill any remaining node processes on the port
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    fi
}

# Register cleanup on script exit
trap cleanup EXIT INT TERM

# 3. Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
COUNTER=0
until curl -s http://localhost:$PORT/api/v1/health > /dev/null 2>&1; do
    COUNTER=$((COUNTER+1))
    if [ $COUNTER -gt $TIMEOUT ]; then
        echo "❌ Server failed to start within ${TIMEOUT}s"
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""
echo "✅ Server is ready!"

# 4. Run k6 spike tests
echo "🔥 Running k6 spike tests..."
API_URL=$API_URL k6 run tests/spike/spike-tests-suite.js

# Capture k6 exit code
K6_EXIT_CODE=$?

if [ $K6_EXIT_CODE -eq 0 ]; then
    echo "✅ Spike tests completed successfully!"
else
    echo "❌ Spike tests failed with exit code $K6_EXIT_CODE"
fi

# Cleanup happens automatically via trap
exit $K6_EXIT_CODE
