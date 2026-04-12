// Shaun Lee Xuan Wei, A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// [Stress Test] Product Search & Filter Breaking Point
//
// Three scenarios run sequentially so each gets a clean server:
//
//   Scenario 1 (search_fixed):   50 → 300 VUs (~6 min)
//     Search with fixed keyword "phone" — isolates regex query cost.
//
//   Scenario 2 (filter_stress):  50 → 300 VUs (~6 min)
//     Filter with price range — range query, expected to outlast search.
//
//   Scenario 3 (search_varied):  50 → 300 VUs (~6 min)
//     Search with varied keywords — asserts breaking point is keyword-independent.
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
const searchErrorRate = new Rate("search_error_rate");
const filterErrorRate = new Rate("filter_error_rate");
const searchDuration = new Trend("search_duration");
const filterDuration = new Trend("filter_duration");

// --- Seed data ---
const SEARCH_KEYWORDS = ["laptop", "phone", "book", "shirt", "camera", "headphones"];


// --- k6 options ---
export const options = {
  scenarios: {
    // Scenario 1: search with fixed keyword — isolates regex cost
    search_fixed: {
      executor: "ramping-vus",
      startTime: "0s",
      stages: STAGES_TO_300,
      exec: "searchFixed",
    },
    // Scenario 2: filter stress — range query, expected to outlast search
    // Starts after search_fixed (~14 min) + 1 min buffer
    filter_stress: {
      executor: "ramping-vus",
      startTime: "7m",
      stages: STAGES_TO_300,
      exec: "filterStress",
    },
    // Scenario 3: search with varied keywords — asserts keyword-independence
    // Starts after filter_stress (~8 min) + 1 min buffer
    search_varied: {
      executor: "ramping-vus",
      startTime: "14m",
      stages: STAGES_TO_300,
      exec: "searchVaried",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    search_error_rate: ["rate<0.05"],
    filter_error_rate: ["rate<0.05"],
    search_duration: ["p(95)<2000"],
    filter_duration: ["p(95)<2000"],
  },
};

// --- Scenario 1: Search fixed keyword ---
// All VUs hit GET /search/phone — isolates regex query cost at each VU level.
export function searchFixed() {
  group("Search fixed keyword", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/search/phone`, {
      tags: { name: "SearchFixed" },
    });
    const success = check(res, {
      "search status 200": (r) => r.status === 200,
    });
    searchErrorRate.add(!success);
    searchDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 2: Filter stress ---
// All VUs hit POST /product-filters — range query, lighter than regex.
export function filterStress() {
  group("Filter products", function () {
    const payload = JSON.stringify({ checked: [], radio: [0, 100] });
    const res = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      payload,
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "Filter" },
      }
    );
    const success = check(res, {
      "filter status 200": (r) => r.status === 200,
    });
    filterErrorRate.add(!success);
    filterDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 3: Search varied keywords ---
// Each VU picks a random keyword — asserts breaking point is keyword-independent.
export function searchVaried() {
  group("Search varied keywords", function () {
    const keyword =
      SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/search/${keyword}`,
      { tags: { name: "SearchVaried" } }
    );
    const success = check(res, {
      "varied search status 200": (r) => r.status === 200,
    });
    searchErrorRate.add(!success);
    searchDuration.add(res.timings.duration);
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    "tests/stress/results/stress-search-filter-report.html": htmlReport(data),
    "tests/stress/results/stress-search-filter-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
