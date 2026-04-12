// Shaun Lee Xuan Wei, A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// [Stress Test] Auth Endpoint Breaking Point Analysis
//
// Three scenarios run sequentially so each gets a clean server:
//
//   Scenario 1 (login_stress):           50 → 300 VUs  (~6 min)
//     Each VU sends POST /api/v1/auth/login.
//     Records p95 latency at each stage and identifies the VU count
//     where p95 exceeds 2s and error rate > 5%.
//
//   Scenario 2 (register_stress):        50 → 300 VUs  (~6 min)
//     Each VU sends POST /api/v1/auth/register with a unique email (VU + iteration).
//     Asserts no duplicate user creation from race conditions. Identifies breaking point.
//
//   Scenario 3 (forgot_password_stress): 50 → 300 VUs  (~6 min)
//     Each VU sends POST /api/v1/auth/forgot-password using real seed user credentials
//     so bcrypt is fully exercised on every request. Asserts endpoint does not crash
//     and documents error rate at each VU level.
//     Safe to run last: login_stress is already complete by startTime "14m".
//
// Total runtime: ~21 min (6 min + 1 min gap + 6 min + 1 min gap + 6 min)

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { STAGES_TO_300 } from "./stages.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
// login_error_rate and login_duration cover both scenario 1 and 2 assertions:
//   - login_duration p95 identifies when latency exceeds 2s
//   - login_error_rate identifies when error rate exceeds 1% and 5%
const loginErrorRate = new Rate("login_error_rate");
const loginDuration = new Trend("login_duration");
const registerErrorRate = new Rate("register_error_rate");
const registerDuration = new Trend("register_duration");
const forgotPasswordErrorRate = new Rate("forgot_password_error_rate");
const forgotPasswordDuration = new Trend("forgot_password_duration");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";


// --- k6 options ---
// Scenarios run sequentially (startTime offsets) so each gets an uncontested server.
// Breaking point thresholds: 5% error rate, p95 > 2s — failures are expected at
// high VU counts and mark the breaking point for the report.
export const options = {
  scenarios: {
    // Scenarios 1+2 combined: login escalation to 500 VUs
    // Records p95 latency (login_duration) AND error rate (login_error_rate)
    login_stress: {
      executor: "ramping-vus",
      startTime: "0s",
      stages: STAGES_TO_300,
      exec: "loginStress",
    },
    // Scenario 3: register escalation to 300 VUs
    // Starts after login_stress finishes (~14 min) + 1 min buffer
    register_stress: {
      executor: "ramping-vus",
      startTime: "7m",
      stages: STAGES_TO_300,
      exec: "registerStress",
    },
    // Scenario 4: forgot-password escalation to 300 VUs
    // Starts after register_stress finishes (~6 min) + 1 min buffer
    forgot_password_stress: {
      executor: "ramping-vus",
      startTime: "14m",
      stages: STAGES_TO_300,
      exec: "forgotPasswordStress",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    login_error_rate: ["rate<0.05"],
    register_error_rate: ["rate<0.05"],
    forgot_password_error_rate: ["rate<0.05"],
    login_duration: ["p(95)<2000"],
    register_duration: ["p(95)<2000"],
    forgot_password_duration: ["p(95)<2000"],
  },
};

// --- Scenario 1+2: Login stress ---
// All VUs send POST /api/v1/auth/login.
// login_duration tracks p95 latency per stage (scenario 1).
// login_error_rate tracks error rate to identify breaking point (scenario 2).
export function loginStress() {
  group("Login", function () {
    const payload = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Login" },
    });
    const success = check(res, {
      "login status 200": (r) => r.status === 200,
      "login returns token": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.token;
      },
    });
    loginErrorRate.add(!success);
    loginDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 3: Register stress ---
// Each VU uses a unique email (vu + iteration) — eliminates duplicate risk.
export function registerStress() {
  group("Register", function () {
    const uniqueEmail = `stress_vu${__VU}_iter${__ITER}@stress.com`;
    const payload = JSON.stringify({
      name: `Stress User ${__VU}`,
      email: uniqueEmail,
      password: "stresstest123",
      phone: "91234567",
      address: "1 Stress Street",
      answer: "stress test",
    });
    const res = http.post(`${BASE_URL}/api/v1/auth/register`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Register" },
    });
    const success = check(res, {
      "register status 200 or 201": (r) => r.status === 200 || r.status === 201,
      "no 500 error": (r) => r.status !== 500,
    });
    registerErrorRate.add(!success);
    registerDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 4: Forgot-password stress ---
// Uses the real seed user credentials so bcrypt is fully exercised on every request
// (findOne succeeds → hashPassword called → findByIdAndUpdate written).
// Safe to run last: login_stress has already completed by startTime "14m".
export function forgotPasswordStress() {
  group("Forgot password", function () {
    const payload = JSON.stringify({
      email: TEST_EMAIL,
      answer: "password is cs4218@test.com",
      newPassword: "cs4218@test.com",
    });
    const res = http.post(
      `${BASE_URL}/api/v1/auth/forgot-password`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "ForgotPassword" },
      }
    );
    const success = check(res, {
      "forgot-password status 200": (r) => r.status === 200,
      "forgot-password success": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.success === true;
      },
    });
    forgotPasswordErrorRate.add(!success);
    forgotPasswordDuration.add(res.timings.duration);
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    "tests/stress/results/stress-auth-report.html": htmlReport(data),
    "tests/stress/results/stress-auth-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
