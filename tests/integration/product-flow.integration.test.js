/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import mongoose from "mongoose";
import request from "supertest";
import app from "../../server.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import userModel from "../../models/userModel.js";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";

/**
 * Integration Tests: Product Controller ↔ Product Model ↔ Category Model
 *
 * Test Cases:
 * 1.  Create product with valid category reference
 * 2.  Get all products with populated category
 * 3.  Get single product by slug
 * 4.  Delete product removes from DB
 * 5.  Update product changes DB record
 * 6.  Duplicate product name rejected on create
 * 7.  Filter by category
 * 8.  Filter by price range
 * 9.  Search by keyword in name
 * 10. Search by keyword in description
 * 11. Related products (same category, exclude self)
 * 12. Products by category slug
 * 13. Pagination (6 per page)
 * 14. Product count
 */

describe("Product Controller Integration Tests (Real DB)", () => {
  let testCategory1;
  let testCategory2;
  let authToken;
  let mongoServer;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";

    // Close any connection that server.js may have already opened
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

		// Creates new in-memory MongoDB instance and connects mongoose to it
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    await mongoose.connect(mongoUri);

		// Create test admin user and generate JWT token
    await userModel.deleteMany({});
    const adminUser = await userModel.create({
      name: "Test Admin",
      email: "admin@test.com",
      password: "hashedpassword",
      phone: "12345678",
      address: "Test Address",
      answer: "test answer",
      role: 1, // Admin role
    });

    authToken = JWT.sign(
      { _id: adminUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Connected to in-memory test database:", mongoUri);
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});

    testCategory1 = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    testCategory2 = await categoryModel.create({
      name: "Clothing",
      slug: "clothing",
    });
  });

  afterAll(async () => {
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await userModel.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Disconnected from in-memory test database");
  });

  describe("Test 1: Create product with valid category reference", () => {
    it("should create product with correct category ObjectId and generated slug", async () => {
      const productData = {
        name: "Samsung Galaxy S21",
        description: "Latest flagship smartphone",
        price: 999,
        category: testCategory1._id.toString(),
        quantity: 50,
        shipping: true,
      };

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", authToken)
        .field("name", productData.name)
        .field("description", productData.description)
        .field("price", productData.price)
        .field("category", productData.category)
        .field("quantity", productData.quantity)
        .field("shipping", productData.shipping);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toEqual(expect.any(String));
      expect(res.body.products).toBeDefined();
      expect(res.body.products.name).toBe(productData.name);
      expect(res.body.products.slug).toBe("Samsung-Galaxy-S21");
      expect(res.body.products.category.toString()).toBe(testCategory1._id.toString());

      // Verify in database
      const dbProduct = await productModel.findById(res.body.products._id).populate("category");
      expect(dbProduct).toBeDefined();
      expect(dbProduct.category._id.toString()).toBe(testCategory1._id.toString());
      expect(dbProduct.category.name).toBe("Electronics");
    });
  });

  describe("Test 2: Get all products with populated category", () => {
    it("should return all products with category names populated", async () => {
      await productModel.create({
        name: "iPhone 13",
        slug: "iphone-13",
        description: "Apple smartphone",
        price: 899,
        category: testCategory1._id,
        quantity: 30,
        shipping: true,
      });

      await productModel.create({
        name: "T-Shirt",
        slug: "t-shirt",
        description: "Cotton t-shirt",
        price: 25,
        category: testCategory2._id,
        quantity: 100,
        shipping: true,
      });

      const res = await request(app).get("/api/v1/product/get-product");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.countTotal).toBe(2);
      expect(res.body.products).toHaveLength(2);

      // Verify category population
      expect(res.body.products[0].category).toBeDefined();
      expect(res.body.products[0].category.name).toBeDefined();
      expect(res.body.products[1].category).toBeDefined();
      expect(res.body.products[1].category.name).toBeDefined();

      // Verify no photo data included
      expect(res.body.products[0].photo).toBeUndefined();
    });
  });

  describe("Test 3: Get single product by slug", () => {
    it("should return correct product with populated category", async () => {
      const product = await productModel.create({
        name: "MacBook Pro",
        slug: "macbook-pro",
        description: "Professional laptop",
        price: 2499,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      const res = await request(app).get(`/api/v1/product/get-product/${product.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Single Product Fetched");
      expect(res.body.product.name).toBe("MacBook Pro");
      expect(res.body.product.slug).toBe("macbook-pro");
      expect(res.body.product.category.name).toBe("Electronics");
      expect(res.body.product.photo).toBeUndefined();
    });

    it("should return 404 for non-existent product", async () => {
      const res = await request(app).get("/api/v1/product/get-product/non-existent-slug");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });
  });

  describe("Test 4: Delete product removes from DB", () => {
    it("should delete product and return 404 on subsequent get", async () => {
      const product = await productModel.create({
        name: "iPad Pro",
        slug: "ipad-pro",
        description: "Tablet device",
        price: 799,
        category: testCategory1._id,
        quantity: 20,
        shipping: true,
      });

      const deleteRes = await request(app)
        .delete(`/api/v1/product/delete-product/${product._id}`)
        .set("Authorization", authToken);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.message).toBe("Product deleted successfully");

      // Verify deletion in DB
      const dbProduct = await productModel.findById(product._id);
      expect(dbProduct).toBeNull();

      // Try to get deleted product
      const getRes = await request(app).get(`/api/v1/product/get-product/${product.slug}`);
      expect(getRes.status).toBe(404);
      expect(getRes.body.success).toBe(false);
    });

    it("should return 404 when deleting non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/v1/product/delete-product/${fakeId}`)
        .set("Authorization", authToken);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product not found");
    });
  });

  describe("Test 5: Update product changes DB record", () => {
    it("should update product name and price in DB", async () => {
      const product = await productModel.create({
        name: "Old Name",
        slug: "old-name",
        description: "Original description",
        price: 100,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      const updateData = {
        name: "New Name",
        description: "Updated description",
        price: 150,
        category: testCategory1._id.toString(),
        quantity: 15,
        shipping: true,
      };

      const updateRes = await request(app)
        .put(`/api/v1/product/update-product/${product._id}`)
        .set("Authorization", authToken)
        .field("name", updateData.name)
        .field("description", updateData.description)
        .field("price", updateData.price)
        .field("category", updateData.category)
        .field("quantity", updateData.quantity)
        .field("shipping", updateData.shipping);

      expect(updateRes.status).toBe(201);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.message).toBe("Product updated successfully");
      expect(updateRes.body.products.name).toBe("New Name");
      expect(updateRes.body.products.price).toBe(150);
      expect(updateRes.body.products.slug).toBe("New-Name");

      // Verify in database
      const dbProduct = await productModel.findById(product._id);
      expect(dbProduct.name).toBe("New Name");
      expect(dbProduct.price).toBe(150);
      expect(dbProduct.slug).toBe("New-Name");
      expect(dbProduct.quantity).toBe(15);

      // Get updated product by new slug
      const getRes = await request(app).get("/api/v1/product/get-product/New-Name");
      expect(getRes.status).toBe(200);
      expect(getRes.body.product.name).toBe("New Name");
      expect(getRes.body.product.price).toBe(150);
    });

		it("should return 404 when updating non-existent product", async () => {
			const fakeId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.put(`/api/v1/product/update-product/${fakeId}`)
				.set("Authorization", authToken)
				.field("name", "Doesn't Matter")
				.field("description", "N/A")
				.field("price", 0)
				.field("category", testCategory1._id.toString())
				.field("quantity", 0)
				.field("shipping", false);

			expect(res.status).toBe(404);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toBe("Product not found");
		});
	});

  describe("Test 6: Duplicate product name rejected on create", () => {
    it("should return 409 when creating product with existing name", async () => {
      await productModel.create({
        name: "Widget",
        slug: "Widget",
        description: "First widget",
        price: 50,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      const res = await request(app)
        .post("/api/v1/product/create-product")
        .set("Authorization", authToken)
        .field("name", "Widget")
        .field("description", "Second widget")
        .field("price", 60)
        .field("category", testCategory1._id.toString())
        .field("quantity", 20)
        .field("shipping", true);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Product with this name already exists");

      // Verify only one product in DB
      const count = await productModel.countDocuments({ slug: "Widget" });
      expect(count).toBe(1);
    });
  });

  describe("Test 7: Filter by category", () => {
    it("should return only products from category A", async () => {
      await productModel.create({
        name: "Laptop",
        slug: "laptop",
        description: "Gaming laptop",
        price: 1500,
        category: testCategory1._id,
        quantity: 5,
        shipping: true,
      });

      await productModel.create({
        name: "Mouse",
        slug: "mouse",
        description: "Wireless mouse",
        price: 30,
        category: testCategory1._id,
        quantity: 50,
        shipping: true,
      });

      await productModel.create({
        name: "Jacket",
        slug: "jacket",
        description: "Winter jacket",
        price: 80,
        category: testCategory2._id,
        quantity: 25,
        shipping: true,
      });

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({
          checked: [testCategory1._id.toString()],
          radio: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(2);
      expect(
        res.body.products.every(
          (p) => p.category.toString() === testCategory1._id.toString()
        )
      ).toBe(true);
    });
  });

  describe("Test 8: Filter by price range", () => {
    it("should return only products in price range [20, 60]", async () => {
      await productModel.create({
        name: "Cheap Item",
        slug: "cheap-item",
        description: "Low price",
        price: 10,
        category: testCategory1._id,
        quantity: 100,
        shipping: true,
      });

      await productModel.create({
        name: "Mid Item",
        slug: "mid-item",
        description: "Medium price",
        price: 50,
        category: testCategory1._id,
        quantity: 50,
        shipping: true,
      });

      await productModel.create({
        name: "Expensive Item",
        slug: "expensive-item",
        description: "High price",
        price: 100,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({ checked: [], radio: [20, 60] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe("Mid Item");
      expect(res.body.products[0].price).toBe(50);
    });

    it("should filter by both category and price range", async () => {
      await productModel.create({
        name: "Budget Phone",
        slug: "budget-phone",
        description: "Affordable phone",
        price: 300,
        category: testCategory1._id,
        quantity: 20,
        shipping: true,
      });

      await productModel.create({
        name: "Premium Phone",
        slug: "premium-phone",
        description: "Flagship phone",
        price: 1000,
        category: testCategory1._id,
        quantity: 5,
        shipping: true,
      });

      await productModel.create({
        name: "Designer Shirt",
        slug: "designer-shirt",
        description: "Luxury shirt",
        price: 400,
        category: testCategory2._id,
        quantity: 15,
        shipping: true,
      });

      const res = await request(app)
        .post("/api/v1/product/product-filters")
        .send({
          checked: [testCategory1._id.toString()],
          radio: [200, 500],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products[0].name).toBe("Budget Phone");
    });
  });

  describe("Test 9: Search by keyword in name", () => {
    it("should return product when searching by name keyword (case-insensitive)", async () => {
      await productModel.create({
        name: "Blue Widget",
        slug: "blue-widget",
        description: "A blue colored widget",
        price: 45,
        category: testCategory1._id,
        quantity: 30,
        shipping: true,
      });

      await productModel.create({
        name: "Red Gadget",
        slug: "red-gadget",
        description: "A red gadget",
        price: 55,
        category: testCategory1._id,
        quantity: 20,
        shipping: true,
      });

      // Lowercase keyword
      const res = await request(app).get("/api/v1/product/search/blue");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Blue Widget");

      // Uppercase keyword — regex is case-insensitive
      const res2 = await request(app).get("/api/v1/product/search/BLUE");
      expect(res2.status).toBe(200);
      expect(res2.body).toHaveLength(1);
      expect(res2.body[0].name).toBe("Blue Widget");
    });
  });

  describe("Test 10: Search by keyword in description", () => {
    it("should return product when searching by description keyword", async () => {
      await productModel.create({
        name: "Product A",
        slug: "product-a",
        description: "This is an amazing gadget with great features",
        price: 75,
        category: testCategory1._id,
        quantity: 15,
        shipping: true,
      });

      await productModel.create({
        name: "Product B",
        slug: "product-b",
        description: "Simple device for everyday use",
        price: 40,
        category: testCategory1._id,
        quantity: 25,
        shipping: true,
      });

      // "gadget" only in Product A's description
      const res = await request(app).get("/api/v1/product/search/gadget");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Product A");
      expect(res.body[0].description).toContain("gadget");

      // Add a product with "gadget" in its name too
      await productModel.create({
        name: "Gadget Pro",
        slug: "gadget-pro",
        description: "Professional tool",
        price: 120,
        category: testCategory1._id,
        quantity: 8,
        shipping: true,
      });

      const res2 = await request(app).get("/api/v1/product/search/gadget");
      expect(res2.status).toBe(200);
      expect(res2.body).toHaveLength(2); // Product A (desc) + Gadget Pro (name)
    });
  });

  describe("Test 11: Related products (same category, exclude self)", () => {
    it("should return up to 3 other products in same category", async () => {
      const product1 = await productModel.create({
        name: "Product 1",
        slug: "product-1",
        description: "First product",
        price: 100,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      await productModel.create([
        { name: "Product 2", slug: "product-2", description: "d", price: 200, category: testCategory1._id, quantity: 10, shipping: true },
        { name: "Product 3", slug: "product-3", description: "d", price: 300, category: testCategory1._id, quantity: 10, shipping: true },
        { name: "Product 4", slug: "product-4", description: "d", price: 400, category: testCategory1._id, quantity: 10, shipping: true },
        // Different category — must NOT appear in results
        { name: "Other Category Product", slug: "other-cat", description: "d", price: 500, category: testCategory2._id, quantity: 10, shipping: true },
      ]);

      const res = await request(app).get(
        `/api/v1/product/related-product/${product1._id}/${testCategory1._id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(3); // Hard cap is 3

      const returnedIds = res.body.products.map((p) => p._id.toString());
      expect(returnedIds).not.toContain(product1._id.toString());
      expect(
        res.body.products.every(
          (p) => p.category._id.toString() === testCategory1._id.toString()
        )
      ).toBe(true);
    });

    it("should return empty array when no related products exist", async () => {
      const product = await productModel.create({
        name: "Only Product",
        slug: "only-product",
        description: "The only product in this category",
        price: 100,
        category: testCategory1._id,
        quantity: 10,
        shipping: true,
      });

      const res = await request(app).get(
        `/api/v1/product/related-product/${product._id}/${testCategory1._id}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(0);
    });
  });

  describe("Test 12: Products by category slug", () => {
    it("should return category object and its products", async () => {
      await productModel.create([
        { name: "Laptop",  slug: "laptop",  description: "Professional laptop", price: 1200, category: testCategory1._id, quantity: 15, shipping: true },
        { name: "Monitor", slug: "monitor", description: "4K monitor",           price: 400,  category: testCategory1._id, quantity: 25, shipping: true },
        // Clothing product — must NOT appear in Electronics results
        { name: "Pants",   slug: "pants",   description: "Casual pants",         price: 50,   category: testCategory2._id, quantity: 40, shipping: true },
      ]);

      const res = await request(app).get(
        `/api/v1/product/product-category/${testCategory1.slug}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.category).toBeDefined();
      expect(res.body.category.name).toBe("Electronics");
      expect(res.body.products).toHaveLength(2);
      expect(
        res.body.products.every(
          (p) => p.category._id.toString() === testCategory1._id.toString()
        )
      ).toBe(true);
    });
  });

  describe("Test 13: Pagination (6 per page)", () => {
    it("should return 6 products on page 1 and 2 products on page 2", async () => {
      // Create 8 products sequentially for stable createdAt ordering
      for (let i = 1; i <= 8; i++) {
        await productModel.create({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: i * 100,
          category: testCategory1._id,
          quantity: 10,
          shipping: true,
        });
      }

      const res1 = await request(app).get("/api/v1/product/product-list/1");
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.products).toHaveLength(6);
      expect(res1.body.products[0].photo).toBeUndefined();

      const res2 = await request(app).get("/api/v1/product/product-list/2");
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.products).toHaveLength(2);
      expect(res2.body.products[0].photo).toBeUndefined();
    });

    it("should return empty array for page beyond available products", async () => {
      for (let i = 1; i <= 5; i++) {
        await productModel.create({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: i * 50,
          category: testCategory1._id,
          quantity: 10,
          shipping: true,
        });
      }

      const res = await request(app).get("/api/v1/product/product-list/2");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toHaveLength(0);
    });
  });

  describe("Test 14: Product count", () => {
    it("should return correct total count of products", async () => {
      // Initially 0 (beforeEach wiped the collection)
      const res1 = await request(app).get("/api/v1/product/product-count");
      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.total).toBe(0);

      // Create 5 products
      for (let i = 1; i <= 5; i++) {
        await productModel.create({
          name: `Product ${i}`,
          slug: `product-${i}`,
          description: `Description ${i}`,
          price: i * 100,
          category: testCategory1._id,
          quantity: 10,
          shipping: true,
        });
      }

      const res2 = await request(app).get("/api/v1/product/product-count");
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.total).toBe(5);

      // Delete 2 products and re-check
      const toDelete = await productModel.find({}).limit(2);
      await productModel.deleteMany({ _id: { $in: toDelete.map((p) => p._id) } });

      const res3 = await request(app).get("/api/v1/product/product-count");
      expect(res3.status).toBe(200);
      expect(res3.body.success).toBe(true);
      expect(res3.body.total).toBe(3);
    });
  });
});