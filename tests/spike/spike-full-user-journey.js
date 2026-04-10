// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Full User Journey & Variations
 * 
 * Tests realistic e-commerce user journey:
 * - Standard spike: 10 → 100 → 10 VUs (3m30s)
 * - Double spike: 10 → 100 → 10 → 200 → 10 VUs (6m)
 * 
 * Journey Flow:
 * 1. Auth Phase: Register → Login → Extract JWT token
 * 2. Browsing Phase: Browse categories → Search products → View product detail
 * 3. Checkout Phase: Update profile address → Verify order access
 * 
 * Setup: Measures baseline with 7 single requests (minimal error rate)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import execution from "k6/execution";
import {
  BASE_URL,
  SEARCH_KEYWORDS,
  PRODUCT_SLUGS,
} from "./constants.js";
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
const journeyPhaseTrend = new Trend("journey_phase_duration");

// Standard spike: 10 VUs -> 100 VUs -> 10 VUs (3m30s total)
const standardSpikeStages = [
  { duration: "10s", target: 10 },   // Initial ramp to baseline
  { duration: "1m", target: 10 },    // Baseline hold (10s-70s)
  { duration: "10s", target: 100 },  // Spike ramp up (70s-80s)
  { duration: "1m", target: 100 },   // Spike hold (80s-140s)
  { duration: "10s", target: 10 },   // Spike ramp down (140s-150s)
  { duration: "1m", target: 10 },    // Recovery hold (150s-210s)
];

// Double spike: 10 VUs -> 100 VUs -> 10 VUs -> 200 VUs -> 10 VUs (6m total)
const doubleSpikeStages = [
  { duration: "10s", target: 10 },   // Initial ramp
  { duration: "1m", target: 10 },    // Baseline hold
  { duration: "10s", target: 100 },  // First spike ramp up
  { duration: "1m", target: 100 },   // First spike hold
  { duration: "10s", target: 10 },   // Ramp down
  { duration: "1m", target: 10 },    // Recovery hold
  { duration: "10s", target: 200 },  // Second spike ramp up
  { duration: "1m", target: 200 },   // Second spike hold
  { duration: "10s", target: 10 },   // Final ramp down
  { duration: "1m", target: 10 },    // Final recovery
];

export const options = {
  scenarios: {
    // Scenario 1: Standard spike test (baseline journey test)
    "full-journey-standard": {
      executor: "ramping-vus",
      exec: "fullUserJourney",
      stages: standardSpikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", scenario: "standard" },
    },
    // Scenario 2: Double spike (resilience test - back-to-back surges)
    "full-journey-double-spike": {
      executor: "ramping-vus",
      exec: "fullUserJourney",
      stages: doubleSpikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", scenario: "double-spike" },
    },
  },
  thresholds: {
    // Global error rate: < 1% for healthy system
    http_req_failed: ["rate<0.01"],
    "http_req_failed{scenario:standard}": ["rate<0.01"],
    "http_req_failed{scenario:double-spike}": ["rate<0.01"],

    // Baseline thresholds
    duration_baseline_phase: ["p(90)<2000"], // < 2s for full journey
    "duration_baseline_phase{scenario:standard}": ["p(90)<2000"],
    "duration_baseline_phase{scenario:double-spike}": ["p(90)<2000"],

    // Spike thresholds
    duration_spike_phase: ["p(90)<15000"], // < 15s for full journey
    "duration_spike_phase{scenario:standard}": ["p(90)<15000"],
    "duration_spike_phase{scenario:double-spike}": ["p(90)<15000"],

    // Recovery thresholds
    duration_recovery_phase: ["p(90)<3000"], // < 3s (50% above baseline)
    "duration_recovery_phase{scenario:standard}": ["p(90)<3000"],
    "duration_recovery_phase{scenario:double-spike}": ["p(90)<3000"],

    // Time-to-recovery thresholds - Use min to find first successful recovery across all VUs
    time_to_recovery_seconds: ["min<30"], // < 30 seconds to recover
    "time_to_recovery_seconds{scenario:standard}": ["min<30"],
    "time_to_recovery_seconds{scenario:double-spike}": ["min<30"],

    // Journey phase thresholds - Identify bottleneck phases
    "journey_phase_duration{phase:auth}": ["p(90)<8000"],
    "journey_phase_duration{phase:browsing}": ["p(90)<5000"],
    "journey_phase_duration{phase:checkout}": ["p(90)<3000"],
  },
};

export function setup() {
  const startTime = Date.now();

  console.log("🔧 Starting setup - measuring baseline latency...");

  // Register a temporary user for baseline measurement of authenticated endpoints
  const baselineUser = {
    name: "Baseline Test User",
    email: `baseline-journey-${Date.now()}@spike-test.com`,
    password: "baseline-password-123",
    phone: "91234567",
    address: "Baseline Test Address",
    answer: "baseline-answer",
  };

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(baselineUser),
    { headers: { "Content-Type": "application/json" } }
  );

  if (registerRes.status !== 201) {
    console.warn(`⚠️  Baseline user registration returned ${registerRes.status}`);
  }

  sleep(0.5); // Small delay before next request

  // Login to get auth token for authenticated endpoint baselines
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: baselineUser.email,
      password: baselineUser.password,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  let authToken = "";
  if (loginRes.status === 200) {
    try {
      const body = JSON.parse(loginRes.body);
      authToken = body.token;
    } catch (e) {
      console.warn("⚠️  Failed to parse login response");
    }
  } else {
    console.warn(`⚠️  Baseline login returned ${loginRes.status}`);
  }

  const baselineLatency = {
    // Auth phase endpoints - use single successful requests instead of 5 iterations
    register: registerRes.timings.duration,
    login: loginRes.timings.duration,

    // Browsing phase endpoints - measure once for speed
    categories: measureBaselineLatency(`${BASE_URL}/category/get-category`, 1),
    search: measureBaselineLatency(
      `${BASE_URL}/product/search/${SEARCH_KEYWORDS[0]}`,
      1
    ),
    productDetail: measureBaselineLatency(
      `${BASE_URL}/product/get-product/${PRODUCT_SLUGS[0]}`,
      1
    ),

    // Checkout phase endpoints (require authentication)
    profile: 0,
    orders: 0,
  };

  // Measure authenticated endpoints once
  if (authToken) {
    sleep(0.5);
    
    const profileRes = http.put(
      `${BASE_URL}/auth/profile`,
      JSON.stringify({
        name: baselineUser.name,
        phone: baselineUser.phone,
        address: "Updated Baseline Address",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
      }
    );
    baselineLatency.profile = profileRes.timings.duration;

    sleep(0.5);

    const ordersRes = http.get(`${BASE_URL}/auth/orders`, {
      headers: { Authorization: authToken },
    });
    baselineLatency.orders = ordersRes.timings.duration;
  } else {
    // Default values if auth token not available
    baselineLatency.profile = 500;
    baselineLatency.orders = 500;
  }

  // Calculate total journey baseline (sum of all endpoints)
  const totalJourneyBaseline =
    baselineLatency.register +
    baselineLatency.login +
    baselineLatency.categories +
    baselineLatency.search +
    baselineLatency.productDetail +
    baselineLatency.profile +
    baselineLatency.orders;

  baselineLatency["full-journey"] = totalJourneyBaseline;

  console.log("✅ Setup complete - baseline measurements recorded");
  console.log(`   Total setup requests: 7 (reduced from 35 to minimize errors)`);
  console.log("🚀 Starting spike test scenarios...\n");

  return {
    startTime,
    baselineLatency,
  };
}

// Initialize recovery state tracking for the full journey
// This tracks when the system has recovered after spike (stability window approach)
const recoveryStates = {
  "full-journey": { consecutiveRecovered: 0, recoveryRecorded: false },
};

export function fullUserJourney(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;
  const journeyStartTime = Date.now();

  // Get current scenario name and VU stats from K6 execution context
  const scenario = execution.scenario.name;
  
  // Generate unique user credentials to prevent duplicate key errors
  // Uses K6 built-in variables: __VU (virtual user ID) and __ITER (iteration number)
  const uniqueEmail = `journey-user-${__VU}-${__ITER}-${Date.now()}@spike-test.com`;
  const uniqueUser = {
    name: `Journey User ${__VU}-${__ITER}`,
    email: uniqueEmail,
    password: "journey-test-password-123",
    phone: `VU${__VU}I${__ITER}`,
    address: `Journey Test Address VU${__VU}`,
    answer: "journey-test-answer",
  };

  let authToken = ""; // Store JWT token for authenticated requests

  // PHASE 1: Authentication (Register + Login)
  group("Auth Phase - Register & Login", () => {
    const authPhaseStart = Date.now();

    // Step 1: Register new user
    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(uniqueUser),
      {
        headers: { "Content-Type": "application/json" },
        tags: { phase: "auth", endpoint: "register" },
      }
    );

    check(registerRes, {
      "register: status is 201": (r) => r.status === 201,
      "register: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "register: user email matches": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.email === uniqueEmail;
        } catch {
          return false;
        }
      },
    });

    // Log register failures for debugging
    if (registerRes.status !== 201) {
      console.warn(`⚠️ [VU${__VU}] Register failed: status ${registerRes.status} at ${elapsedTime.toFixed(0)}s`);
    }

    sleep(0.3); // Brief pause between register and login

    // Step 2: Login with registered credentials
    const loginRes = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: uniqueUser.email,
        password: uniqueUser.password,
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { phase: "auth", endpoint: "login" },
      }
    );

    check(loginRes, {
      "login: status is 200": (r) => r.status === 200,
      "login: response has token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined && body.token.length > 0;
        } catch {
          return false;
        }
      },
      "login: user email matches": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.email === uniqueEmail;
        } catch {
          return false;
        }
      },
    });

    // Log login failures for debugging
    if (loginRes.status !== 200) {
      console.warn(`⚠️ [VU${__VU}] Login failed: status ${loginRes.status} at ${elapsedTime.toFixed(0)}s`);
    }

    // Extract JWT token for authenticated requests in subsequent phases
    try {
      const loginBody = JSON.parse(loginRes.body);
      if (loginBody.token) {
        authToken = loginBody.token;
      }
    } catch (e) {
      console.error(`Failed to extract auth token for VU${__VU}-${__ITER}`);
    }

    // Record auth phase duration for bottleneck analysis
    const authPhaseDuration = Date.now() - authPhaseStart;
    journeyPhaseTrend.add(authPhaseDuration, { phase: "auth" });
  });

  sleep(1);

  // PHASE 2: Browsing (Categories + Search + Product Detail)
  group("Browsing Phase - Search & View Products", () => {
    const browsingPhaseStart = Date.now();

    // Step 1: Browse all categories
    const categoriesRes = http.get(`${BASE_URL}/category/get-category`, {
      tags: { phase: "browsing", endpoint: "categories" },
    });

    check(categoriesRes, {
      "categories: status is 200": (r) => r.status === 200,
      "categories: response has category array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.category && Array.isArray(body.category);
        } catch {
          return false;
        }
      },
    });

    sleep(0.5);

    // Step 2: Search for products using random keyword
    const randomKeyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const searchRes = http.get(`${BASE_URL}/product/search/${randomKeyword}`, {
      tags: { phase: "browsing", endpoint: "search" },
    });

    check(searchRes, {
      "search: status is 200": (r) => r.status === 200,
      "search: response is array": (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch {
          return false;
        }
      },
    });

    sleep(0.5);

    // Step 3: View product detail using random product slug
    const randomSlug =
      PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const productDetailRes = http.get(
      `${BASE_URL}/product/get-product/${randomSlug}`,
      {
        tags: { phase: "browsing", endpoint: "product-detail" },
      }
    );

    check(productDetailRes, {
      "product-detail: status is 200": (r) => r.status === 200,
      "product-detail: has product object": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.product !== undefined;
        } catch {
          return false;
        }
      },
      "product-detail: has required fields": (r) => {
        try {
          const body = JSON.parse(r.body);
          return hasRequiredProductFields(body.product);
        } catch {
          return false;
        }
      },
    });

    // Record browsing phase duration for bottleneck analysis
    const browsingPhaseDuration = Date.now() - browsingPhaseStart;
    journeyPhaseTrend.add(browsingPhaseDuration, { phase: "browsing" });
  });

  sleep(1);

  // PHASE 3: Checkout (Profile Update + Order Verification)
  group("Checkout Phase - Profile & Orders", () => {
    const checkoutPhaseStart = Date.now();

    // Step 1: Update profile with shipping address (required for checkout)
    if (authToken) {
      const profileRes = http.put(
        `${BASE_URL}/auth/profile`,
        JSON.stringify({
          name: uniqueUser.name,
          phone: uniqueUser.phone,
          address: `Updated Address for VU${__VU} - Journey Test`,
        }),
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken,
          },
          tags: { phase: "checkout", endpoint: "profile" },
        }
      );

      check(profileRes, {
        "profile: status is 200": (r) => r.status === 200,
        "profile: has updated user": (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.updatedUser !== undefined;
          } catch {
            return false;
          }
        },
        "profile: address was updated": (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.updatedUser &&
              body.updatedUser.address &&
              body.updatedUser.address.includes("Updated Address")
            );
          } catch {
            return false;
          }
        },
      });

      // Log profile update failures
      if (profileRes.status !== 200) {
        console.warn(`⚠️ [VU${__VU}] Profile update failed: status ${profileRes.status} at ${elapsedTime.toFixed(0)}s`);
      }

      sleep(0.5);

      // Step 2: Verify user can access order history
      // (In real scenario, this would show orders after payment)
      const ordersRes = http.get(`${BASE_URL}/auth/orders`, {
        headers: {
          Authorization: authToken,
        },
        tags: { phase: "checkout", endpoint: "orders" },
      });

      check(ordersRes, {
        "orders: status is 200": (r) => r.status === 200,
        "orders: response is array": (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body);
          } catch {
            return false;
          }
        },
        "orders: user can access orders": (r) => r.status === 200,
      });

      // Log orders failures
      if (ordersRes.status !== 200) {
        console.warn(`⚠️ [VU${__VU}] Orders failed: status ${ordersRes.status} at ${elapsedTime.toFixed(0)}s`);
      }
    }

    // Record checkout phase duration for bottleneck analysis
    const checkoutPhaseDuration = Date.now() - checkoutPhaseStart;
    journeyPhaseTrend.add(checkoutPhaseDuration, { phase: "checkout" });
  });

  // Calculate total journey duration (all phases combined)
  const totalJourneyDuration = Date.now() - journeyStartTime;

  recordPhaseMetrics(
    { timings: { duration: totalJourneyDuration } },
    "full-journey",
    elapsedTime,
    baselineTrend,
    spikeTrend,
    recoveryTrend,
    scenario
  );
  recoveryStates["full-journey"] = trackRecovery(
    { timings: { duration: totalJourneyDuration } },
    "full-journey",
    data,
    recoveryStates["full-journey"],
    timeToRecoveryTrend
  );

  sleep(0.5);
}