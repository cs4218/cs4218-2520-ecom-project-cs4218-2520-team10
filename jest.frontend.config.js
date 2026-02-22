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
  // Added axios to transformIgnorePatterns for ES module support - KIM SHI TONG A0265858J
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js|axios)$)"],

  // only run these tests
  testMatch: [
    "<rootDir>/client/src/pages/**/*.test.js",
    "<rootDir>/client/src/context/*.test.js",
    "<rootDir>/client/src/hooks/*.test.js",
    "<rootDir>/client/src/components/Form/CategoryForm.test.js"
  ],
  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/context/auth.js",
    "client/src/pages/Auth/Register.js",
    "client/src/pages/Auth/Login.js",
    "client/src/pages/Admin/CreateCategory.js",
    "client/src/pages/Admin/CreateProduct.js",
    "client/src/pages/Admin/Products.js",
    "client/src/pages/Admin/UpdateProduct.js",
    "client/src/pages/user/Orders.js",
    "client/src/pages/ProductDetails.js",
    "client/src/pages/CategoryProduct.js",
    "client/src/pages/Categories.js",
    "client/src/hooks/useCategory.js",
    "client/src/components/Form/CategoryForm.js"
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
