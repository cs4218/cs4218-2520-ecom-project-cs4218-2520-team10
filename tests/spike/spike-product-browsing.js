// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Product Browsing Endpoints
 * Tests product endpoints under extreme load with recovery tracking
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { PRODUCT_SLUGS } from "./constants.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060/api/v1";

// Custom metrics to track latency during different phases
const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");

// Shared spike profile
// 50 VUs -> 500 VUs -> 50 VUs
const spikeStages = [
  { duration: "10s", target: 10 }, // Initial ramp to baseline
  { duration: "1m", target: 10 }, // Baseline hold
  { duration: "10s", target: 125 }, // Spike ramp up
  { duration: "1m", target: 125 }, // Spike hold
  { duration: "10s", target: 10 }, // Spike ramp down
  { duration: "2m", target: 10 }, // Recovery hold
];

export const options = {
  scenarios: {
    // Scenario 1: Get all products
    "get-all-products": {
      executor: "ramping-vus",
      exec: "testGetAllProducts",
      stages: spikeStages,
      tags: { test_type: "spike", endpoint: "get-product" },
    },
    // Scenario 2: Product pagination
    "product-pagination": {
      executor: "ramping-vus",
      exec: "testProductPagination",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "product-list" },
    },
    // Scenario 3: Product detail by slug
    "product-detail": {
      executor: "ramping-vus",
      exec: "testProductDetail",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "get-product-detail" },
    },
    // Scenario 4: Product count
    "product-count": {
      executor: "ramping-vus",
      exec: "testProductCount",
      stages: spikeStages,
      startTime: "0s",
      tags: { test_type: "spike", endpoint: "product-count" },
    },
  },
  thresholds: {
    // Error thresholds - Expected: <1%
    http_req_failed: ["rate<0.01"],
    "http_req_failed{endpoint:get-product}": ["rate<0.01"],
    "http_req_failed{endpoint:product-list}": ["rate<0.01"],
    "http_req_failed{endpoint:get-product-detail}": ["rate<0.01"],
    "http_req_failed{endpoint:product-count}": ["rate<0.01"],

    // Baseline thresholds - System should be healthy before spike
    duration_baseline_phase: ["p(90)<400"], // Baseline P90 < 400ms
    "duration_baseline_phase{endpoint:get-product}": ["p(90)<500"],
    "duration_baseline_phase{endpoint:product-list}": ["p(90)<300"],
    "duration_baseline_phase{endpoint:get-product-detail}": ["p(90)<500"],
    "duration_baseline_phase{endpoint:product-count}": ["p(90)<300"],

    // Spike thresholds - Allowing degradation but setting ceilings
    duration_spike_phase: ["p(90)<10000"], // Global spike P90 < 10s
    "duration_spike_phase{endpoint:get-product}": ["p(90)<10000"], // Get all products should stay < 5s
    "duration_spike_phase{endpoint:product-list}": ["p(90)<5000"], // Pagination can be a bit heavier but should stay < 5s
    "duration_spike_phase{endpoint:get-product-detail}": ["p(90)<10000"], // Detail can be heavier but should stay < 10s
    "duration_spike_phase{endpoint:product-count}": ["p(90)<5000"], // Count should be very fast, < 5s

    // Recovery thresholds - System must return to healthy levels
    duration_recovery_phase: ["p(90)<600"], // Global recovery P90 < 600ms
    "duration_recovery_phase{endpoint:get-product}": ["p(90)<600"], // Get all products should recover to < 600ms
    "duration_recovery_phase{endpoint:product-list}": ["p(90)<400"], // Pagination should recover to < 400ms
    "duration_recovery_phase{endpoint:get-product-detail}": ["p(90)<600"], // Detail should recover to < 600ms
    "duration_recovery_phase{endpoint:product-count}": ["p(90)<400"], // Count should recover to < 400ms
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
  // Baseline Phase
  if (elapsedTime >= 10 && elapsedTime < 70) {
    baselineTrend.add(res.timings.duration, { endpoint: endpointName });
  }
  // Ramp up + Spike Phase
  else if (elapsedTime >= 70 && elapsedTime < 140) {
    spikeTrend.add(res.timings.duration, { endpoint: endpointName });
  }
  // Ramp down + Recovery Phase
  else if (elapsedTime >= 140) {
    recoveryTrend.add(res.timings.duration, { endpoint: endpointName });
  }
}

// Scenario 1: Test GET all products endpoint
export function testGetAllProducts(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Get All Products", () => {
    const response = http.get(`${BASE_URL}/product/get-product`);

    check(response, {
      "get-all-products: status is healthy": (r) => r.status === 200,
      "get-all-products: has products array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "get-all-products: products not empty": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.products && body.products.length > 0;
        } catch {
          return false;
        }
      },
    });
    recordPhaseMetrics(response, "get-product", elapsedTime);

    sleep(0.5);
  });
}

// Scenario 2: Test paginated product list endpoint
export function testProductPagination(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Product Pagination", () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const response = http.get(`${BASE_URL}/product/product-list/${page}`);

    check(response, {
      "product-pagination: status is healthy": (r) => r.status === 200,
      "product-pagination: has products array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "product-pagination: pagination still works": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.products !== undefined;
        } catch {
          return false;
        }
      },
    });
    recordPhaseMetrics(response, "product-list", elapsedTime);

    sleep(0.5);
  });
}

// Scenario 3: Test product detail by slug endpoint
export function testProductDetail(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Product Detail by Slug", () => {
    const slug =
      PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const response = http.get(`${BASE_URL}/product/get-product/${slug}`);

    check(response, {
      "product-detail: status is healthy": (r) => r.status === 200,
      "product-detail: has single product": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.product !== undefined;
        } catch {
          return false;
        }
      },
      "product-detail: no data corruption": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.product &&
            body.product.name !== undefined &&
            body.product.price !== undefined &&
            body.product.slug !== undefined
          );
        } catch {
          return false;
        }
      },
    });
    recordPhaseMetrics(response, "get-product-detail", elapsedTime);

    sleep(0.5);
  });
}

// Scenario 4: Test product count endpoint
export function testProductCount(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Product Count", () => {
    const response = http.get(`${BASE_URL}/product/product-count`);

    check(response, {
      "product-count: status is healthy": (r) => r.status === 200,
      "product-count: has valid total": (r) => {
        try {
          const body = JSON.parse(r.body);
          return (
            body.total !== undefined &&
            typeof body.total === "number" &&
            body.total >= 0
          );
        } catch {
          return false;
        }
      },
    });
    recordPhaseMetrics(response, "product-count", elapsedTime);

    sleep(0.5);
  });
}

