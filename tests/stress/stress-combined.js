// Shaun Lee Xuan Wei, A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// [Stress Test] Combined API Workload Breaking Point
//
// Four scenarios run sequentially so each gets a clean server:
//
//   Scenario 1 (mixed_all):        50 → 300 VUs (~6 min)
//     All endpoints in sequence per iteration — identifies which breaks first.
//
//   Scenario 2 (read_heavy):       50 → 300 VUs (~6 min)
//     90% reads / 10% writes — measures read performance under extreme concurrency.
//
//   Scenario 3 (write_heavy):      50 → 300 VUs (~6 min)
//     50% reads / 50% writes — tests DB write concurrency and breaking point.
//
//   Scenario 4 (zero_think_time):  50 → 300 VUs (~6 min)
//     No sleep() — maximum request rate to find absolute server throughput ceiling.
//
// Total runtime: ~27 min (6 min + 1 min gap + 6 min + 1 min gap + 6 min + 1 min gap + 6 min)

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { STAGES_TO_300 } from "./stages.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:6060";

// --- Custom metrics ---
const mixedErrorRate = new Rate("mixed_error_rate");
const readHeavyErrorRate = new Rate("read_heavy_error_rate");
const writeHeavyErrorRate = new Rate("write_heavy_error_rate");
const zeroThinkErrorRate = new Rate("zero_think_error_rate");
const mixedDuration = new Trend("mixed_duration");
const readDuration = new Trend("read_duration");
const writeDuration = new Trend("write_duration");
const zeroThinkDuration = new Trend("zero_think_duration");
const totalRequests = new Counter("total_requests");

// --- Seed data ---
const TEST_EMAIL = "cs4218@test.com";
const TEST_PASSWORD = "cs4218@test.com";
const SEARCH_KEYWORDS = ["laptop", "phone", "book", "shirt", "camera"];


// --- k6 options ---
export const options = {
  scenarios: {
    // Scenario 1: all endpoints mixed per iteration
    mixed_all: {
      executor: "ramping-vus",
      startTime: "0s",
      stages: STAGES_TO_300,
      exec: "mixedAll",
    },
    // Scenario 2: read-heavy (90/10 split)
    // Starts after mixed_all (~14 min) + 1 min buffer
    read_heavy: {
      executor: "ramping-vus",
      startTime: "7m",
      stages: STAGES_TO_300,
      exec: "readHeavy",
    },
    // Scenario 3: write-heavy (50/50 split)
    // Starts after read_heavy (~7 min) + 1 min buffer
    write_heavy: {
      executor: "ramping-vus",
      startTime: "14m",
      stages: STAGES_TO_300,
      exec: "writeHeavy",
    },
    // Scenario 4: zero think time — maximum throughput
    // Starts after write_heavy (~5 min) + 1 min buffer
    zero_think_time: {
      executor: "ramping-vus",
      startTime: "21m",
      stages: STAGES_TO_300,
      exec: "zeroThinkTime",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    mixed_error_rate: ["rate<0.05"],
    read_heavy_error_rate: ["rate<0.05"],
    write_heavy_error_rate: ["rate<0.05"],
    zero_think_error_rate: ["rate<0.05"],
    mixed_duration: ["p(95)<3000"],
    read_duration: ["p(95)<2000"],
    write_duration: ["p(95)<3000"],
  },
};

// --- Helpers ---
function doRead(errorRate, durationTrend) {
  const ops = ["getProducts", "getCategories", "search"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let res;

  switch (op) {
    case "getProducts":
      res = http.get(`${BASE_URL}/api/v1/product/get-product`, {
        tags: { name: "Read_Products" },
      });
      break;
    case "getCategories":
      res = http.get(`${BASE_URL}/api/v1/category/get-category`, {
        tags: { name: "Read_Categories" },
      });
      break;
    case "search": {
      const kw = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
      res = http.get(`${BASE_URL}/api/v1/product/search/${kw}`, {
        tags: { name: "Read_Search" },
      });
      break;
    }
  }

  const success = check(res, { "read 200": (r) => r.status === 200 });
  errorRate.add(!success);
  durationTrend.add(res.timings.duration);
  totalRequests.add(1);
}

function doWrite(errorRate, durationTrend) {
  const ops = ["login", "filter"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let res;

  switch (op) {
    case "login":
      res = http.post(
        `${BASE_URL}/api/v1/auth/login`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
          headers: { "Content-Type": "application/json" },
          tags: { name: "Write_Login" },
        }
      );
      break;
    case "filter":
      res = http.post(
        `${BASE_URL}/api/v1/product/product-filters`,
        JSON.stringify({ checked: [], radio: [0, 100] }),
        {
          headers: { "Content-Type": "application/json" },
          tags: { name: "Write_Filter" },
        }
      );
      break;
  }

  const success = check(res, { "write 200": (r) => r.status === 200 });
  errorRate.add(!success);
  durationTrend.add(res.timings.duration);
  totalRequests.add(1);
}

// --- Scenario 1: Mixed all endpoints ---
// Each VU hits login + search + filter + products + categories sequentially.
// Per-endpoint tags allow comparison of which breaks first in the HTML report.
export function mixedAll() {
  group("Mixed all endpoints", function () {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
      { headers: { "Content-Type": "application/json" }, tags: { name: "Mixed_Login" } }
    );
    mixedDuration.add(loginRes.timings.duration);
    totalRequests.add(1);

    const kw = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
    const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${kw}`, {
      tags: { name: "Mixed_Search" },
    });
    mixedDuration.add(searchRes.timings.duration);
    totalRequests.add(1);

    const filterRes = http.post(
      `${BASE_URL}/api/v1/product/product-filters`,
      JSON.stringify({ checked: [], radio: [0, 100] }),
      { headers: { "Content-Type": "application/json" }, tags: { name: "Mixed_Filter" } }
    );
    mixedDuration.add(filterRes.timings.duration);
    totalRequests.add(1);

    const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
      tags: { name: "Mixed_Products" },
    });
    mixedDuration.add(productsRes.timings.duration);
    totalRequests.add(1);

    const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
      tags: { name: "Mixed_Categories" },
    });
    mixedDuration.add(catRes.timings.duration);
    totalRequests.add(1);

    const allSuccess =
      loginRes.status === 200 &&
      searchRes.status === 200 &&
      filterRes.status === 200 &&
      productsRes.status === 200 &&
      catRes.status === 200;
    mixedErrorRate.add(!allSuccess);
  });
  sleep(1);
}

// --- Scenario 2: Read-heavy workload (90% reads / 10% writes) ---
export function readHeavy() {
  group("Read-heavy workload", function () {
    if (Math.random() < 0.9) {
      doRead(readHeavyErrorRate, readDuration);
    } else {
      doWrite(readHeavyErrorRate, readDuration);
    }
  });
  sleep(0.5);
}

// --- Scenario 3: Write-heavy workload (50% reads / 50% writes) ---
export function writeHeavy() {
  group("Write-heavy workload", function () {
    if (Math.random() < 0.5) {
      doRead(writeHeavyErrorRate, writeDuration);
    } else {
      doWrite(writeHeavyErrorRate, writeDuration);
    }
  });
  sleep(0.5);
}

// --- Scenario 4: Zero think time ---
// No sleep() — hammers server at maximum request rate.
// Reveals absolute throughput ceiling and the req/s at which errors begin.
export function zeroThinkTime() {
  group("Zero think time", function () {
    doRead(zeroThinkErrorRate, zeroThinkDuration);
  });
  // No sleep — intentional
}

export function handleSummary(data) {
  return {
    "tests/stress/results/stress-combined-report.html": htmlReport(data),
    "tests/stress/results/stress-combined-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
