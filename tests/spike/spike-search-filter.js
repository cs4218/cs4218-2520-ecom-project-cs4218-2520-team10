// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Product Search and Filtering Endpoints
 * Tests search, filter, and category endpoints under extreme load simulating flash sale rush
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { BASE_URL, SEARCH_KEYWORDS, CATEGORY_SLUGS } from "./constants.js";
import { measureBaselineLatency, trackRecovery, recordPhaseMetrics, validateProductArray } from "./utils.js";

const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");
const timeToRecoveryTrend = new Trend("time_to_recovery_seconds");

// Shared spike profile
// ~167 VUs per scenario -> ~500 VUs total combined load
const spikeStages = [
  { duration: "10s", target: 10 },   // Initial ramp to baseline
  { duration: "1m", target: 10 },    // Baseline hold
  { duration: "10s", target: 167 },  // Spike ramp up
  { duration: "1m", target: 167 },   // Spike hold
  { duration: "10s", target: 10 },   // Spike ramp down
  { duration: "1m", target: 10 },    // Recovery hold
];

export const options = {
  scenarios: {
    // Scenario 1: Product search by keyword
    "search-products-spike": {
      executor: "ramping-vus",
      exec: "testSearchProducts",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "search-products" },
    },
    // Scenario 2: Product filters (category + price)
    "filter-products-spike": {
      executor: "ramping-vus",
      exec: "testFilterProducts",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "filter-products" },
    },
    // Scenario 3: Category-wise products
    "category-products-spike": {
      executor: "ramping-vus",
      exec: "testCategoryProducts",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "category-products" },
    },
  },
  thresholds: {
    // Global error rate: <1%
    http_req_failed: ["rate<0.01"],
    "http_req_failed{endpoint:search-products}": ["rate<0.01"],
    "http_req_failed{endpoint:filter-products}": ["rate<0.01"],
    "http_req_failed{endpoint:category-products}": ["rate<0.01"],
    
    // Baseline
    duration_baseline_phase: ["p(90)<100"],
    "duration_baseline_phase{endpoint:search-products}": ["p(90)<100"],
    "duration_baseline_phase{endpoint:filter-products}": ["p(90)<100"],
    "duration_baseline_phase{endpoint:category-products}": ["p(90)<100"],
    
    // Spike
    duration_spike_phase: ["p(90)<10000"],
    "duration_spike_phase{endpoint:search-products}": ["p(90)<15000"], // Search by regex is expected to be more DB-intensive
    "duration_spike_phase{endpoint:filter-products}": ["p(90)<10000"],
    "duration_spike_phase{endpoint:category-products}": ["p(90)<15000"],
    
    // Recovery
    duration_recovery_phase: ["p(90)<1000"],
    "duration_recovery_phase{endpoint:search-products}": ["p(90)<1500"],
    "duration_recovery_phase{endpoint:filter-products}": ["p(90)<1000"],
    "duration_recovery_phase{endpoint:category-products}": ["p(90)<1000"],

    // Time-to-recovery thresholds - Use min to find the first successful recovery time across VUs
    time_to_recovery_seconds: ["min<30"],
    "time_to_recovery_seconds{endpoint:search-products}": ["min<30"],
    "time_to_recovery_seconds{endpoint:filter-products}": ["min<30"],
    "time_to_recovery_seconds{endpoint:category-products}": ["min<30"],
  },
};

// Setup function: Measure baseline latency for each endpoint before test starts
export function setup() {
  const startTime = Date.now();
  
  const baselineLatency = {
    "search-products": measureBaselineLatency(
      `${BASE_URL}/product/search/laptop`
    ),
    "filter-products": measureBaselineLatency(
      `${BASE_URL}/product/product-filters`,
      5,
      "POST",
      { checked: [], radio: [] }
    ),
    "category-products": measureBaselineLatency(
      `${BASE_URL}/product/product-category/electronics`
    ),
  };
  
  return {
    startTime,
    baselineLatency,
  };
}

const recoveryStates = {
  "search-products": { consecutiveRecovered: 0, recoveryRecorded: false },
  "filter-products": { consecutiveRecovered: 0, recoveryRecorded: false },
  "category-products": { consecutiveRecovered: 0, recoveryRecorded: false }
};

// Scenario 1: Test product search endpoint - regex search (DB-intensive)
export function testSearchProducts(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Product Search by keyword", () => {
    // Randomly select a search keyword
    const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const response = http.get(`${BASE_URL}/product/search/${keyword}`);

    check(response, {
      "search-products: status is healthy": (r) => r.status === 200,
      "search-products: response is array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
      "search-products: products have required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          return validateProductArray(body);
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "search-products", elapsedTime, baselineTrend, spikeTrend, recoveryTrend);
    
    recoveryStates["search-products"] = trackRecovery(
      response,
      "search-products",
      data,
      recoveryStates["search-products"],
      timeToRecoveryTrend
    );
    
    sleep(0.5);
  });
}

// Scenario 2: Test product filters endpoint - category and price filtering
export function testFilterProducts(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Product Filters by price", () => {
    // Randomly generate filter payload to test different query patterns
    const filterTypes = [
      { checked: [], radio: [0, 100] },           // Price only
      { checked: [], radio: [50, 150] },          // Different price range
      { checked: [], radio: [100, 500] },         // Higher price range
      { checked: [], radio: [] },                 // No filters (all products)
    ];
    
    const payload = filterTypes[Math.floor(Math.random() * filterTypes.length)];
    
    const response = http.post(
      `${BASE_URL}/product/product-filters`,
      JSON.stringify(payload),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    check(response, {
      "filter-products: status is healthy": (r) => r.status === 200,
      "filter-products: has success and products": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "filter-products: products have required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          return validateProductArray(body.products);
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "filter-products", elapsedTime, baselineTrend, spikeTrend, recoveryTrend);
    
    recoveryStates["filter-products"] = trackRecovery(
      response,
      "filter-products",
      data,
      recoveryStates["filter-products"],
      timeToRecoveryTrend
    );
    
    sleep(0.5);
  });
}

// Scenario 3: Test category products endpoint - products by category slug
export function testCategoryProducts(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Category Products by category slug", () => {
    // Randomly select a category slug
    const slug = CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];
    const response = http.get(`${BASE_URL}/product/product-category/${slug}`);

    check(response, {
      "category-products: status is healthy": (r) => r.status === 200,
      "category-products: has success, category, and products": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.success === true &&
            body.category !== undefined &&
            Array.isArray(body.products)
          );
        } catch {
          return false;
        }
      },
      "category-products: category has name and slug": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.category &&
            body.category.name !== undefined &&
            body.category.slug !== undefined
          );
        } catch {
          return false;
        }
      },
      "category-products: products have required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          return validateProductArray(body.products);
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "category-products", elapsedTime, baselineTrend, spikeTrend, recoveryTrend);
    
    recoveryStates["category-products"] = trackRecovery(
      response,
      "category-products",
      data,
      recoveryStates["category-products"],
      timeToRecoveryTrend
    );
    
    sleep(0.5);
  });
}
