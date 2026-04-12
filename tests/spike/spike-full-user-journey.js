// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Full User Journey
 *
 * Tests realistic e-commerce user journey with spike: 10 → 100 → 10 VUs
 *
 * Journey Flow:
 * 1. Auth Phase: Register → Login → Extract JWT token
 * 2. Browsing Phase: Browse categories → Search products → View product detail
 * 3. Checkout Phase: Update profile address → Verify order access
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import {
  BASE_URL,
  SEARCH_KEYWORDS,
  PRODUCT_SLUGS,
  AUTH_TEST_USERS,
} from "./constants.js";
import {
  measureBaselineLatency,
  hasRequiredProductFields,
  recordPhaseMetrics,
  trackRecovery,
} from "./utils.js";

const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");
const timeToRecoveryTrend = new Trend("time_to_recovery_seconds");
const journeyPhaseTrend = new Trend("journey_phase_duration");

const spikeStages = [
  { duration: "10s", target: 10 },
  { duration: "1m", target: 10 },
  { duration: "10s", target: 200 },
  { duration: "1m", target: 200 },
  { duration: "10s", target: 10 },
  { duration: "1m", target: 10 },
];

export const options = {
  scenarios: {
    "full-journey": {
      executor: "ramping-vus",
      exec: "fullUserJourney",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],

    duration_baseline_phase: ["p(90)<2000"],
    duration_spike_phase: ["p(90)<20000"],
    duration_recovery_phase: ["p(90)<3000"],
    time_to_recovery_seconds: ["min<20"],

    "journey_phase_duration{phase:auth}": ["p(90)<8000"],
    "journey_phase_duration{phase:browsing}": ["p(90)<8000"],
    "journey_phase_duration{phase:checkout}": ["p(90)<8000"],
  },
};

export function setup() {
  const startTime = Date.now();

  // Register a temporary user for baseline measurement of authenticated endpoints
  const baselineUser = AUTH_TEST_USERS[0];

  const registerRes = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify(baselineUser),
    { headers: { "Content-Type": "application/json" } },
  );

  if (registerRes.status !== 201) {
    console.warn(
      `Error registering baseline user, returned ${registerRes.status}`,
    );
  }

  // To ensure registration is captured before processing login
  sleep(0.5);

  // Login to get auth token for authenticated endpoint baselines
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: baselineUser.email,
      password: baselineUser.password,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  let authToken = "";
  if (loginRes.status !== 200) {
    console.warn(`Error logging in baseline user, returned ${loginRes.status}`);
  }

  try {
    const body = JSON.parse(loginRes.body);
    authToken = body.token;
  } catch (e) {
    console.warn("Failed to parse login response");
  }

  // To ensure authToken is available before processing authenticated endpoints
  sleep(0.5);

  // Add baseline latency are measured once to avoid making massive number of calls at setup
  const baselineLatency = {
    register: registerRes.timings.duration,
    login: loginRes.timings.duration,
    categories: measureBaselineLatency(`${BASE_URL}/category/get-category`, 1),
    search: measureBaselineLatency(
      `${BASE_URL}/product/search/${SEARCH_KEYWORDS[0]}`,
      1,
    ),
    productDetail: measureBaselineLatency(
      `${BASE_URL}/product/get-product/${PRODUCT_SLUGS[0]}`,
      1,
    ),
    profile: 0,
    orders: 0,
  };

  // For authenticated endpoints
  if (authToken) {
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
      },
    );
    baselineLatency.profile = profileRes.timings.duration;

    const ordersRes = http.get(`${BASE_URL}/auth/orders`, {
      headers: { Authorization: authToken },
    });
    baselineLatency.orders = ordersRes.timings.duration;
  } else {
    // Default values if auth token not available
    baselineLatency.profile = 500;
    baselineLatency.orders = 500;
  }

  // Calculate total journey baseline duration
  const totalJourneyBaseline =
    baselineLatency.register +
    baselineLatency.login +
    baselineLatency.categories +
    baselineLatency.search +
    baselineLatency.productDetail +
    baselineLatency.profile +
    baselineLatency.orders;

  return {
    startTime,
    baselineLatency: totalJourneyBaseline,
  };
}

// Per-VU recovery state tracking (Map keyed by VU ID)
const recoveryStates = new Map();

function getRecoveryState() {
  if (!recoveryStates.has(__VU)) {
    recoveryStates.set(__VU, { consecutiveRecovered: 0, recoveryRecorded: false });
  }
  return recoveryStates.get(__VU);
}

export function fullUserJourney(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;
  const journeyStartTime = Date.now();

  const uniqueEmail = `journey-user-${__VU}-${__ITER}-${Date.now()}@spike-test.com`;
  const uniqueUser = {
    name: `Journey User ${__VU}-${__ITER}`,
    email: uniqueEmail,
    password: "journey-test-password-123",
    phone: `VU${__VU}I${__ITER}`,
    address: `Journey Test Address VU${__VU}`,
    answer: "journey-test-answer",
  };

  let authToken = "";

  group("Auth Phase - Register & Login", () => {
    const authPhaseStart = Date.now();

    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(uniqueUser),
      {
        headers: { "Content-Type": "application/json" },
        tags: { phase: "auth", endpoint: "register" },
      },
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

    if (registerRes.status !== 201) {
      console.warn(
        `[VU${__VU}] Register failed: ${registerRes.status} at ${elapsedTime.toFixed(0)}s`,
      );
    }

    sleep(0.5);

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
      },
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

    if (loginRes.status !== 200) {
      console.warn(
        `[VU${__VU}] Login failed: ${loginRes.status} at ${elapsedTime.toFixed(0)}s`,
      );
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

    const authPhaseDuration = Date.now() - authPhaseStart;
    journeyPhaseTrend.add(authPhaseDuration, { phase: "auth" });
  });

  sleep(0.5);

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

    // Step 3: View product detail using random product slug
    const randomSlug =
      PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const productDetailRes = http.get(
      `${BASE_URL}/product/get-product/${randomSlug}`,
      {
        tags: { phase: "browsing", endpoint: "product-detail" },
      },
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

    const browsingPhaseDuration = Date.now() - browsingPhaseStart;
    journeyPhaseTrend.add(browsingPhaseDuration, { phase: "browsing" });
  });

  sleep(0.5);

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
        },
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

      if (profileRes.status !== 200) {
        console.warn(
          `[VU${__VU}] Profile update failed: status ${profileRes.status} at ${elapsedTime.toFixed(0)}s`,
        );
      }

      // Step 2: Verify user can access order history
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

      if (ordersRes.status !== 200) {
        console.warn(
          `[VU${__VU}] Orders failed: status ${ordersRes.status} at ${elapsedTime.toFixed(0)}s`,
        );
      }
    }

    const checkoutPhaseDuration = Date.now() - checkoutPhaseStart;
    journeyPhaseTrend.add(checkoutPhaseDuration, { phase: "checkout" });
  });

  const totalJourneyDuration = Date.now() - journeyStartTime;

  const response = { timings: { duration: totalJourneyDuration } };
  
  recordPhaseMetrics(
    response,
    "full-journey",
    elapsedTime,
    baselineTrend,
    spikeTrend,
    recoveryTrend
  );

  // Get per-VU state and update it
  const vuState = getRecoveryState();
  const updatedState = trackRecovery(
    response,
    "full-journey",
    data,
    vuState,
    timeToRecoveryTrend
  );
  recoveryStates.set(__VU, updatedState);
}
