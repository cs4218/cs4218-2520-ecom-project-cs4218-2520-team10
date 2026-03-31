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
import { SEARCH_KEYWORDS, CATEGORY_SLUGS } from "./constants.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060/api/v1";

// Custom metrics to track latency during different phases
const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");

// Shared spike profile
// ~167 VUs per scenario -> ~500 VUs total combined load
const spikeStages = [
  { duration: "10s", target: 10 },   // Initial ramp to baseline
  { duration: "1m", target: 10 },    // Baseline hold
  { duration: "10s", target: 167 },  // Spike ramp up
  { duration: "1m", target: 167 },   // Spike hold
  { duration: "10s", target: 10 },   // Spike ramp down
  { duration: "2m", target: 10 },    // Recovery hold
];

export const options = {
  gracefulRampDown: "10s",
  gracefulStop: "10s",
  scenarios: {
    // Scenario 1: Product search by keyword
    "search-products-spike": {
      executor: "ramping-vus",
      exec: "testSearchProducts",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "search-products" },
    },
    // Scenario 2: Product filters (category + price)
    "filter-products-spike": {
      executor: "ramping-vus",
      exec: "testFilterProducts",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "filter-products" },
    },
    // Scenario 3: Category-wise products
    "category-products-spike": {
      executor: "ramping-vus",
      exec: "testCategoryProducts",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "category-products" },
    },
  },
  thresholds: {
    // Global error rate: <1%
    http_req_failed: ["rate<0.01"],
    
    // Per-endpoint error rates
    "http_req_failed{endpoint:search-products}": ["rate<0.01"],
    "http_req_failed{endpoint:filter-products}": ["rate<0.01"],
    "http_req_failed{endpoint:category-products}": ["rate<0.01"],
    
    // Baseline thresholds - healthy state under normal load (10 VUs)
    duration_baseline_phase: ["p(90)<100"],
    "duration_baseline_phase{endpoint:search-products}": ["p(90)<100"],
    "duration_baseline_phase{endpoint:filter-products}": ["p(90)<100"],
    "duration_baseline_phase{endpoint:category-products}": ["p(90)<100"],
    
    // Spike thresholds - acceptable degradation under heavy load (~167 VUs per scenario)
    duration_spike_phase: ["p(90)<10000"],
    "duration_spike_phase{endpoint:search-products}": ["p(90)<15000"], // Search by regex is expected to be more DB-intensive
    "duration_spike_phase{endpoint:filter-products}": ["p(90)<10000"],
    "duration_spike_phase{endpoint:category-products}": ["p(90)<15000"],
    
    // Recovery thresholds - must return to near-baseline performance
    duration_recovery_phase: ["p(90)<1000"],
    "duration_recovery_phase{endpoint:search-products}": ["p(90)<1500"],
    "duration_recovery_phase{endpoint:filter-products}": ["p(90)<1000"],
    "duration_recovery_phase{endpoint:category-products}": ["p(90)<1000"],
  },
};

// Setup function
export function setup() {
  return {
    startTime: Date.now()
  };
}

// Helper function: Identify phase of test based on elapsed time and record response time
function recordPhaseMetrics(res, endpointName, elapsedTime) {
  // Baseline Phase: 10s-70s
  if (elapsedTime >= 10 && elapsedTime < 70) {
    baselineTrend.add(res.timings.duration, { endpoint: endpointName });
  }
  // Ramp up + Spike Phase: 70s-140s
  else if (elapsedTime >= 70 && elapsedTime < 140) {
    spikeTrend.add(res.timings.duration, { endpoint: endpointName });
  }
  // Ramp down + Recovery Phase: 140s+
  else if (elapsedTime >= 140) {
    recoveryTrend.add(res.timings.duration, { endpoint: endpointName });
  }
}

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
          if (!Array.isArray(body) || body.length === 0) return true; // Empty results valid
          return body.every(product => 
            product.name !== undefined &&
            product.slug !== undefined &&
            product.price !== undefined
          );
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "search-products", elapsedTime);
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
          if (!body.products || body.products.length === 0) return true; // Empty results valid
          return body.products.every(product =>
            product.name !== undefined &&
            product.slug !== undefined &&
            product.price !== undefined
          );
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "filter-products", elapsedTime);
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
          if (!body.products || body.products.length === 0) return true; // Empty results valid
          return body.products.every(product =>
            product.name !== undefined &&
            product.slug !== undefined &&
            product.price !== undefined
          );
        } catch {
          return false;
        }
      },
    });
    
    recordPhaseMetrics(response, "category-products", elapsedTime);
    sleep(0.5);
  });
}
