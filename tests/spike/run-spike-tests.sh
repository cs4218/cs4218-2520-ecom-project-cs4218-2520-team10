#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Spike Test Orchestration"
echo "===================================="

# Step 1: Seed database with spike test data
echo ""
echo "📊 Seeding database with spike test data..."
USE_SPIKE_DATA=true npm run test:nft:seed

# Step 2: Start server in background
echo ""
echo "🔧 Starting server..."
npm run server > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Step 3: Wait for server to be ready
echo ""
echo "⏳ Waiting for server to be ready..."
MAX_RETRIES=30
RETRY_COUNT=0
SERVER_URL="http://localhost:6060/health"

until curl -s -f "$SERVER_URL" > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "  Attempt $RETRY_COUNT/$MAX_RETRIES..."
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Server failed to start within 30 seconds"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

echo "✅ Server is ready!"

# Step 4: Run k6 spike tests
echo ""
echo "🧪 Running k6 spike tests..."
echo "===================================="
K6_WEB_DASHBOARD_PERIOD=1s K6_WEB_DASHBOARD=true k6 run tests/spike/spike-tests.suite.js
K6_EXIT_CODE=$?

# Step 5: Cleanup - Kill server process
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

# Exit with k6's exit code
if [ $K6_EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All spike tests passed!"
  exit 0
else
  echo ""
  echo "❌ Some spike tests failed (exit code: $K6_EXIT_CODE)"
  exit $K6_EXIT_CODE
fi
