// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * K6 Spike Test: Authentication Endpoints
 * Tests auth endpoints (login, register, forgot-password) under extreme load with recovery tracking
 *
 * Key considerations:
 * - Login endpoint is CPU-intensive due to bcrypt password hashing (10 rounds)
 * - Register endpoint involves database writes with unique email constraint
 * - Uses unique email generation to prevent duplicate-key errors during concurrent execution
 * - User credentials used for Login and Forgot Password are separated to avoid interference between tests
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import {
  BASE_URL,
  AUTH_TEST_USERS,
  FORGOT_PASSWORD_USERS,
  FORGOT_PASSWORD_TEST_DATA,
} from "./constants.js";
import {
  measureBaselineLatency,
  trackRecovery,
  recordPhaseMetrics,
} from "./utils.js";

const baselineTrend = new Trend("duration_baseline_phase");
const spikeTrend = new Trend("duration_spike_phase");
const recoveryTrend = new Trend("duration_recovery_phase");
const timeToRecoveryTrend = new Trend("time_to_recovery_seconds");

// Shared spike profile
// 167 VUs per scenario -> ~500 VUs total combined load
const spikeStages = [
  { duration: "10s", target: 10 }, // Initial ramp to baseline
  { duration: "1m", target: 10 }, // Baseline hold
  { duration: "10s", target: 167 }, // Spike ramp up
  { duration: "1m", target: 167 }, // Spike hold
  { duration: "10s", target: 10 }, // Spike ramp down
  { duration: "1m", target: 10 }, // Recovery hold
];

export const options = {
  scenarios: {
    // Scenario 1: Login
    "login-spike": {
      executor: "ramping-vus",
      exec: "testLogin",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "login" },
    },
    // Scenario 2: Register
    "register-spike": {
      executor: "ramping-vus",
      exec: "testRegister",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "register" },
    },
    // Scenario 3: Forgot password
    "forgot-password-spike": {
      executor: "ramping-vus",
      exec: "testForgotPassword",
      stages: spikeStages,
      startTime: "0s",
      gracefulRampDown: "5s",
      gracefulStop: "5s",
      tags: { test_type: "spike", endpoint: "forgot-password" },
    },
  },
  thresholds: {
    // Global error rate: <1%
    http_req_failed: ["rate<0.01"],
    "http_req_failed{endpoint:login}": ["rate<0.01"],
    "http_req_failed{endpoint:register}": ["rate<0.01"],
    "http_req_failed{endpoint:forgot-password}": ["rate<0.01"],

    // Baseline thresholds
    duration_baseline_phase: ["p(90)<900"],
    "duration_baseline_phase{endpoint:login}": ["p(90)<800"],
    "duration_baseline_phase{endpoint:register}": ["p(90)<900"],
    "duration_baseline_phase{endpoint:forgot-password}": ["p(90)<800"],

    // Spike thresholds
    duration_spike_phase: ["p(90)<15000"],
    "duration_spike_phase{endpoint:login}": ["p(90)<15000"],
    "duration_spike_phase{endpoint:register}": ["p(90)<10000"],
    "duration_spike_phase{endpoint:forgot-password}": ["p(90)<10000"],

    // Recovery thresholds
    duration_recovery_phase: ["p(90)<1200"],
    "duration_recovery_phase{endpoint:login}": ["p(90)<1200"],
    "duration_recovery_phase{endpoint:register}": ["p(90)<1200"],
    "duration_recovery_phase{endpoint:forgot-password}": ["p(90)<1000"],

    // Time-to-recovery thresholds - Use min to find first successful recovery across VUs
    time_to_recovery_seconds: ["min<30"],
    "time_to_recovery_seconds{endpoint:login}": ["min<30"],
    "time_to_recovery_seconds{endpoint:register}": ["min<30"],
    "time_to_recovery_seconds{endpoint:forgot-password}": ["min<30"],
  },
};

export function setup() {
  const startTime = Date.now();

  // Register test users
  for (const user of AUTH_TEST_USERS) {
    const response = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(user),
      { headers: { "Content-Type": "application/json" } },
    );

    if (response.status !== 201) {
      console.error(
        `Failed to register login test user ${user.email}: ${response.status}`,
      );
    }
  }

  // Register forgot-password test users separately to avoid interference with login tests
  for (const user of FORGOT_PASSWORD_USERS) {
    const response = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(user),
      { headers: { "Content-Type": "application/json" } },
    );

    if (response.status !== 201) {
      console.error(
        `Failed to register forgot-password test user ${user.email}: ${response.status}`,
      );
    }
  }

  // Measure baseline latency
  const baselineLatency = {
    "login": measureBaselineLatency(`${BASE_URL}/auth/login`, 5, "POST", {
      email: AUTH_TEST_USERS[0].email,
      password: AUTH_TEST_USERS[0].password,
    }),
    "forgot-password": measureBaselineLatency(
      `${BASE_URL}/auth/forgot-password`,
      5,
      "POST",
      {
        email: FORGOT_PASSWORD_USERS[0].email,
        answer: FORGOT_PASSWORD_USERS[0].answer,
        newPassword: "temp-baseline-password",
      },
    ),
  };

  // Custom baseline measurement for register endpoint - requires unique emails per iteration
  const registerBaselines = [];
  for (let i = 0; i < 5; i++) {
    const uniqueEmail = `baseline-user-${Date.now()}-${Math.random().toString(36).substring(7)}@spike-test.com`;
    const response = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: "Baseline Test User",
        email: uniqueEmail,
        password: "baseline-password",
        phone: "12345678",
        address: "Baseline Address",
        answer: "baseline-answer",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
    registerBaselines.push(response.timings.duration);
    sleep(0.5);
  }
  baselineLatency["register"] =
    registerBaselines.reduce((a, b) => a + b, 0) / registerBaselines.length;

  return {
    startTime,
    baselineLatency,
  };
}

const recoveryStates = {
  login: { consecutiveRecovered: 0, recoveryRecorded: false },
  register: { consecutiveRecovered: 0, recoveryRecorded: false },
  "forgot-password": { consecutiveRecovered: 0, recoveryRecorded: false },
};

// Scenario 1: Test login endpoint
export function testLogin(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("User Login", () => {
    const user =
      AUTH_TEST_USERS[Math.floor(Math.random() * AUTH_TEST_USERS.length)];

    const response = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify({
        email: user.email,
        password: user.password,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    check(response, {
      "login: status is 200": (r) => r.status === 200,
      "login: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "login: response has JWT token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined && body.token.length > 0;
        } catch {
          return false;
        }
      },
      "login: user email matches request": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.email === user.email;
        } catch {
          return false;
        }
      },
    });

    recordPhaseMetrics(
      response,
      "login",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["login"] = trackRecovery(
      response,
      "login",
      data,
      recoveryStates["login"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}

// Scenario 2: Test register endpoint
export function testRegister(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("User Registration", () => {
    // Generate unique user data to prevent duplicate users errors
    // Uses K6 built-in variables: __VU (virtual user ID) and __ITER (iteration number)
    const uniqueEmail = `spike-auth-${__VU}-${__ITER}-${Date.now()}@spike-test.com`;
    const uniquePhone = `VU${__VU}-I${__ITER}`;

    const response = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        name: `SpikeUser-${__VU}-${__ITER}`,
        email: uniqueEmail,
        password: "spike-test-password",
        phone: uniquePhone,
        address: `Spike Test Address ${__VU}`,
        answer: "spike-test-answer",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    check(response, {
      "register: status is 201": (r) => r.status === 201,
      "register: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "register: user email matches request": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.user && body.user.email === uniqueEmail;
        } catch {
          return false;
        }
      },
      "register: no duplicate users errors": (r) => {
        // Ensure we don't get 409 Conflict or MongoDB duplicate key errors
        return r.status !== 409 && r.status !== 500;
      },
    });

    recordPhaseMetrics(
      response,
      "register",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["register"] = trackRecovery(
      response,
      "register",
      data,
      recoveryStates["register"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}

// Scenario 3: Test forgot-password endpoint
export function testForgotPassword(data) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;

  group("Forgot Password", () => {
    const testData =
      FORGOT_PASSWORD_TEST_DATA[
        Math.floor(Math.random() * FORGOT_PASSWORD_TEST_DATA.length)
      ];

    const response = http.post(
      `${BASE_URL}/auth/forgot-password`,
      JSON.stringify({
        email: testData.email,
        answer: testData.answer,
        newPassword: `temp-password-${Date.now()}`,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    check(response, {
      "forgot-password: status is 200": (r) => r.status === 200,
      "forgot-password: response has success field": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true;
        } catch {
          return false;
        }
      },
      "forgot-password: message indicates success": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.message !== undefined && body.message.length > 0;
        } catch {
          return false;
        }
      },
      "forgot-password: no server errors": (r) => {
        return r.status !== 500;
      },
    });

    recordPhaseMetrics(
      response,
      "forgot-password",
      elapsedTime,
      baselineTrend,
      spikeTrend,
      recoveryTrend,
    );
    recoveryStates["forgot-password"] = trackRecovery(
      response,
      "forgot-password",
      data,
      recoveryStates["forgot-password"],
      timeToRecoveryTrend,
    );

    sleep(0.5);
  });
}
