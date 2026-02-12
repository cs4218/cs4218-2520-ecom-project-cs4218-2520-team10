export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock and axios (needed for ES modules)
  // Fix: Added axios to transformIgnorePatterns for ES module support - KIM SHI TONG A0265858J
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js|axios)$)"],

  // only run these tests
  // Fix: Added context test files to test match - KIM SHI TONG A0265858J
  testMatch: [
    "<rootDir>/client/src/pages/Auth/*.test.js",
    "<rootDir>/client/src/context/*.test.js"
  ],

  // jest code coverage
  // Fix: Added context folder to coverage collection - KIM SHI TONG A0265858J
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/pages/Auth/**",
    "client/src/context/**"
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
