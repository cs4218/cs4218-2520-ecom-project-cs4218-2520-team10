// Kim Shi Tong, A0265858J
// [Load Test] Realistic User Journey Simulation
//
// Simulates real user flows at 50 VUs:
//   1. Full browsing journey (categories -> products -> search -> detail -> login)
//   2. Returning user journey (login -> categories -> filters -> paginated -> detail)
//   3. Throughput measurement
//   4. Per-endpoint latency comparison via tags

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const errorRate = new Rate("custom_error_rate");
const journeyDuration = new Trend("journey_duration");
const totalRequests = new Counter("total_requests");

// Per-endpoint trends for latency comparison
const categoryLatency = new Trend("endpoint_category_latency");
const productsLatency = new Trend("endpoint_products_latency");
const searchLatency = new Trend("endpoint_search_latency");
const detailLatency = new Trend("endpoint_detail_latency");
const loginLatency = new Trend("endpoint_login_latency");
const filterLatency = new Trend("endpoint_filter_latency");
const paginatedLatency = new Trend("endpoint_paginated_latency");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";
const PRODUCT_SLUGS = ["laptop", "textbook", "smartphone", "novel", "nus-tshirt"];

// --- k6 options ---
export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "2m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    custom_error_rate: ["rate<0.01"],
    journey_duration: ["p(95)<8000"],
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  const journeyStart = Date.now();

  // Alternate between browsing and returning journey per iteration
  if (__ITER % 2 === 0) {
    browsingJourney();
  } else {
    returningJourney();
  }

  const journeyTime = Date.now() - journeyStart;
  journeyDuration.add(journeyTime);
  errorRate.add(journeyTime > 8000);
}

// --- Journey 1: New user browsing ---
function browsingJourney() {
  group("Browse categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "categories" },
    });
    check(res, { "categories 200": (r) => r.status === 200 });
    categoryLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("View products", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "products" },
    });
    check(res, { "products 200": (r) => r.status === 200 });
    productsLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Search", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/search/laptop`, {
      tags: { name: "search" },
    });
    check(res, { "search 200": (r) => r.status === 200 });
    searchLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Product detail", function () {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`, {
      tags: { name: "detail" },
    });
    check(res, { "detail 200": (r) => r.status === 200 });
    detailLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Login", function () {
    const payload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
    loginLatency.add(res.timings.duration);
    totalRequests.add(1);
  });
}

// --- Journey 2: Returning user ---
function returningJourney() {
  group("Login", function () {
    const payload = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "login" },
    });
    check(res, { "login 200": (r) => r.status === 200 });
    loginLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Browse categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "categories" },
    });
    check(res, { "categories 200": (r) => r.status === 200 });
    categoryLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Filter products", function () {
    const payload = JSON.stringify({ checked: [], radio: [0, 100] });
    const res = http.post(`${BASE_URL}/api/v1/product/product-filters`, payload, {
      headers: { "Content-Type": "application/json" },
      tags: { name: "filter" },
    });
    check(res, { "filter 200": (r) => r.status === 200 });
    filterLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Paginated list", function () {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
      tags: { name: "paginated" },
    });
    check(res, { "paginated 200": (r) => r.status === 200 });
    paginatedLatency.add(res.timings.duration);
    totalRequests.add(1);
  });

  sleep(1);

  group("Product detail", function () {
    const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
    const res = http.get(`${BASE_URL}/api/v1/product/get-product/${slug}`, {
      tags: { name: "detail" },
    });
    check(res, { "detail 200": (r) => r.status === 200 });
    detailLatency.add(res.timings.duration);
    totalRequests.add(1);
  });
}

export function handleSummary(data) {
  return {
    "results/load-user-journey-report.html": htmlReport(data),
    "results/load-user-journey-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
