// Shaun Lee Xuan Wei, A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// [Stress Test] Category Endpoints Breaking Point
//
// Two scenarios run sequentially so each gets a clean server:
//
//   Scenario 1 (get_all_categories): 50 → 300 VUs (~6 min)
//     Simple DB query — expected to outlast login/search. Document the ceiling.
//
//   Scenario 2 (single_category):    50 → 300 VUs (~6 min)
//     Single category lookup — compare breaking point against get-all.
//
// Total runtime: ~13 min (6 min + 1 min gap + 6 min)

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { STAGES_TO_300 } from "./stages.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const getAllCatErrorRate = new Rate("get_all_categories_error_rate");
const singleCatErrorRate = new Rate("single_category_error_rate");
const getAllCatDuration = new Trend("get_all_categories_duration");
const singleCatDuration = new Trend("single_category_duration");

// --- Seed data ---
const CATEGORY_SLUGS = ["electronics", "book", "clothing"];

// --- k6 options ---
export const options = {
  scenarios: {
    // Scenario 1: GET all categories — full escalation
    get_all_categories: {
      executor: "ramping-vus",
      startTime: "0s",
      stages: STAGES_TO_300,
      exec: "getAllCategories",
    },
    // Scenario 2: GET single category — starts after get_all_categories (~14 min) + 1 min buffer
    single_category: {
      executor: "ramping-vus",
      startTime: "7m",
      stages: STAGES_TO_300,
      exec: "getSingleCategory",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    get_all_categories_error_rate: ["rate<0.05"],
    single_category_error_rate: ["rate<0.05"],
    get_all_categories_duration: ["p(95)<2000"],
    single_category_duration: ["p(95)<2000"],
  },
};

// --- Scenario 1: GET all categories ---
// Simple DB query — expected to survive to higher VU counts than login/search.
export function getAllCategories() {
  group("GET all categories", function () {
    const res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "GetAllCategories" },
    });
    const success = check(res, {
      "get-all-cat status 200": (r) => r.status === 200,
      "get-all-cat returns array": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && Array.isArray(body.category);
      },
    });
    getAllCatErrorRate.add(!success);
    getAllCatDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 2: GET single category ---
export function getSingleCategory() {
  group("GET single category", function () {
    const slug = CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/category/single-category/${slug}`,
      { tags: { name: "SingleCategory" } }
    );
    const success = check(res, {
      "single-cat status 200": (r) => r.status === 200,
      "single-cat has name": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.category && body.category.name;
      },
    });
    singleCatErrorRate.add(!success);
    singleCatDuration.add(res.timings.duration);
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    "tests/stress/results/stress-category-report.html": htmlReport(data),
    "tests/stress/results/stress-category-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
