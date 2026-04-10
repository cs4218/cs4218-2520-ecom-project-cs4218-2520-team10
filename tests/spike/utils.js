// File Created - YAN WEIDONG A0258151H
/**
 * Utility functions for spike testing: baseline measurement and recovery tracking
 */
import http from "k6/http";
import { sleep } from "k6";
import { RECOVERY_TOLERANCE, STABILITY_THRESHOLD, BASELINE_START, BASELINE_END, SPIKE_END, RECOVERY_START } from "./constants.js";

/**
 * Record response time metrics based on test phase
 * Works with both standard spike (3m30s) and double-spike (6m) scenarios
 * 
 * Standard spike timing:
 * - Baseline: 10-70s
 * - Spike: 70-140s
 * - Recovery: 150-210s
 * 
 * Double spike timing:
 * - Baseline: 10-70s
 * - First spike: 70-140s
 * - First recovery: 150-210s
 * - Second spike: 210-280s
 * - Second recovery: 290-350s
 */
export function recordPhaseMetrics(res, endpointName, elapsedTime, baselineTrend, spikeTrend, recoveryTrend, scenario) {
  const tags = { endpoint: endpointName, scenario: scenario };
  
  // Baseline phase (same for both scenarios)
  if (elapsedTime >= 10 && elapsedTime < 70) {
    baselineTrend.add(res.timings.duration, tags);
  }
  // Spike phase(s)
  else if (elapsedTime >= 70 && elapsedTime < 140) {
    // First spike (both scenarios)
    spikeTrend.add(res.timings.duration, tags);
  }
  else if (scenario === "full-journey-double-spike" && elapsedTime >= 210 && elapsedTime < 280) {
    // Second spike (double-spike only)
    spikeTrend.add(res.timings.duration, tags);
  }
  // Recovery phase(s)
  else if (elapsedTime >= 150 && elapsedTime < 210) {
    // First recovery (both scenarios)
    recoveryTrend.add(res.timings.duration, tags);
  }
  else if (scenario === "full-journey-double-spike" && elapsedTime >= 290) {
    // Second recovery (double-spike only)
    recoveryTrend.add(res.timings.duration, tags);
  }
  else if (scenario === "full-journey-standard" && elapsedTime >= 150) {
    // Standard recovery continues
    recoveryTrend.add(res.timings.duration, tags);
  }
  // Ramp periods (0-10s, 140-150s, 280-290s) are excluded from tracking
}

/**
 * Validate that a product object has required fields
 */
export function hasRequiredProductFields(product) {
  return (
    product.name !== undefined &&
    product.slug !== undefined &&
    product.price !== undefined
  );
}

/**
 * Validate that all products in an array have required fields
 */
export function validateProductArray(products) {
  if (!Array.isArray(products) || products.length === 0) return true;
  return products.every(hasRequiredProductFields);
}

/**
 * Measure baseline latency for an endpoint before spike test begins
 * Supports any HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
 * 
 * @returns {number} Average baseline latency in milliseconds
 */
export function measureBaselineLatency(url, iterations = 5, method = 'GET', payload = null) {
  const warmupResponses = [];
  
  for (let i = 0; i < iterations; i++) {
    let res;
    const methodUpper = method.toUpperCase();
    
    if (payload && (methodUpper === 'POST' || methodUpper === 'PUT' || methodUpper === 'PATCH')) {
      res = http.request(methodUpper, url, JSON.stringify(payload), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // GET, DELETE, or any other method without body
      res = http.request(methodUpper, url);
    }
    
    warmupResponses.push(res.timings.duration);
    sleep(0.5);
  }

  const avgBaseline = warmupResponses.reduce((a, b) => a + b, 0) / warmupResponses.length;

  return avgBaseline;
}

/**
 * Track recovery time after spike ends
 * Uses stability window: requires STABILITY_THRESHOLD consecutive successful requests
 * within RECOVERY_TOLERANCE of baseline before reporting recovery
 * Recovery tracking starts at RECOVERY_START (after spike ramp down)
 * 
 * @returns {object} Updated state object
 */
export function trackRecovery(
  response,
  endpointName,
  data,
  state,
  recoveryMetric,
  recoveryStartTime = RECOVERY_START,
  stabilityThreshold = STABILITY_THRESHOLD,
  recoveryTolerance = RECOVERY_TOLERANCE
) {
  const elapsedTime = (Date.now() - data.startTime) / 1000;
  
  if (elapsedTime > recoveryStartTime && !state.recoveryRecorded) {
    const baselineLatency = data.baselineLatency[endpointName];
    const isWithinAcceptedRange = response.timings.duration <= (baselineLatency * recoveryTolerance);

    if (isWithinAcceptedRange) {
      state.consecutiveRecovered++;
    } else {
      state.consecutiveRecovered = 0; // Reset on any failure
    }

    // Recovery achieved
    if (state.consecutiveRecovered >= stabilityThreshold) {
      const secondsToRecover = elapsedTime - recoveryStartTime;
      
      // Record recovery time for this specific endpoint
      recoveryMetric.add(secondsToRecover, { 
        endpoint: endpointName
      });

      state.recoveryRecorded = true; // Ensure this VU only reports once per test
    }
  }

  return state;
}
