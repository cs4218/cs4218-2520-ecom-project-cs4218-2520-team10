/**
 * Soak test suite script written by Ong Chang Heng Bertrand A0253013X
 *
 * This script runs multiple soak test scenarios sequentially, with database resets before and after each test.
 */

const { spawn } = require('child_process');
const { spawnSync } = require('child_process');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');

const rootDir = process.cwd();
const soakDir = resolve(rootDir, 'tests/soak');
const reportsDir = resolve(soakDir, 'reports');
const resetScript = resolve(rootDir, 'tests/soak/db-reset-seed.cjs');
const SOAK_PRODUCTS_FILE = 'test.products.soak.json';
const ORIGINAL_PRODUCTS_FILE = 'test.products.json';
const DEFAULT_SOAK_DURATION = '12h';
const DEFAULT_MEMORY_SAMPLE_INTERVAL_MS = 5 * 60 * 1000;

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

function runCommandCapture(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf-8',
    ...options,
  });
}

function detectBackendPid() {
  const portProbe = runCommandCapture('bash', ['-lc', 'lsof -ti tcp:6060 -sTCP:LISTEN | head -n 1'], { cwd: rootDir });
  const portPid = Number.parseInt(portProbe.stdout?.trim() || '', 10);
  if (Number.isFinite(portPid)) {
    return portPid;
  }

  const processProbe = runCommandCapture('bash', ['-lc', "pgrep -f 'node .*server\\.js' | head -n 1"], { cwd: rootDir });
  const processPid = Number.parseInt(processProbe.stdout?.trim() || '', 10);
  if (Number.isFinite(processPid)) {
    return processPid;
  }

  return null;
}

function readRssMb(pid) {
  if (!Number.isFinite(pid)) return null;

  const result = runCommandCapture('ps', ['-o', 'rss=', '-p', String(pid)], { cwd: rootDir });
  const rssKb = Number.parseInt(result.stdout?.trim() || '', 10);
  if (!Number.isFinite(rssKb)) return null;

  return rssKb / 1024;
}

function sampleBackendMemory() {
  const pid = detectBackendPid();
  if (!Number.isFinite(pid)) {
    return null;
  }

  const rssMb = readRssMb(pid);
  if (!Number.isFinite(rssMb)) {
    return null;
  }

  return {
    pid,
    rssMb,
    sampledAt: new Date().toISOString(),
  };
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

function runReset(phase, testName, extraEnv = {}) {
  console.log(`\n--- DB reset ${phase} ${testName} ---`);
  const result = spawnSync('node', [resetScript], {
    stdio: 'inherit',
    cwd: rootDir,
    env: { ...process.env, ...extraEnv },
  });
  return typeof result.status === 'number' ? result.status : 1;
}

function runK6WithMemorySampling(test, summaryPath) {
  return new Promise((settle) => {
    const args = ['run', '--summary-export', summaryPath];
    const soakDuration = process.env.SOAK_DURATION || DEFAULT_SOAK_DURATION;
    args.push('-e', `SOAK_DURATION=${soakDuration}`);

    args.push(test.file);

    console.log(`\n=== Running ${test.name} (${test.file}) ===`);

    const backendPid = detectBackendPid();
    const memorySamples = [];

    const initialSample = sampleBackendMemory();
    if (initialSample) {
      memorySamples.push(initialSample);
    }

    const child = spawn(process.env.K6_BIN || 'k6', args, {
      stdio: 'inherit',
      cwd: rootDir,
      env: process.env,
    });

    const intervalMs = Number.parseInt(
      process.env.SOAK_MEMORY_SAMPLE_INTERVAL_MS || String(DEFAULT_MEMORY_SAMPLE_INTERVAL_MS),
      10,
    );
    const sampler = Number.isFinite(intervalMs) && intervalMs > 0 && backendPid !== null
      ? setInterval(() => {
          const sample = sampleBackendMemory();
          if (sample) {
            memorySamples.push(sample);
          }
        }, intervalMs)
      : null;

    child.on('close', (code) => {
      if (sampler) {
        clearInterval(sampler);
      }

      const finalSample = sampleBackendMemory();
      if (finalSample) {
        memorySamples.push(finalSample);
      }

      const memoryLogPath = resolve(reportsDir, `${test.name}.memory.json`);
      writeFileSync(memoryLogPath, JSON.stringify({
        backendPid,
        sampleIntervalMs: Number.isFinite(intervalMs) ? intervalMs : null,
        peakRssMb: memorySamples.length > 0
          ? Math.max(...memorySamples.map((sample) => sample.rssMb))
          : null,
        samples: memorySamples,
      }, null, 2));

      settle({
        k6ExitCode: typeof code === 'number' ? code : 1,
        memoryLogPath,
        backendPid,
        memorySamples,
      });
    });
  });
}

async function runSingle(test) {
  const preResetExitCode = runReset('before', test.name, { SOAK_PRODUCTS_FILE });
  if (preResetExitCode !== 0) {
    return {
      test,
      exitCode: 1,
      preResetExitCode,
      postResetExitCode: null,
      summaryPath: null,
      memoryLogPath: null,
      summary: null,
      memory: null,
    };
  }

  const summaryPath = join(reportsDir, `${test.name}.summary.json`);
  const runResult = await runK6WithMemorySampling(test, summaryPath);
  const k6ExitCode = runResult.k6ExitCode;
  const postResetExitCode = runReset('after', test.name, { SOAK_PRODUCTS_FILE });
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
    memoryLogPath: runResult.memoryLogPath,
    summary,
    memory: runResult,
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
      backendPid: r.memory?.backendPid ?? null,
      backendMemoryPeakMb: r.memory?.memorySamples?.length
        ? Math.max(...r.memory.memorySamples.map((sample) => sample.rssMb))
        : null,
      backendMemoryFirstMb: r.memory?.memorySamples?.[0]?.rssMb ?? null,
      backendMemoryLastMb: r.memory?.memorySamples?.[r.memory.memorySamples.length - 1]?.rssMb ?? null,
      memoryLogPath: r.memoryLogPath,
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
    const memorySamples = r.memory?.memorySamples || [];
    const memoryStart = memorySamples[0]?.rssMb ?? null;
    const memoryPeak = memorySamples.length > 0
      ? Math.max(...memorySamples.map((sample) => sample.rssMb))
      : null;
    const memoryEnd = memorySamples[memorySamples.length - 1]?.rssMb ?? null;

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
        <td>${fmtNumber(memoryStart)}</td>
        <td>${fmtNumber(memoryPeak)}</td>
        <td>${fmtNumber(memoryEnd)}</td>
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
        <th>Memory start (MB)</th>
        <th>Memory peak (MB)</th>
        <th>Memory end (MB)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const results = [];

  for (const test of runs) {
    results.push(await runSingle(test));
  }

  const combined = buildCombinedJson(results);

  const jsonOut = resolve(reportsDir, 'soak-test-results.json');
  const htmlOut = resolve(reportsDir, 'soak-test-report.html');

  writeFileSync(jsonOut, JSON.stringify(combined, null, 2));
  writeFileSync(htmlOut, buildHtml(results, combined));

  console.log(`\nCombined JSON: ${jsonOut}`);
  console.log(`Combined HTML: ${htmlOut}`);
  console.log(`Per-test summaries: ${reportsDir}`);

  const restoreOriginalExitCode = runReset('restore-original-products', 'suite', {
    SOAK_PRODUCTS_FILE: ORIGINAL_PRODUCTS_FILE,
  });

  if (restoreOriginalExitCode === 0) {
    console.log(`Restored original products from ${ORIGINAL_PRODUCTS_FILE}.`);
  } else {
    console.log('Failed to restore original products at end of suite.');
  }

  const failed = results.some((r) => r.exitCode !== 0) || restoreOriginalExitCode !== 0;
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  console.error('Soak suite failed:', error);
  process.exit(1);
});
