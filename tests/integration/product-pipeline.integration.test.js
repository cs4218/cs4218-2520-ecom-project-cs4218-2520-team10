/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel.js";
import orderModel from "../../models/orderModel.js";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Integration tests for Product routes, middleware, and controllers (16 tests)
 *
 * 1. Admin creates product via multipart form
 *  - Create product with valid data (201)
 *  - Reject product creation for non-admin user (401)
 *  - Reject product creation without auth token (401)
 *  - Validate required fields on product creation (422)
 * 2. Public gets product list (no auth required)
 *  - Return product list to unauthenticated user (200)
 *  - Return empty array when no products exist (200)
 *  - Limit returned products to 12 and sort by newest (200)
 * 3. Public searches products
 *  - Search products by name (case-insensitive) (200)
 *  - Search products by description keyword (200)
 *  - Return empty array for no matching search (200)
 * 4. Public gets product by category
 *  - Return category with its products (200)
 *  - Return empty products array for category with no products (200)
 *  - Return 404 for non-existent category
 * 5. Authenticated user makes payment
 *  - Create order after payment for authenticated user (200)
 *  - Reject payment without authentication (401)
 *  - Reduce product quantity after successful payment (200)
 */

// Supppress console logs
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock("braintree", () => {
  const saleMock = jest.fn();

  if (!global.mockTransactionSale) {
    global.mockTransactionSale = saleMock;
  }

  return {
    BraintreeGateway: jest.fn(function () {
      this.transaction = {
        sale: global.mockTransactionSale,
      };
      this.clientToken = {
        generate: jest.fn((options, cb) => cb(null, { clientToken: "mock-client-token" })),
      };
      return this;
    }),
    Environment: {
      Sandbox: "sandbox",
    },
  };
});

describe("BE-INT-7: Product Route ↔ Middleware ↔ Controller (Full Pipeline)", () => {
  let mongoServer;
  let adminToken;
  let userToken;
  let testUser;
  let testAdmin;
  let testCategory1;
  let testCategory2;

  jest.setTimeout(30000);

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    // Create in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to in-memory test database");

    // Create test admin user
    testAdmin = await userModel.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: "hashedpassword",
      phone: "1234567890",
      address: "Admin Address",
      answer: "admin answer",
      role: 1, // Admin role
    });

    // Generate admin JWT token
    adminToken = JWT.sign(
      { _id: testAdmin._id },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "7d" }
    );

    // Create test regular user
    testUser = await userModel.create({
      name: "Test User",
      email: "user@test.com",
      password: "hashedpassword",
      phone: "0987654321",
      address: "User Address",
      answer: "user answer",
      role: 0, // Regular user
    });

    // Generate user JWT token
    userToken = JWT.sign(
      { _id: testUser._id },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "7d" }
    );

    console.log("Created test admin and user with tokens");
  });

  beforeEach(async () => {
    // Clear collections
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await orderModel.deleteMany({});

    // Create test categories
    testCategory1 = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    testCategory2 = await categoryModel.create({
      name: "Clothing",
      slug: "clothing",
    });

    console.log("Test database reset");
  });

  afterAll(async () => {
    // Final cleanup
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
    await orderModel.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();

    console.log("Disconnected from in-memory test database");
  });

  describe("Test 1: Admin creates product via multipart form", () => {
    it("should create product with correct category and return 201", async () => {
      const productData = {
        name: "iPhone 14 Pro",
        description: "Latest Apple flagship smartphone with advanced camera",
        price: 1099,
        category: testCategory1._id.toString(),
        quantity: 25,
        shipping: true,
      };

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken) // Admin auth
        .field("name", productData.name)
        .field("description", productData.description)
        .field("price", productData.price)
        .field("category", productData.category)
        .field("quantity", productData.quantity)
        .field("shipping", productData.shipping);

      // Assertions
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("successfully");
      expect(res.body.products).toBeDefined();
      expect(res.body.products.name).toBe(productData.name);
      expect(res.body.products.category.toString()).toBe(testCategory1._id.toString());

      // Verify in database
      const dbProduct = await productModel.findById(res.body.products._id).populate("category");
      expect(dbProduct).toBeDefined();
      expect(dbProduct.name).toBe(productData.name);
      expect(dbProduct.category.name).toBe("Electronics");
    });

    it("should reject product creation for non-admin user (401)", async () => {
      const productData = {
        name: "Unauthorized Product",
        description: "This should fail",
        price: 99,
        category: testCategory1._id.toString(),
        quantity: 10,
        shipping: false,
      };

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", userToken) // Regular user auth
        .field("name", productData.name)
        .field("description", productData.description)
        .field("price", productData.price)
        .field("category", productData.category)
        .field("quantity", productData.quantity)
        .field("shipping", productData.shipping);

      expect([401]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it("should reject product creation without auth token (401)", async () => {
      const res = await request(app)
        .post("/api/v1/product/create-product")
        // No Authorization header
        .field("name", "No Auth Product")
        .field("description", "Should fail")
        .field("price", 50)
        .field("category", testCategory1._id.toString())
        .field("quantity", 5)
        .field("shipping", true);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual(expect.any(String));
    });

    it("should validate required fields on product creation", async () => {
      // Missing required field: name
      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", adminToken)
        .field("description", "Missing name")
        .field("price", 99)
        .field("category", testCategory1._id.toString())
        .field("quantity", 10)
        .field("shipping", true);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("required");
    });
  });

  describe("Test 2: Public gets product list (no auth required)", () => {
    it("should return product list to unauthenticated user (200)", async () => {
      // Create test products
      await productModel.create([
        {
          name: "Laptop",
          slug: "laptop",
          description: "High-performance laptop",
          price: 1299,
          category: testCategory1._id,
          quantity: 10,
          shipping: true,
        },
        {
          name: "Mouse",
          slug: "mouse",
          description: "Wireless mouse",
          price: 29,
          category: testCategory1._id,
          quantity: 50,
          shipping: true,
        },
        {
          name: "T-Shirt",
          slug: "t-shirt",
          description: "Cotton T-Shirt",
          price: 25,
          category: testCategory2._id,
          quantity: 100,
          shipping: true,
        },
      ]);

      // No auth required
      const res = await request(app).get("/api/v1/product/get-product");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeDefined();
      expect(res.body.products.length).toBeGreaterThan(0);
      expect(res.body.countTotal).toBeGreaterThan(0);

      // Verify products have category populated
      res.body.products.forEach((product) => {
        expect(product.category).toBeDefined();
        expect(product.category.name).toBeDefined();
        expect(product.photo).toBeUndefined(); // Photo should be excluded
      });
    });

    it("should return empty array when no products exist", async () => {
      const res = await request(app).get("/api/v1/product/get-product");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toEqual([]);
      expect(res.body.countTotal).toBe(0);
    });

    it("should limit returned products to 12 and sort by newest", async () => {
      // Create 15 products
      const products = [];
      for (let i = 1; i <= 15; i++) {
        products.push({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: i * 100,
          category: testCategory1._id,
          quantity: 10,
          shipping: true,
        });
      }
      await productModel.create(products);

      const res = await request(app).get("/api/v1/product/get-product");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(12);
      expect(res.body.countTotal).toBe(12);

      // Verify sorted by newest (descending createdAt)
      for (let i = 0; i < res.body.products.length - 1; i++) {
        const current = new Date(res.body.products[i].createdAt);
        const next = new Date(res.body.products[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });
  });

  describe("Test 3: Public searches products", () => {
    it("should search products by name (case-insensitive)", async () => {
      await productModel.create([
        {
          name: "Samsung Galaxy S21",
          slug: "samsung-galaxy-s21",
          description: "Flagship phone",
          price: 999,
          category: testCategory1._id,
          quantity: 15,
          shipping: true,
        },
        {
          name: "Samsung TV 55 inch",
          slug: "samsung-tv-55-inch",
          description: "4K Smart TV",
          price: 599,
          category: testCategory1._id,
          quantity: 8,
          shipping: true,
        },
      ]);

      // Search for "Samsung" (uppercase)
      const res1 = await request(app).get("/api/v1/product/search/Samsung");

      expect(res1.status).toBe(200);
      expect(res1.body).toHaveLength(2);

      // Search for "samsung" (lowercase)
      const res2 = await request(app).get("/api/v1/product/search/samsung");

      expect(res2.status).toBe(200);
      expect(res2.body).toHaveLength(2);
    });

    it("should search products by description keyword", async () => {
      await productModel.create([
        {
          name: "Product A",
          slug: "product-a",
          description: "Amazing wireless headphones with noise cancellation",
          price: 199,
          category: testCategory1._id,
          quantity: 25,
          shipping: true,
        },
        {
          name: "Product B",
          slug: "product-b",
          description: "Basic wired earbuds for everyday use",
          price: 49,
          category: testCategory1._id,
          quantity: 50,
          shipping: true,
        },
      ]);

      // Search for "wireless"
      const res = await request(app).get("/api/v1/product/search/wireless");

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Product A");
      expect(res.body[0].description).toContain("wireless");
    });

    it("should return empty array for no matching search", async () => {
      await productModel.create({
        name: "Laptop",
        slug: "laptop",
        description: "High performance gaming laptop",
        price: 1499,
        category: testCategory1._id,
        quantity: 12,
        shipping: true,
      });

      const res = await request(app).get("/api/v1/product/search/nonexistent");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("Test 4: Public gets product by category", () => {
    it("should return category with its products", async () => {
      // Create products in Electronics category
      await productModel.create([
        {
          name: "MacBook Pro",
          slug: "macbook-pro",
          description: "Professional laptop",
          price: 2499,
          category: testCategory1._id,
          quantity: 8,
          shipping: true,
        },
        {
          name: "AirPods Pro",
          slug: "airpods-pro",
          description: "Wireless earbuds",
          price: 249,
          category: testCategory1._id,
          quantity: 40,
          shipping: true,
        },
      ]);

      // Create product in Clothing category (should not appear)
      await productModel.create({
        name: "Jeans",
        slug: "jeans",
        description: "Blue denim jeans",
        price: 79,
        category: testCategory2._id,
        quantity: 60,
        shipping: true,
      });

      const res = await request(app).get(
        `/api/v1/product/product-category/${testCategory1.slug}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe("Electronics");
      expect(res.body.category.slug).toBe("electronics");
      expect(res.body.products).toHaveLength(2);

      // Verify all products belong to correct category
      res.body.products.forEach((product) => {
        expect(product.category._id.toString()).toBe(testCategory1._id.toString());
      });

      // Verify Clothing product is not included
      const productNames = res.body.products.map((p) => p.name);
      expect(productNames).not.toContain("Jeans");
    });

    it("should return empty products array for category with no products", async () => {
      const res = await request(app).get(
        `/api/v1/product/product-category/${testCategory1.slug}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBeDefined();
      expect(res.body.products).toEqual([]);
    });

    it("should return 404 for non-existent category", async () => {
      const res = await request(app).get(
        "/api/v1/product/product-category/nonexistent-category"
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Test 5: Authenticated user makes payment", () => {
    it("should create order after payment for authenticated user", async () => {
      // Create products
      const product1 = await productModel.create({
        name: "Wireless Mouse",
        slug: "wireless-mouse",
        description: "Ergonomic wireless mouse",
        price: 49.99,
        category: testCategory1._id,
        quantity: 100,
        shipping: true,
      });

      const product2 = await productModel.create({
        name: "Keyboard",
        slug: "keyboard",
        description: "Mechanical keyboard",
        price: 129.99,
        category: testCategory1._id,
        quantity: 50,
        shipping: true,
      });

      // Mock payment data
      const paymentData = {
        nonce: "fake-valid-nonce", // Braintree test nonce
        cart: [
          {
            _id: product1._id.toString(),
            quantity: 1,
            price: product1.price,
          },
          {
            _id: product2._id.toString(),
            quantity: 1,
            price: product2.price,
          },
        ],
      };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, { success: true, transaction: { id: "txn123", amount: paymentData.cart.reduce((acc, item) => acc + item.price * item.quantity, 0) } });
      });

      // Make payment request (authenticated)
      const res = await request(app)
        .post("/api/v1/product/braintree/payment")
        .set("Authorization", userToken) // User auth
        .send(paymentData);

      // Assertions matching your actual controller response
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.order).toBeDefined();

      // Verify order was created in database
      const order = await orderModel.findById(res.body.order._id);
      expect(order).toBeDefined();
      expect(order.buyer.toString()).toBe(testUser._id.toString());
      expect(order.products).toHaveLength(2);
      expect(order.payment.success).toBe(true);
    });

    it("should reject payment without authentication (401)", async () => {
      const paymentData = {
        nonce: "fake-valid-nonce",
        cart: [],
      };

      // No auth header
      const res = await request(app)
        .post("/api/v1/product/braintree/payment")
        .send(paymentData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual(expect.any(String));
    });

    it("should reduce product quantity after successful payment", async () => {
      // Create product with limited quantity
      const product = await productModel.create({
        name: "Limited Edition Item",
        slug: "limited-edition-item",
        description: "Only 5 available",
        price: 499,
        category: testCategory1._id,
        quantity: 5,
        shipping: true,
      });

      const paymentData = {
        nonce: "fake-valid-nonce",
        cart: [
          {
            _id: product._id.toString(),
						quantity: 3,
            price: product.price,
          },
        ],
      };

      const res = await request(app)
        .post("/api/v1/product/braintree/payment")
        .set("Authorization", userToken)
        .send(paymentData);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      // Verify product quantity was reduced
      const updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantity).toBe(2);
    });
  });
});