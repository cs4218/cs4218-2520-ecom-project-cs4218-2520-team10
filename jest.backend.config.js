export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  // Fix: Added helpers and middlewares folders to test match - KIM SHI TONG A0265858J
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/helpers/*.test.js", "<rootDir>/middlewares/*.test.js"],

  // jest code coverage
  // Fix: Added helpers and middlewares folders to coverage collection - KIM SHI TONG A0265858J
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "helpers/**", "middlewares/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
