// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Category Endpoints
 * Tests category browsing endpoints under extreme load with recovery tracking
 *
 * Key considerations:
 * - Category endpoints are lightweight read operations (no bcrypt, no writes)
 * - Tighter thresholds compared to auth endpoints due to simpler operations
 * - Tests both list-all and single-category lookups
 * - All endpoints are public (no authentication required)
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, CATEGORY_SLUGS } from "./constants.js";
import {
  measureBaselineLatency,
  trackRecovery,
  recordPhaseMetrics,
} from "./utils.js";

// Custom metrics to track latency during different phases and recovery time
const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");
const timeToRecoveryTrend = new Trend("time_to_recovery_seconds");

// Shared spike profile
// 250 VUs per scenario -> ~500 VUs total combined load
const spikeStages = [
  { duration: "10s", target: 10 }, // Initial ramp to baseline
  { duration: "1m", target: 10 }, // Baseline hold
  { duration: "10s", target: 250 }, // Spike ramp up
  { duration: "1m", target: 250 }, // Spike hold
  { duration: "10s", target: 10 }, // Spike ramp down
  { duration: "1m", target: 10 }, // Recovery hold
];

export const options = {
  scenarios: {
    // Scenario 1: Get all categories
    "get-all-categories-spike": {
      executor: "ramping-vus",
      exec: "testGetAllCategories",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "get-all-categories" },
    },
    // Scenario 2: Get single category by slug
    "single-category-spike": {
      executor: "ramping-vus",
      exec: "testSingleCategory",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "single-category" },
    },
  },
  thresholds: {
    // Global error rate: <1%
    http_req_failed: ["rate<0.01"],
    "http_req_failed{endpoint:get-all-categories}": ["rate<0.01"],
    "http_req_failed{endpoint:single-category}": ["rate<0.01"],

    // Baseline thresholds - tighter than auth due to lightweight operations
    duration_baseline_phase: ["p(90)<200"],
    "duration_baseline_phase{endpoint:get-all-categories}": ["p(90)<200"],
    "duration_baseline_phase{endpoint:single-category}": ["p(90)<200"],

    // Spike thresholds - acceptable degradation under extreme load
    duration_spike_phase: ["p(90)<5000"],
    "duration_spike_phase{endpoint:get-all-categories}": ["p(90)<5000"],
    "duration_spike_phase{endpoint:single-category}": ["p(90)<5000"],

    // Recovery thresholds - must return to near-baseline
    duration_recovery_phase: ["p(90)<300"],
    "duration_recovery_phase{endpoint:get-all-categories}": ["p(90)<300"],
    "duration_recovery_phase{endpoint:single-category}": ["p(90)<300"],

    // Time-to-recovery thresholds - Use min to find first successful recovery across VUs
    time_to_recovery_seconds: ["min<30"],
    "time_to_recovery_seconds{endpoint:get-all-categories}": ["min<30"],
    "time_to_recovery_seconds{endpoint:single-category}": ["min<30"],
  },
};

// Setup function: Measure baseline latency for each endpoint before test starts
export function setup() {
  const startTime = Date.now();

  const baselineLatency = {
    "get-all-categories": measureBaselineLatency(
      `${BASE_URL}/category/get-category`,
    ),
    "single-category": measureBaselineLatency(
      `${BASE_URL}/category/single-category/${CATEGORY_SLUGS[0]}`,
    ),
  };

  return {
    startTime,
    baselineLatency,
  };
}

// Initialize recovery state tracking for each endpoint
const recoveryStates = {
  "get-all-categories": { consecutiveRecovered: 0, recoveryRecorded: false },
  "single-category": { consecutiveRecovered: 0, recoveryRecorded: false },
};

// Scenario 1: Test GET all categories endpoint
export function testGetAllCategories(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Get All Categories", () => {
    const response = http.get(`${BASE_URL}/category/get-category`);

    check(response, {
      "get-all-categories: status is 200": (r) => r.status === 200,
      "get-all-categories: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "get-all-categories: response has category array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.category !== undefined &&
            Array.isArray(body.category) &&
            body.category.length > 0
          );
        } catch {
          return false;
        }
      },
      "get-all-categories: categories have required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          if (!Array.isArray(body.category) || body.category.length === 0) {
            return false;
          }
          // Validate first category has required fields
          const firstCategory = body.category[0];
          return (
            firstCategory.name !== undefined &&
            firstCategory.slug !== undefined
          );
        } catch {
          return false;
        }
      },
    });

    recordPhaseMetrics(
      response,
      "get-all-categories",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );

    recoveryStates["get-all-categories"] = trackRecovery(
      response,
      "get-all-categories",
      data,
      recoveryStates["get-all-categories"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}

// Scenario 2: Test GET single category by slug endpoint
export function testSingleCategory(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Get Single Category", () => {
    // Randomly select a category slug from available test data
    const slug =
      CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];

    const response = http.get(`${BASE_URL}/category/single-category/${slug}`);

    check(response, {
      "single-category: status is 200": (r) => r.status === 200,
      "single-category: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "single-category: response has category object": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.category !== undefined &&
            typeof body.category === "object" &&
            !Array.isArray(body.category)
          );
        } catch {
          return false;
        }
      },
      "single-category: category has required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          const category = body.category;
          return (
            category &&
            category.name !== undefined &&
            category.slug !== undefined &&
            category.slug === slug
          );
        } catch {
          return false;
        }
      },
    });

    recordPhaseMetrics(
      response,
      "single-category",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );

    recoveryStates["single-category"] = trackRecovery(
      response,
      "single-category",
      data,
      recoveryStates["single-category"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}
