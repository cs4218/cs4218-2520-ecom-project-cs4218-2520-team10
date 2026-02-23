export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/helpers/*.test.js", "<rootDir>/middlewares/*.test.js", "<rootDir>/models/*.test.js"],

  // jest code coverage
  // Fix: Added helpers and middlewares folders to coverage collection - KIM SHI TONG A0265858J
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "helpers/**", "middlewares/**", "models/**"],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
    },
  },
};
