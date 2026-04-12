// Shaun Lee Xuan Wei, A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// [Stress Test] Product Browsing Endpoints Breaking Point
//
// Four scenarios run sequentially so each gets a clean server:
//
//   Scenario 1 (get_all_products):  50 → 300 VUs (~6 min)
//     Full collection read — baseline for DB read performance.
//
//   Scenario 2 (paginated_list):    50 → 300 VUs (~6 min)
//     Skip/limit query — compare breaking point against full collection read.
//
//   Scenario 3 (product_photo):     50 → 300 VUs (~6 min)
//     Binary I/O — expected to break earliest due to bandwidth/I/O overhead.
//
//   Scenario 4 (product_count):     50 → 300 VUs (~6 min)
//     Lightweight aggregation — expected to survive longest.
//
// Total runtime: ~27 min (6 min + 1 min gap + 6 min + 1 min gap + 6 min + 1 min gap + 6 min)

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { STAGES_TO_300 } from "./stages.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const getAllErrorRate = new Rate("get_all_error_rate");
const paginatedErrorRate = new Rate("paginated_error_rate");
const photoErrorRate = new Rate("photo_error_rate");
const countErrorRate = new Rate("count_error_rate");
const getAllDuration = new Trend("get_all_duration");
const paginatedDuration = new Trend("paginated_duration");
const photoDuration = new Trend("photo_duration");
const countDuration = new Trend("count_duration");

// --- Seed data ---
const PRODUCT_IDS = [
  "66db427fdb0119d9234b27f3", // laptop
  "66db427fdb0119d9234b27f1", // textbook
  "66db427fdb0119d9234b27f5", // smartphone
  "66db427fdb0119d9234b27f9", // novel
  "67a21772a6d9e00ef2ac022a", // nus-tshirt
];


// --- k6 options ---
export const options = {
  scenarios: {
    // Scenario 1: GET all products — full collection read
    get_all_products: {
      executor: "ramping-vus",
      startTime: "0s",
      stages: STAGES_TO_300,
      exec: "getAllProducts",
    },
    // Scenario 2: GET paginated list — skip/limit query
    // Starts after get_all_products (~14 min) + 1 min buffer
    paginated_list: {
      executor: "ramping-vus",
      startTime: "7m",
      stages: STAGES_TO_300,
      exec: "getPaginatedList",
    },
    // Scenario 3: GET product photo — binary I/O stress
    // Starts after paginated_list (~8 min) + 1 min buffer
    product_photo: {
      executor: "ramping-vus",
      startTime: "14m",
      stages: STAGES_TO_300,
      exec: "getProductPhoto",
    },
    // Scenario 4: GET product count — lightweight aggregation
    // Starts after product_photo (~6 min) + 1 min buffer
    product_count: {
      executor: "ramping-vus",
      startTime: "21m",
      stages: STAGES_TO_300,
      exec: "getProductCount",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    get_all_error_rate: ["rate<0.05"],
    paginated_error_rate: ["rate<0.05"],
    photo_error_rate: ["rate<0.05"],
    count_error_rate: ["rate<0.05"],
    get_all_duration: ["p(95)<2000"],
    paginated_duration: ["p(95)<2000"],
    photo_duration: ["p(95)<3000"],
    count_duration: ["p(95)<1000"],
  },
};

// --- Scenario 1: GET all products ---
export function getAllProducts() {
  group("GET all products", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "GetAllProducts" },
    });
    const success = check(res, {
      "get-all status 200": (r) => r.status === 200,
      "get-all has products": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && Array.isArray(body.products);
      },
    });
    getAllErrorRate.add(!success);
    getAllDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 2: GET paginated list ---
export function getPaginatedList() {
  group("GET paginated list", function () {
    const page = Math.floor(Math.random() * 3) + 1;
    const res = http.get(
      `${BASE_URL}/api/v1/product/product-list/${page}`,
      { tags: { name: "PaginatedList" } }
    );
    const success = check(res, {
      "paginated status 200": (r) => r.status === 200,
    });
    paginatedErrorRate.add(!success);
    paginatedDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 3: GET product photo ---
// 200 (photo exists) or 404 (no photo set) are both acceptable — only 500 is a failure.
export function getProductPhoto() {
  group("GET product photo", function () {
    const pid = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];
    const res = http.get(
      `${BASE_URL}/api/v1/product/product-photo/${pid}`,
      { tags: { name: "ProductPhoto" } }
    );
    const success = check(res, {
      "photo no 500": (r) => r.status !== 500,
      "photo handled": (r) => r.status === 200 || r.status === 404,
    });
    photoErrorRate.add(!success);
    photoDuration.add(res.timings.duration);
  });
  sleep(1);
}

// --- Scenario 4: GET product count ---
export function getProductCount() {
  group("GET product count", function () {
    const res = http.get(`${BASE_URL}/api/v1/product/product-count`, {
      tags: { name: "ProductCount" },
    });
    const success = check(res, {
      "count status 200": (r) => r.status === 200,
      "count has total": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && typeof body.total === "number";
      },
    });
    countErrorRate.add(!success);
    countDuration.add(res.timings.duration);
  });
  sleep(1);
}

export function handleSummary(data) {
  return {
    "tests/stress/results/stress-product-browsing-report.html": htmlReport(data),
    "tests/stress/results/stress-product-browsing-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
