// Re-export all test scenarios and options from spike-product-browsing.js
export {
  options,
  setup,
  testGetAllProducts,
  testProductPagination,
  testProductDetail,
  testProductCount,
  teardown,
  default as defaultTest,
} from "./spike-product-browsing.js";
