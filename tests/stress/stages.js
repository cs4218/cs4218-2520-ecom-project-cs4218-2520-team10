// Shaun Lee Xuan Wei, A0252626E
// Shared k6 stage profiles for stress tests.
// Imported by all stress-*.js files via ES module import.
// Ramp: 10s per step, Hold: 1m per step.
// Max 300 VUs = 6× baseline of 50 VUs (standard stress test multiplier).

export const STAGES_TO_300 = [
  { duration: "10s", target: 50 },
  { duration: "1m", target: 50 },
  { duration: "10s", target: 100 },
  { duration: "1m", target: 100 },
  { duration: "10s", target: 200 },
  { duration: "1m", target: 200 },
  { duration: "10s", target: 300 },
  { duration: "1m", target: 300 },
  { duration: "1m", target: 0 },
]; // ~6 min
