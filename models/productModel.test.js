/*
    All test cases written by Ong Chang Heng Bertrand - A0253013X
*/

import mongoose from "mongoose";
import Product from "../models/productModel.js";

/*
	Test cases for Product model validation
	1. Happy Path: 2 tests
		a. Should validate successfully when all required fields are provided with valid data
		b. Should validate successfully when optional fields are included with valid data
	2. Input Validation: 3 tests
		a. Should fail validation when required fields are missing
		b. Should fail validation when price is not a number
		c. Should fail validation when quantity is not a number
*/

describe("Product Model", () => {
  describe("Happy Path", () => {
    it("should validate successfully with all required fields", async () => {
      const product = new Product({
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 100,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
				shipping: true,
      });

      expect(product.validate()).resolves.toBeUndefined();
    });

    it("should validate successfully with optional fields included", async () => {
      const product = new Product({
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 100,
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
        shipping: true,
        photo: {
          data: Buffer.from("image-data"),
          contentType: "image/png",
        },
      });

      expect(product.validate()).resolves.toBeUndefined();
    });

  });

  describe("Input Validation", () => {
    it("should fail when required fields are missing", async () => {
      const product = new Product({});

      expect(product.validate()).rejects.toThrow();
    });

    it("should fail when price is not a number", async () => {
      const product = new Product({
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: "invalid",
        category: new mongoose.Types.ObjectId(),
        quantity: 10,
      });

      expect(product.validate()).rejects.toThrow();
    });

    it("should fail when quantity is not a number", async () => {
      const product = new Product({
        name: "Test Product",
        slug: "test-product",
        description: "Test description",
        price: 100,
        category: new mongoose.Types.ObjectId(),
        quantity: "invalid",
      });

      expect(product.validate()).rejects.toThrow();
    });
  });
});
