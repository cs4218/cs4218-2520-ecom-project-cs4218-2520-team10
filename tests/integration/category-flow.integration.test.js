// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests for Category Flow
 *
 * Test Strategy: Integration-based testing with real database interactions
 *
 * Components Under Test:
 * - controllers/categoryController.js:
 *   - createCategoryController (creates a category with auto-slug via slugify)
 *   - updateCategoryController (updates name and slug, rejects duplicates)
 *   - categoryController (retrieves all categories)
 *   - singleCategoryController (retrieves one category by slug)
 *   - deleteCategoryController (removes a category by id)
 * - models/categoryModel.js (category schema with name and slug)
 * - Database interactions: create, read, update, delete operations
 *
 * Test Doubles Used:
 * - MongoMemoryServer (real MongoDB engine, isolated in-memory instance)
 * - Fake Express req/res objects (mocked with jest.fn())
 *
 * Scenario Plan:
 * #  | Controller                  | Category         | Scenario                                          | Expected Result
 * ---|----------------------------|------------------|---------------------------------------------------|-----------------------------------------------------
 * 1  | createCategoryController   | Happy Path       | Create category → saved to DB with auto-slug      | 201, DB has category with correct name and slug
 * 2  | createCategoryController   | Duplicate        | Create same name twice                            | 200, "Category already exists"
 * 3  | categoryController         | Happy Path       | Create 3 categories → get all                    | 200, returns array containing all 3
 * 4  | singleCategoryController   | Happy Path       | Create category → get by slug                    | 200, returns correct category
 * 5  | updateCategoryController   | Happy Path       | Create → update name                             | 200, DB reflects new name and slug
 * 6  | updateCategoryController   | Duplicate        | Create "A" and "B" → update "B" to "A"           | 422, "Category name already exists"
 * 7  | deleteCategoryController   | Happy Path       | Create → delete → get all                        | 200, deleted category absent from list
 * 8  | deleteCategoryController   | Not Found        | Delete with random ObjectId                       | 404, "Category id not found"
 */

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  createCategoryController,
  updateCategoryController,
  categoryController,
  singleCategoryController,
  deleteCategoryController,
} from "../../controllers/categoryController.js";
import categoryModel from "../../models/categoryModel.js";

describe("BE-INT-3: Category Controller <-> Category Model", () => {
  let mongoServer;

  // Helper to build a fake res object
  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  });

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  // Isolate each test: wipe all categories before each test
  beforeEach(async () => {
    await categoryModel.deleteMany({});
  });

  // ─────────────────────────────────────────────────────────────────────────────
  describe("createCategoryController <-> categoryModel", () => {
    it("Test 1: should save category to DB with auto-generated slug", async () => {
      // ── ARRANGE ──────────────────────────────────
      const req = { body: { name: "Electronics" } };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await createCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.message).toBe("New category created");
      expect(body.category.name).toBe("Electronics");
      // slugify("Electronics") → "Electronics", then schema lowercase → "electronics"
      expect(body.category.slug).toBe("electronics");

      // Verify persisted in DB
      const dbCategory = await categoryModel.findById(body.category._id);
      expect(dbCategory).not.toBeNull();
      expect(dbCategory.name).toBe("Electronics");
      expect(dbCategory.slug).toBe("electronics");
    });

    it("Test 2: should return 'Category already exists' when name is duplicated", async () => {
      // ── ARRANGE ──────────────────────────────────
      await categoryModel.create({ name: "Books", slug: "books" });

      const req = { body: { name: "Books" } };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await createCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.message).toBe("Category already exists");

      // Verify only one copy exists in DB
      const count = await categoryModel.countDocuments({ name: "Books" });
      expect(count).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  describe("categoryController <-> categoryModel", () => {
    it("Test 3: should return all created categories", async () => {
      // ── ARRANGE ──────────────────────────────────
      await categoryModel.create([
        { name: "Clothing", slug: "clothing" },
        { name: "Sports", slug: "sports" },
        { name: "Toys", slug: "toys" },
      ]);

      const req = {};
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await categoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.category).toHaveLength(3);

      const names = body.category.map((c) => c.name);
      expect(names).toContain("Clothing");
      expect(names).toContain("Sports");
      expect(names).toContain("Toys");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  describe("singleCategoryController <-> categoryModel", () => {
    it("Test 4: should return correct category when queried by slug", async () => {
      // ── ARRANGE ──────────────────────────────────
      const created = await categoryModel.create({
        name: "Garden",
        slug: "garden",
      });

      const req = { params: { slug: "garden" } };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await singleCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.category._id.toString()).toBe(created._id.toString());
      expect(body.category.name).toBe("Garden");
      expect(body.category.slug).toBe("garden");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  describe("updateCategoryController <-> categoryModel", () => {
    it("Test 5: should update category name and slug in DB", async () => {
      // ── ARRANGE ──────────────────────────────────
      const original = await categoryModel.create({
        name: "Old Name",
        slug: "old-name",
      });

      const req = {
        params: { id: original._id.toString() },
        body: { name: "New Name" },
      };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await updateCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.message).toBe("Category updated successfully");
      expect(body.category.name).toBe("New Name");
      // slugify("New Name") → "New-Name", schema lowercase → "new-name"
      expect(body.category.slug).toBe("new-name");

      // Verify DB was updated
      const dbCategory = await categoryModel.findById(original._id);
      expect(dbCategory.name).toBe("New Name");
      expect(dbCategory.slug).toBe("new-name");
    });

    it("Test 6: should reject update when new name already belongs to another category", async () => {
      // ── ARRANGE ──────────────────────────────────
      const categoryA = await categoryModel.create({ name: "Category A", slug: "category-a" });
      const categoryB = await categoryModel.create({
        name: "Category B",
        slug: "category-b",
      });

      const req = {
        params: { id: categoryB._id.toString() },
        body: { name: "Category A" }, // Attempt to rename B → A (duplicate)
      };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await updateCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(422);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe("Category name already exists");
      // Verify Category B was NOT updated
      const dbCategoryB = await categoryModel.findById(categoryB._id);
      expect(dbCategoryB.name).toBe("Category B");
      expect(dbCategoryB.slug).toBe("category-b");

      // Verify Category A was also unaffected
      const dbCategoryA = await categoryModel.findById(categoryA._id);
      expect(dbCategoryA.name).toBe("Category A");
      expect(dbCategoryA.slug).toBe("category-a");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  describe("deleteCategoryController <-> categoryModel", () => {
    it("Test 7: should remove category from DB and be absent from get-all results", async () => {
      // ── ARRANGE ──────────────────────────────────
      const toDelete = await categoryModel.create({
        name: "Temporary",
        slug: "temporary",
      });
      await categoryModel.create({ name: "Keeper", slug: "keeper" });

      const deleteReq = { params: { id: toDelete._id.toString() } };
      const deleteRes = makeRes();

      // ── ACT ──────────────────────────────────────
      await deleteCategoryController(deleteReq, deleteRes);

      // ── ASSERT: delete response ───────────────────
      expect(deleteRes.status).toHaveBeenCalledWith(200);
      const deleteBody = deleteRes.send.mock.calls[0][0];
      expect(deleteBody.success).toBe(true);
      expect(deleteBody.message).toBe("Category deleted successfully");

      // Verify removed from DB
      const dbCategory = await categoryModel.findById(toDelete._id);
      expect(dbCategory).toBeNull();

      // Verify absent from get-all results
      const getAllRes = makeRes();
      await categoryController({}, getAllRes);
      const getAllBody = getAllRes.send.mock.calls[0][0];
      const ids = getAllBody.category.map((c) => c._id.toString());
      expect(ids).not.toContain(toDelete._id.toString());
      expect(getAllBody.category).toHaveLength(1);
      expect(getAllBody.category[0].name).toBe("Keeper");
    });

    it("Test 8: should return 404 when deleting a non-existent category", async () => {
      // ── ARRANGE ──────────────────────────────────
      const nonExistentId = new mongoose.Types.ObjectId();

      const req = { params: { id: nonExistentId.toString() } };
      const res = makeRes();

      // ── ACT ──────────────────────────────────────
      await deleteCategoryController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      const body = res.send.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.message).toBe("Category id not found");
    });
  });
});
