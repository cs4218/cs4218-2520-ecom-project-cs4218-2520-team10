const { spawnSync } = require('child_process');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');

const rootDir = process.cwd();
const soakDir = resolve(rootDir, 'tests/soak');
const reportsDir = resolve(soakDir, 'reports');
const resetScript = resolve(rootDir, 'tests/soak/db-reset-seed.cjs');

const suite = [
  { name: 'soak-auth-category', file: 'tests/soak/soak-auth-category.test.js' },
  { name: 'soak-heavy-payload', file: 'tests/soak/soak-heavy-payload.test.js' },
  { name: 'soak-product-browsing', file: 'tests/soak/soak-product-browsing.test.js' },
  { name: 'soak-search-filter', file: 'tests/soak/soak-search-filter.test.js' },
  { name: 'soak-user-journey', file: 'tests/soak/soak-user-journey.test.js' },
];

const selected = (process.env.SOAK_ONLY || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const runs = selected.length > 0
  ? suite.filter((t) => selected.includes(t.name))
  : suite;

if (runs.length === 0) {
  console.error('No soak tests selected. Check SOAK_ONLY value.');
  process.exit(1);
}

if (!existsSync(reportsDir)) {
  mkdirSync(reportsDir, { recursive: true });
}

function fmtNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : 'N/A';
}

function getMetric(summary, metricName, stat) {
  const metric = summary?.metrics?.[metricName];
  if (!metric) return null;
  if (Object.prototype.hasOwnProperty.call(metric, stat)) return metric[stat];
  if (stat === 'rate') return metric.rate ?? metric.value ?? null;
  if (stat === 'count') return metric.count ?? null;
  return null;
}

function getFirstMetric(summary, metricNames, stat) {
  for (const metricName of metricNames) {
    const value = getMetric(summary, metricName, stat);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function runReset(phase, testName) {
  console.log(`\n--- DB reset ${phase} ${testName} ---`);
  const result = spawnSync('node', [resetScript], {
    stdio: 'inherit',
    cwd: rootDir,
    env: process.env,
  });
  return typeof result.status === 'number' ? result.status : 1;
}

function runSingle(test) {
  const preResetExitCode = runReset('before', test.name);
  if (preResetExitCode !== 0) {
    return {
      test,
      exitCode: 1,
      preResetExitCode,
      postResetExitCode: null,
      summaryPath: null,
      summary: null,
    };
  }

  const summaryPath = join(reportsDir, `${test.name}.summary.json`);
  const args = ['run', '--summary-export', summaryPath];

  if (process.env.SOAK_DURATION) {
    args.push('-e', `SOAK_DURATION=${process.env.SOAK_DURATION}`);
  }

  if (process.env.API_URL) {
    args.push('-e', `API_URL=${process.env.API_URL}`);
  }

  args.push(test.file);

  console.log(`\n=== Running ${test.name} (${test.file}) ===`);
  const result = spawnSync(process.env.K6_BIN || 'k6', args, {
    stdio: 'inherit',
    cwd: rootDir,
    env: process.env,
  });

  const k6ExitCode = typeof result.status === 'number' ? result.status : 1;
  const postResetExitCode = runReset('after', test.name);
  const exitCode = k6ExitCode !== 0 || postResetExitCode !== 0 ? 1 : 0;
  let summary = null;

  try {
    summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));
  } catch (error) {
    summary = null;
  }

  return {
    test,
    exitCode,
    preResetExitCode,
    postResetExitCode,
    k6ExitCode,
    summaryPath,
    summary,
  };
}

function buildCombinedJson(results) {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    total: results.length,
    passed: results.filter((r) => r.exitCode === 0).length,
    failed: results.filter((r) => r.exitCode !== 0).length,
    runs: results.map((r) => ({
      name: r.test.name,
      file: r.test.file,
      exitCode: r.exitCode,
      preResetExitCode: r.preResetExitCode,
      k6ExitCode: r.k6ExitCode ?? null,
      postResetExitCode: r.postResetExitCode,
      summaryPath: r.summaryPath,
      throughputReqPerSec: getFirstMetric(r.summary, ['http_reqs', 'requests', 'heavy_payload_total_requests'], 'rate'),
      responseP95Ms: getFirstMetric(r.summary, ['http_req_duration', 'latency'], 'p(95)'),
      responseP99Ms: getFirstMetric(r.summary, ['http_req_duration', 'latency'], 'p(99)'),
      errorRate: getFirstMetric(r.summary, ['http_req_failed', 'errors', 'error_rate'], 'rate'),
      totalRequests: getFirstMetric(r.summary, ['http_reqs', 'requests', 'heavy_payload_total_requests'], 'count'),
    })),
  };
}

function buildHtml(results, combined) {
  const rows = results.map((r) => {
    const throughput = getFirstMetric(r.summary, ['http_reqs', 'requests', 'heavy_payload_total_requests'], 'rate');
    const p95 = getFirstMetric(r.summary, ['http_req_duration', 'latency'], 'p(95)');
    const p99 = getFirstMetric(r.summary, ['http_req_duration', 'latency'], 'p(99)');
    const err = getFirstMetric(r.summary, ['http_req_failed', 'errors', 'error_rate'], 'rate');
    const total = getFirstMetric(r.summary, ['http_reqs', 'requests', 'heavy_payload_total_requests'], 'count');

    const status = r.exitCode === 0 ? 'PASS' : 'FAIL';
    const statusClass = r.exitCode === 0 ? 'pass' : 'fail';
    const resetStatus = r.preResetExitCode === 0 && r.postResetExitCode === 0 ? 'OK' : 'FAIL';

    return `
      <tr>
        <td>${r.test.name}</td>
        <td>${r.test.file}</td>
        <td class="${statusClass}">${status}</td>
        <td>${resetStatus}</td>
        <td>${fmtNumber(throughput)}</td>
        <td>${fmtNumber(p95)}</td>
        <td>${fmtNumber(p99)}</td>
        <td>${fmtNumber((err ?? NaN) * 100)}</td>
        <td>${Number.isFinite(total) ? total : 'N/A'}</td>
      </tr>
    `;
  }).join('\n');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Soak Test Suite Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; }
    h1 { margin-bottom: 8px; }
    .meta { color: #444; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
    th { background: #f5f5f5; text-align: left; }
    .pass { color: #0a7f2e; font-weight: 700; }
    .fail { color: #b00020; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Soak Test Suite Report</h1>
  <div class="meta">Generated at: ${combined.generatedAt}</div>
  <div class="meta">Passed: ${combined.passed} / ${combined.total}, Failed: ${combined.failed}</div>

  <table>
    <thead>
      <tr>
        <th>Test</th>
        <th>File</th>
        <th>Status</th>
        <th>DB Reset</th>
        <th>Throughput (req/s)</th>
        <th>Response p95 (ms)</th>
        <th>Response p99 (ms)</th>
        <th>HTTP Error Rate (%)</th>
        <th>Total Requests</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

const results = runs.map(runSingle);
const combined = buildCombinedJson(results);

const jsonOut = resolve(reportsDir, 'soak-test-results.json');
const htmlOut = resolve(reportsDir, 'soak-test-report.html');

writeFileSync(jsonOut, JSON.stringify(combined, null, 2));
writeFileSync(htmlOut, buildHtml(results, combined));

console.log(`\nCombined JSON: ${jsonOut}`);
console.log(`Combined HTML: ${htmlOut}`);
console.log(`Per-test summaries: ${reportsDir}`);

const failed = results.some((r) => r.exitCode !== 0);
process.exit(failed ? 1 : 0);
