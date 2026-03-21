// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests for Category Pipeline
 *
 * Test Strategy: Full HTTP pipeline testing via supertest with real database interactions
 *
 * Components Under Test:
 * - routes/categoryRoutes.js (route definitions)
 * - middlewares/authMiddleware.js (requireSignIn, isAdmin)
 * - controllers/categoryController.js (all CRUD controllers)
 * - models/categoryModel.js (category schema)
 *
 * Test Doubles Used:
 * - MongoMemoryServer (real MongoDB engine, isolated in-memory instance)
 * - JWT tokens generated directly (no login endpoint required)
 * - Real HTTP requests via supertest (full route → middleware → controller pipeline)
 *
 * Scenario Plan:
 * #  | HTTP Method | Endpoint                              | Auth         | Scenario                                          | Expected Result
 * ---|-------------|---------------------------------------|--------------|---------------------------------------------------|---------------------
 * 1  | POST        | /api/v1/category/create-category      | Admin        | Admin creates a new category                      | 201, category in response
 * 2  | POST        | /api/v1/category/create-category      | Regular user | Non-admin attempts to create category             | 401 Unauthorized
 * 3  | POST        | /api/v1/category/create-category      | None         | Unauthenticated create attempt                    | 401 Unauthorized
 * 4  | GET         | /api/v1/category/get-category         | None         | Public gets all categories                        | 200, categories array
 * 5  | GET         | /api/v1/category/get-category         | None         | Public gets all categories (empty DB)             | 200, empty array
 * 6  | GET         | /api/v1/category/single-category/:slug| None         | Public gets single category by slug               | 200, category object
 * 7  | GET         | /api/v1/category/single-category/:slug| None         | Public gets single category with non-existent slug| 404, "Slug not found"
 * 8  | PUT         | /api/v1/category/update-category/:id  | Admin        | Admin updates category name                       | 200, updated category
 * 9  | PUT         | /api/v1/category/update-category/:id  | Regular user | Non-admin attempts to update category             | 401 Unauthorized
 * 10 | DELETE      | /api/v1/category/delete-category/:id  | Admin        | Admin deletes category                            | 200, success message
 * 11 | DELETE      | /api/v1/category/delete-category/:id  | Regular user | Non-admin attempts to delete category             | 401 Unauthorized
 */

import mongoose from "mongoose";
import request from "supertest";
import app from "../../app.js";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel.js";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("BE-INT-6: Category Route <-> Middleware <-> Controller (Full Pipeline)", () => {
  let mongoServer;
  let adminToken;
  let userToken;
  let testAdmin;
  let testUser;

  jest.setTimeout(30000);

  beforeAll(async () => {
    process.env.NODE_ENV = "test";

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Create test admin user
    testAdmin = await userModel.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: "hashedpassword",
      phone: "1234567890",
      address: "Admin Address",
      answer: "admin answer",
      role: 1,
    });

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
      role: 0,
    });

    userToken = JWT.sign(
      { _id: testUser._id },
      process.env.JWT_SECRET || "test-secret-key",
      { expiresIn: "7d" }
    );
  });

  beforeEach(async () => {
    await categoryModel.deleteMany({});
  });

  afterAll(async () => {
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe("Test 1: Admin creates category via API", () => {
    it("should create category and return 201 with category in response", async () => {
      // ── ARRANGE ──────────────────────────────────
      const categoryData = { name: "Electronics" };

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", adminToken)
        .send(categoryData);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe("Electronics");
      // slugify("Electronics") → "Electronics", schema lowercase → "electronics"
      expect(res.body.category.slug).toBe("electronics");

      // Verify persisted in DB
      const dbCategory = await categoryModel.findById(res.body.category._id);
      expect(dbCategory).not.toBeNull();
      expect(dbCategory.name).toBe("Electronics");
    });
  });

  describe("Test 2: Non-admin cannot create category", () => {
    it("should return 401 when a regular user attempts to create a category", async () => {
      // ── ARRANGE ──────────────────────────────────
      const categoryData = { name: "Clothing" };

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .set("Authorization", userToken)
        .send(categoryData);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify nothing was saved to DB
      const count = await categoryModel.countDocuments({ name: "Clothing" });
      expect(count).toBe(0);
    });

    it("should return 401 when unauthenticated request attempts to create a category", async () => {
      // ── ARRANGE ──────────────────────────────────
      const categoryData = { name: "Clothing" };

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .post("/api/v1/category/create-category")
        .send(categoryData);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify nothing was saved to DB
      const count = await categoryModel.countDocuments({ name: "Clothing" });
      expect(count).toBe(0);
    });
  });

  describe("Test 3: Public can get all categories", () => {
    it("should return all categories without auth token", async () => {
      // ── ARRANGE ──────────────────────────────────
      await categoryModel.create([
        { name: "Electronics", slug: "electronics" },
        { name: "Clothing", slug: "clothing" },
        { name: "Sports", slug: "sports" },
      ]);

      // ── ACT ──────────────────────────────────────
      const res = await request(app).get("/api/v1/category/get-category");

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toHaveLength(3);

      const names = res.body.category.map((c) => c.name);
      expect(names).toContain("Electronics");
      expect(names).toContain("Clothing");
      expect(names).toContain("Sports");
    });

    it("should return empty array when no categories exist", async () => {
      // ── ARRANGE ──────────────────────────────────
      // beforeEach already wiped the collection

      // ── ACT ──────────────────────────────────────
      const res = await request(app).get("/api/v1/category/get-category");

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toEqual([]);
    });
  });

  describe("Test 4: Public can get single category by slug", () => {
    it("should return correct category without auth token", async () => {
      // ── ARRANGE ──────────────────────────────────
      const created = await categoryModel.create({
        name: "Garden",
        slug: "garden",
      });

      // ── ACT ──────────────────────────────────────
      const res = await request(app).get(
        "/api/v1/category/single-category/garden"
      );

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBeDefined();
      expect(res.body.category._id.toString()).toBe(created._id.toString());
      expect(res.body.category.name).toBe("Garden");
      expect(res.body.category.slug).toBe("garden");
    });

    it("should return 404 for non-existent slug", async () => {
      // ── ARRANGE ──────────────────────────────────
      // beforeEach already wiped the collection

      // ── ACT ──────────────────────────────────────
      const res = await request(app).get(
        "/api/v1/category/single-category/non-existent-slug"
      );

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Slug not found");
    });
  });

  describe("Test 5: Admin updates category", () => {
    it("should update category name and return 200 with updated category", async () => {
      // ── ARRANGE ──────────────────────────────────
      const category = await categoryModel.create({
        name: "Old Name",
        slug: "old-name",
      });

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set("Authorization", adminToken)
        .send({ name: "New Name" });

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category.name).toBe("New Name");
      expect(res.body.category.slug).toBe("new-name");

      // Verify DB was updated
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory.name).toBe("New Name");
      expect(dbCategory.slug).toBe("new-name");
    });

    it("should return 401 when non-admin attempts to update", async () => {
      // ── ARRANGE ──────────────────────────────────
      const category = await categoryModel.create({
        name: "Protected",
        slug: "protected",
      });

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .put(`/api/v1/category/update-category/${category._id}`)
        .set("Authorization", userToken)
        .send({ name: "Hacked Name" });

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify DB was NOT updated
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory.name).toBe("Protected");
    });
  });

  describe("Test 6: Admin deletes category", () => {
    it("should delete category and return 200 with success message", async () => {
      // ── ARRANGE ──────────────────────────────────
      const category = await categoryModel.create({
        name: "To Be Deleted",
        slug: "to-be-deleted",
      });

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set("Authorization", adminToken);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Category deleted successfully");

      // Verify removed from DB
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory).toBeNull();
    });

    it("should return 401 when non-admin attempts to delete", async () => {
      // ── ARRANGE ──────────────────────────────────
      const category = await categoryModel.create({
        name: "Protected",
        slug: "protected",
      });

      // ── ACT ──────────────────────────────────────
      const res = await request(app)
        .delete(`/api/v1/category/delete-category/${category._id}`)
        .set("Authorization", userToken);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      // Verify NOT deleted from DB
      const dbCategory = await categoryModel.findById(category._id);
      expect(dbCategory).not.toBeNull();
    });
  });
});
