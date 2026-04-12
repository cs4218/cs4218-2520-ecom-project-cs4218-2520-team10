#!/bin/bash

# Spike Test Execution Script
# Created by - YAN WEIDONG A0258151H
# 
# Usage:
#   ./run-spike-tests.sh                          # Run all spike tests
#   ./run-spike-tests.sh <test-file-path>         # Run specific test file
#
# Examples:
#   npm run test:spike                                    # Run all spike tests
#   npm run test:spike -- tests/spike/spike-search-filter.js  # Run specific test
#   bash tests/spike/run-spike-tests.sh tests/spike/spike-search-filter.js

# Don't exit on error - we want to run all tests and track failures
set +e

echo "🚀 Starting Spike Test Execution"
echo "===================================="

# Step 1: Seed database with spike test data
echo ""
echo "📊 Seeding database with spike test data..."
USE_SPIKE_DATA=true npm run test:nft:seed
if [ $? -ne 0 ]; then
  echo "❌ Database seeding failed"
  exit 1
fi

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

# Step 4: Discover and run spike test files
echo ""
SPIKE_DIR="tests/spike"

# Check if a specific test file was provided as argument
if [ -n "$1" ]; then
  echo "🎯 Running specific test file: $1"
  
  # Validate file exists
  if [ ! -f "$1" ]; then
    echo "❌ Test file not found: $1"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
  
  # Run only the specified test
  SPIKE_TESTS=("$1")
  TOTAL_TESTS=1
else
  # Run all spike tests
  echo "🔍 Discovering spike test files..."
  
  # Find all spike-*.js files, excluding suite files
  SPIKE_TESTS=($(find "$SPIKE_DIR" -maxdepth 1 -name "spike-*.js" | sort))
  TOTAL_TESTS=${#SPIKE_TESTS[@]}

  if [ $TOTAL_TESTS -eq 0 ]; then
    echo "⚠️  No spike test files found matching pattern: spike-*.js"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi

  echo "Found $TOTAL_TESTS spike test file(s)"
fi

echo ""

# Create reports directory
REPORT_DIR="test-results/spike"
mkdir -p "$REPORT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Track test results
FAILED_TESTS=()
PASSED_TESTS=()
TEST_NUMBER=0

# Run each spike test sequentially
for TEST_FILE in "${SPIKE_TESTS[@]}"; do
  TEST_NUMBER=$((TEST_NUMBER + 1))
  TEST_NAME=$(basename "$TEST_FILE" .js)
  
  echo "===================================="
  echo "🧪 Running test $TEST_NUMBER/$TOTAL_TESTS: $TEST_NAME"
  echo "===================================="
  
  # Generate unique report name with timestamp
  REPORT_FILE="$REPORT_DIR/${TEST_NAME}_${TIMESTAMP}.html"
  
  # Run k6 with HTML report output
  K6_WEB_DASHBOARD_PERIOD=1s K6_WEB_DASHBOARD=true \
    k6 run "$TEST_FILE" \
    --summary-export="$REPORT_DIR/${TEST_NAME}_${TIMESTAMP}.json"
  
  K6_EXIT_CODE=$?
  
  if [ $K6_EXIT_CODE -eq 0 ]; then
    echo "✅ $TEST_NAME passed"
    PASSED_TESTS+=("$TEST_NAME")
  else
    echo "❌ $TEST_NAME failed (exit code: $K6_EXIT_CODE)"
    FAILED_TESTS+=("$TEST_NAME")
  fi

  # Cooldown period between tests (except after the last test)
  if [ $TEST_NUMBER -lt $TOTAL_TESTS ]; then
    echo "⏸️  Cooldown period: waiting 10s for server to stabilize..."
    sleep 10
  fi
  
  echo ""
done

# Step 5: Cleanup - Kill server process
echo "===================================="
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

# Step 6: Print summary
echo ""
echo "===================================="
echo "📊 Spike Test Summary"
echo "===================================="
echo "Total tests: $TOTAL_TESTS"
echo "Passed: ${#PASSED_TESTS[@]}"
echo "Failed: ${#FAILED_TESTS[@]}"
echo ""

if [ ${#PASSED_TESTS[@]} -gt 0 ]; then
  echo "✅ Passed tests:"
  for test in "${PASSED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
fi

if [ ${#FAILED_TESTS[@]} -gt 0 ]; then
  echo "❌ Failed tests:"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  - $test"
  done
  echo ""
  echo "Reports saved to: $REPORT_DIR/"
  exit 1
fi

echo "✅ All spike tests passed!"
echo "Reports saved to: $REPORT_DIR/"
exit 0
