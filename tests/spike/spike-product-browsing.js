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
import { Trend, Rate } from "k6/metrics";
import { PRODUCT_SLUGS } from "./constants.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060/api/v1";

// Custom metrics for tracking latency across phases
const preSpikeLatency = new Trend("pre_spike_latency");
const duringSpikeLatency = new Trend("during_spike_latency");
const postSpikeLatency = new Trend("post_spike_latency");

// Custom metrics for tracking recovery time per scenario (in seconds)
const getAllProductsRecoveryTime = new Trend("get_all_products_recovery_time_seconds");
const paginationRecoveryTime = new Trend("pagination_recovery_time_seconds");
const productDetailRecoveryTime = new Trend("product_detail_recovery_time_seconds");
const productCountRecoveryTime = new Trend("product_count_recovery_time_seconds");

// Global state to track recovery per scenario
const recoveryState = {
  getAllProducts: { recovered: false, recoveryTime: null, window: [] },
  pagination: { recovered: false, recoveryTime: null, window: [] },
  detail: { recovered: false, recoveryTime: null, window: [] },
  count: { recovered: false, recoveryTime: null, window: [] },
};

// Shared spike profile
// Baseline (1m at 10 VUs)→ Surge (10s ramp-up to 500 VUs) → Hold (1m at 500 VUs) → Drop (10s drop to 10 VUs) → Recovery (2m at 10 VUs)
const spikeStages = [
  { duration: "10s", target: 10 },
  { duration: "1m", target: 10 },
  { duration: "10s", target: 500 },
  { duration: "1m", target: 500 },
  { duration: "10s", target: 10 },
  { duration: "2m", target: 10 },
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
      tags: { test_type: "spike", endpoint: "get-product-slug" },
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
    // Global error thresholds
    http_req_failed: ["rate<0.01"],

    // Scenario-specific error thresholds - Expected: <1%
    "http_req_failed{endpoint:get-product}": ["rate<0.01"],
    "http_req_failed{endpoint:product-list}": ["rate<0.01"],
    "http_req_failed{endpoint:get-product-slug}": ["rate<0.01"],
    "http_req_failed{endpoint:product-count}": ["rate<0.01"],

    // Expected: System recovers to baseline (1.2x) after spike ends
    get_all_products_recovery_time_seconds: ["avg<60"], // Longer recovery time expected for full product list with larger payload
    pagination_recovery_time_seconds: ["avg<30"],
    product_detail_recovery_time_seconds: ["avg<30"],
    product_count_recovery_time_seconds: ["avg<30"],

    // Scenario-specific latency thresholds
    "http_req_duration{endpoint:get-product}": ["p(95)<1000"], // Get all products p95 < 1000ms
    "http_req_duration{endpoint:product-list}": ["p(95)<800"], // Pagination p95 < 800ms
    "http_req_duration{endpoint:get-product-slug}": ["p(95)<500"], // Product detail p95 < 500ms
    "http_req_duration{endpoint:product-count}": ["p(95)<200"], // Count p95 < 200ms
  },
};

// Pre-Test Setup: Measure baseline latency for each endpoint separately
export function setup() {
  console.log("🔍 Establishing baseline latency for each endpoint...");

  // Measure baseline for GET all products
  const getAllProductsBaseline = [];
  for (let i = 0; i < 5; i++) {
    const res = http.get(`${BASE_URL}/product/get-product`);
    getAllProductsBaseline.push(res.timings.duration);
    sleep(0.5);
  }

  // Measure baseline for GET paginated product list
  const paginationBaseline = [];
  for (let i = 0; i < 5; i++) {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/product/product-list/${page}`);
    paginationBaseline.push(res.timings.duration);
    sleep(0.5);
  }

  // Measure baseline for GET product detail
  const detailBaseline = [];
  for (let i = 0; i < 5; i++) {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(`${BASE_URL}/product/get-product/${slug}`);
    detailBaseline.push(res.timings.duration);
    sleep(0.5);
  }

  // Measure baseline for GET product count
  const countBaseline = [];
  for (let i = 0; i < 5; i++) {
    const res = http.get(`${BASE_URL}/product/product-count`);
    countBaseline.push(res.timings.duration);
    sleep(0.5);
  }

  const baselines = {
    getAllProducts: getAllProductsBaseline.reduce((a, b) => a + b, 0) / getAllProductsBaseline.length,
    pagination: paginationBaseline.reduce((a, b) => a + b, 0) / paginationBaseline.length,
    detail: detailBaseline.reduce((a, b) => a + b, 0) / detailBaseline.length,
    count: countBaseline.reduce((a, b) => a + b, 0) / countBaseline.length,
  };

  console.log("✅ Baseline latencies established:");
  console.log(`   - Get All Products: ${baselines.getAllProducts.toFixed(2)}ms`);
  console.log(`   - Pagination: ${baselines.pagination.toFixed(2)}ms`);
  console.log(`   - Product Detail: ${baselines.detail.toFixed(2)}ms`);
  console.log(`   - Product Count: ${baselines.count.toFixed(2)}ms`);

  // Spike ends at 150s (after 10s baseline + 60s hold + 10s surge + 60s peak + 10s drop)
  const SPIKE_END_TIME = 150;

  return {
    baselines,
    startTime: Date.now(),
    spikeEndTime: SPIKE_END_TIME,
  };
}

// Helper function: Identify phase of test based on elapsed time
function getPhase(elapsed) {
  if (elapsed < 60) return "baseline"; // 0-60s: baseline
  if (elapsed < 70) return "surge"; // 60-70s: surge ramp
  if (elapsed < 130) return "peak"; // 70-130s: peak hold
  if (elapsed < 140) return "drop"; // 130-140s: drop
  if (elapsed < 200) return "recovery"; // 140-200s: recovery
  return "post-recovery";
}

// Helper function: Track latency by phase with scenario-specific baseline and recovery time
function trackPhaseLatency(latency, phase, baselineLatency, scenarioKey, scenarioRecoveryMetric, elapsed, spikeEndTime) {
  switch (phase) {
    case "baseline":
    case "surge":
      preSpikeLatency.add(latency);
      break;
    case "peak":
      duringSpikeLatency.add(latency);
      break;
    case "recovery":
    case "post-recovery":
      postSpikeLatency.add(latency);
      
      // Track recovery time using a rolling window approach
      const state = recoveryState[scenarioKey];
      if (!state.recovered) {
        // Add current latency to rolling window (keep last 10 requests)
        state.window.push(latency);
        if (state.window.length > 10) {
          state.window.shift();
        }
        
        // Check if we have enough samples and if average is within threshold
        if (state.window.length >= 5) {
          const avgLatency = state.window.reduce((a, b) => a + b, 0) / state.window.length;
          const threshold = baselineLatency * 1.2;
          
          if (avgLatency <= threshold) {
            // Recovery achieved! Record the time
            state.recovered = true;
            state.recoveryTime = elapsed - spikeEndTime;
            scenarioRecoveryMetric.add(state.recoveryTime);
          }
        }
      } else {
        // Already recovered, just report the recovery time
        scenarioRecoveryMetric.add(state.recoveryTime);
      }
      break;
  }
}

// Scenario 1: Test GET all products endpoint
export function testGetAllProducts(data) {
  const elapsed = (Date.now() - data.startTime) / 1000;
  const phase = getPhase(elapsed);

  group("Get All Products", () => {
    const response = http.get(`${BASE_URL}/product/get-product`);

    trackPhaseLatency(
      response.timings.duration, 
      phase, 
      data.baselines.getAllProducts,
      "getAllProducts",
      getAllProductsRecoveryTime,
      elapsed,
      data.spikeEndTime
    );

    check(response, {
      "get-all-products:status is healthy": (r) => r.status === 200,
      "get-all-products:has products array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "get-all-products:products not empty": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.products && body.products.length > 0;
        } catch {
          return false;
        }
      },
      "get-all-products:no server crash": (r) =>
        r.status !== 500 && r.status !== 503,
    });

    sleep(1);
  });
}

// Scenario 2: Test paginated product list endpoint
export function testProductPagination(data) {
  const elapsed = (Date.now() - data.startTime) / 1000;
  const phase = getPhase(elapsed);

  group("Product Pagination", () => {
    const page = Math.floor(Math.random() * 5) + 1;
    const response = http.get(`${BASE_URL}/product/product-list/${page}`);

    trackPhaseLatency(
      response.timings.duration,
      phase,
      data.baselines.pagination,
      "pagination",
      paginationRecoveryTime,
      elapsed,
      data.spikeEndTime
    );

    check(response, {
      "product-pagination:status is 200": (r) => r.status === 200,
      "product-pagination:has products array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.products);
        } catch {
          return false;
        }
      },
      "product-pagination:pagination still works": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.products !== undefined;
        } catch {
          return false;
        }
      },
    });

    sleep(1);
  });
}

// Scenario 3: Test product detail by slug endpoint
export function testProductDetail(data) {
  const elapsed = (Date.now() - data.startTime) / 1000;
  const phase = getPhase(elapsed);

  group("Product Detail by Slug", () => {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const response = http.get(`${BASE_URL}/product/get-product/${slug}`);

    trackPhaseLatency(
      response.timings.duration,
      phase,
      data.baselines.detail,
      "detail",
      productDetailRecoveryTime,
      elapsed,
      data.spikeEndTime
    );

    check(response, {
      "product-detail:status is 200": (r) => r.status === 200,
      "product-detail:has single product": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.product !== undefined;
        } catch {
          return false;
        }
      },
      "product-detail:no data corruption - has name": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.product && body.product.name !== undefined;
        } catch {
          return false;
        }
      },
      "product-detail:no data corruption - has price": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.product && body.product.price !== undefined;
        } catch {
          return false;
        }
      },
      "product-detail:no data corruption - has slug": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.product && body.product.slug !== undefined;
        } catch {
          return false;
        }
      },
    });

    sleep(1);
  });
}

// Scenario 4: Test product count endpoint
export function testProductCount(data) {
  const elapsed = (Date.now() - data.startTime) / 1000;
  const phase = getPhase(elapsed);

  group("Product Count", () => {
    const response = http.get(`${BASE_URL}/product/product-count`);

    trackPhaseLatency(
      response.timings.duration,
      phase,
      data.baselines.count,
      "count",
      productCountRecoveryTime,
      elapsed,
      data.spikeEndTime
    );

    check(response, {
      "product-count:status is 200": (r) => r.status === 200,
      "product-count:has total count": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total !== undefined;
        } catch {
          return false;
        }
      },
      "product-count:count is numeric": (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.total === "number";
        } catch {
          return false;
        }
      },
      "product-count:count is positive": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.total > 0;
        } catch {
          return false;
        }
      },
    });

    sleep(1);
  });
}

export function teardown(data) {
  console.log("\n=== Spike Test Recovery Summary ===");
  console.log("Recovery threshold = baseline × 1.2 (20% above baseline)");
  console.log("Recovery time = Time for 5 consecutive requests to average within threshold\n");
  
  console.log("Baseline Latencies:");
  console.log(`   - Get All Products: ${data.baselines.getAllProducts.toFixed(2)}ms (threshold: ${(data.baselines.getAllProducts * 1.2).toFixed(2)}ms)`);
  console.log(`   - Pagination: ${data.baselines.pagination.toFixed(2)}ms (threshold: ${(data.baselines.pagination * 1.2).toFixed(2)}ms)`);
  console.log(`   - Product Detail: ${data.baselines.detail.toFixed(2)}ms (threshold: ${(data.baselines.detail * 1.2).toFixed(2)}ms)`);
  console.log(`   - Product Count: ${data.baselines.count.toFixed(2)}ms (threshold: ${(data.baselines.count * 1.2).toFixed(2)}ms)\n`);
}

export default testGetAllProducts;
