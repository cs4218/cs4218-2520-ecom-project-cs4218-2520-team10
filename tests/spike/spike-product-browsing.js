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
import { BASE_URL, PRODUCT_SLUGS } from "./constants.js";
import {
  measureBaselineLatency,
  trackRecovery,
  recordPhaseMetrics,
  hasRequiredProductFields,
} from "./utils.js";

const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");
const timeToRecoveryTrend = new Trend("time_to_recovery_seconds");

// Shared spike profile
// 50 VUs -> 500 VUs -> 50 VUs
const spikeStages = [
  { duration: "10s", target: 10 }, // Initial ramp to baseline
  { duration: "1m", target: 10 }, // Baseline hold
  { duration: "10s", target: 125 }, // Spike ramp up
  { duration: "1m", target: 125 }, // Spike hold
  { duration: "10s", target: 10 }, // Spike ramp down
  { duration: "1m", target: 10 }, // Recovery hold
];

export const options = {
  scenarios: {
    // Scenario 1: Get all products
    "get-all-products-spike": {
      executor: "ramping-vus",
      exec: "testGetAllProducts",
      stages: spikeStages,
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "get-product" },
    },
    // Scenario 2: Product pagination
    "product-pagination-spike": {
      executor: "ramping-vus",
      exec: "testProductPagination",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "product-list" },
    },
    // Scenario 3: Product detail by slug
    "product-detail-spike": {
      executor: "ramping-vus",
      exec: "testProductDetail",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "get-product-detail" },
    },
    // Scenario 4: Product count
    "product-count-spike": {
      executor: "ramping-vus",
      exec: "testProductCount",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
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

    // Baseline
    duration_baseline_phase: ["p(90)<400"],
    "duration_baseline_phase{endpoint:get-product}": ["p(90)<500"],
    "duration_baseline_phase{endpoint:product-list}": ["p(90)<300"],
    "duration_baseline_phase{endpoint:get-product-detail}": ["p(90)<500"],
    "duration_baseline_phase{endpoint:product-count}": ["p(90)<300"],

    // Spike
    duration_spike_phase: ["p(90)<10000"],
    "duration_spike_phase{endpoint:get-product}": ["p(90)<10000"],
    "duration_spike_phase{endpoint:product-list}": ["p(90)<5000"],
    "duration_spike_phase{endpoint:get-product-detail}": ["p(90)<10000"],
    "duration_spike_phase{endpoint:product-count}": ["p(90)<5000"],

    // Recovery
    duration_recovery_phase: ["p(90)<600"],
    "duration_recovery_phase{endpoint:get-product}": ["p(90)<600"],
    "duration_recovery_phase{endpoint:product-list}": ["p(90)<400"],
    "duration_recovery_phase{endpoint:get-product-detail}": ["p(90)<600"],
    "duration_recovery_phase{endpoint:product-count}": ["p(90)<400"],

    // Time-to-recovery - Use min to find the first successful recovery time across VUs
    time_to_recovery_seconds: ["min<30"],
    "time_to_recovery_seconds{endpoint:get-product}": ["min<30"],
    "time_to_recovery_seconds{endpoint:product-list}": ["min<30"],
    "time_to_recovery_seconds{endpoint:get-product-detail}": ["min<30"],
    "time_to_recovery_seconds{endpoint:product-count}": ["min<30"],
  },
};

// Setup function: Measure baseline latency for each endpoint before test starts
export function setup() {
  const startTime = Date.now();

  const baselineLatency = {
    "get-product": measureBaselineLatency(`${BASE_URL}/product/get-product`),
    "product-list": measureBaselineLatency(
      `${BASE_URL}/product/product-list/1`,
    ),
    "get-product-detail": measureBaselineLatency(
      `${BASE_URL}/product/get-product/gaming-laptop-pro`,
    ),
    "product-count": measureBaselineLatency(
      `${BASE_URL}/product/product-count`,
    ),
  };

  return {
    startTime,
    baselineLatency,
  };
}

const recoveryStates = {
  "get-product": { consecutiveRecovered: 0, recoveryRecorded: false },
  "product-list": { consecutiveRecovered: 0, recoveryRecorded: false },
  "get-product-detail": { consecutiveRecovered: 0, recoveryRecorded: false },
  "product-count": { consecutiveRecovered: 0, recoveryRecorded: false },
};

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

    recordPhaseMetrics(
      response,
      "get-product",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["get-product"] = trackRecovery(
      response,
      "get-product",
      data,
      recoveryStates["get-product"],
      timeToRecoveryTrend,
    );

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

    recordPhaseMetrics(
      response,
      "product-list",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["product-list"] = trackRecovery(
      response,
      "product-list",
      data,
      recoveryStates["product-list"],
      timeToRecoveryTrend,
    );

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
          return body.product && hasRequiredProductFields(body.product);
        } catch {
          return false;
        }
      },
    });

    recordPhaseMetrics(
      response,
      "get-product-detail",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["get-product-detail"] = trackRecovery(
      response,
      "get-product-detail",
      data,
      recoveryStates["get-product-detail"],
      timeToRecoveryTrend,
    );

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

    recordPhaseMetrics(
      response,
      "product-count",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["product-count"] = trackRecovery(
      response,
      "product-count",
      data,
      recoveryStates["product-count"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}
