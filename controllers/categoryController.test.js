/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import { categoryController, createCategoryController, singleCategoryController, updateCategoryController } from './categoryController';
import mongoose from "mongoose";

jest.mock('../models/categoryModel');
jest.mock('slugify');

/**
  * Unit tests for createCategoryController
  *
  * 1. Happy path: 3 tests
  *   a. status 201 for valid new category
  *   b. status 200 for existing category
  *   c. returned category structure for valid new category
  * 2. Input validation: 3 tests
  *   a. status 422 for missing name (name === null)
  *   b. status 422 for empty string name
  *   c. status 422 for only whitespace string name
  * 3. Error handling: 2 tests
  *   a. status 500 if findOne exception
  *   b. status 500 if save exception
  * 4. Side effects: 1 tests
  *   a. Log error when error occurs
  */
describe("createCategoryController", () => {
  let res, req, consoleLogSpy;
  const mockSlug = 'mock-slug';
  const validCategoryName = 'Shoes';

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      body: {
        name: null
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    slugify.mockReturnValue(mockSlug);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should succeed with 201 if valid new category", async () => {
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue(null);

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it("should return 200 if category already exist", async () => {
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue({ name: validCategoryName });

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it("should return newly created category for valid new category", async () => {
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue(null);
      const categoryObj = {
        name: validCategoryName,
        slug: mockSlug
      };
      const mockSave = jest.fn().mockResolvedValue(categoryObj);
      categoryModel.mockImplementation(() => {
        return {
          save: mockSave
        }
      });

      await createCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: categoryObj
        })
      );
    });
  });

  describe("Input Validation", () => {
    it("should return 422 if missing name", async () => {
      req.body.name = null;

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if name is empty string", async () => {
      req.body.name = "";

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if name is only whitespace string", async () => {
      req.body.name = " ";

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Error Handling", () => {
    it('should return 500 if findOne exception occurs', async () => {
      req.body.name = validCategoryName;
      const error = new Error('Database error');
      categoryModel.findOne.mockRejectedValue(error);

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });

    it('should return 500 if save exception occurs', async () => {
      req.body.name = validCategoryName;
      const error = new Error('Database error');
      categoryModel.mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(error)
        }
      });

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Side effects", () => {
    it("should log error when an exception occurs", async () => {
      req.body.name = validCategoryName;
      const error = new Error("Database error");
      categoryModel.findOne.mockRejectedValue(error);

      await createCategoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
});

/**
  * Unit tests for updateCategoryController
  *
  * 1. Happy path: 2 tests
  *   a. status 200 for valid new category name
  *   b. returned updated category for valid new category name
  * 2. Input validation: 7 tests
  *   a. status 422 for missing name (name === null)
  *   b. status 422 for empty string name
  *   c. status 422 for only whitespace string name
  *   d. status 422 for duplicate name
  *   e. status 422 for null category id
  *   f. status 422 for invalid category id
  *   g. status 404 for category id not found
  * 3. Error handling: 2 tests
  *   a. status 500 if findOne exception
  *   b. status 500 if findByIdAndUpdate exception
  * 4. Side effects: 1 tests
  *   a. Log error when error occurs
  */
describe("updateCategoryController", () => {
  let res, req, consoleLogSpy;
  const mockSlug = 'mock-slug';
  const validCategoryName = 'Shoes';
  const validCategoryId = 'valid-id';
  const categoryObj = {
    _id: validCategoryId,
    name: validCategoryName,
    slug: mockSlug
  };

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      params: {
        id: null
      },
      body: {
        name: null
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    slugify.mockReturnValue(mockSlug);
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if valid new name given", async () => {
      req.body.id = validCategoryId;
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.findByIdAndUpdate.mockResolvedValue(categoryObj);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it("should return updated category if valid new name given", async () => {
      req.params.id = validCategoryId;
      req.body.name = validCategoryName;
      categoryModel.findByIdAndUpdate.mockResolvedValue(categoryObj);

      await updateCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: categoryObj
        })
      );
    });
  });

  describe("Input Validation", () => {
    it("should return 422 if missing name", async () => {
      req.body.name = null;

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if name is empty string", async () => {
      req.body.name = "";

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if name is whitespace only", async () => {
      req.body.name = " ";

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 for duplicate name", async () => {
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue({ name: validCategoryName });

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 for null category id", async () => {
      req.params.id = null;
      req.body.name = validCategoryName;
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 for invalid category id", async () => {
      req.params.id = 'invalid-id';
      req.body.name = validCategoryName;
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 404 for category id not found", async () => {
      req.params.id = "non-existent-id";
      req.body.name = validCategoryName;
      categoryModel.findByIdAndUpdate.mockResolvedValue(null);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 if findOne exception occurs", async () => {
      req.body.name = validCategoryName;
      req.params.id = validCategoryId;
      const error = new Error("findOne error");
      categoryModel.findOne.mockRejectedValue(error);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });

    it("should return 500 if findIdAndUpdate exception occurs", async () => {
      req.body.name = validCategoryName;
      req.params.id = validCategoryId;
      const error = new Error("findIdAndUpdate error");
      categoryModel.findByIdAndUpdate.mockRejectedValue(error);

      await updateCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Side effects", () => {
    it("should log error when an exception occurs", async () => {
      req.params.id = validCategoryId;
      req.body.name = validCategoryName;
      const error = new Error("Database error");
      categoryModel.findByIdAndUpdate.mockRejectedValue(error);

      await updateCategoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
});

/**
  * Unit tests for categoryController
  *
  * 1. Happy path: 3 tests
  *   a. status 200 if no exception
  *   b. return category structure if no exception
  *   c. return empty category list if find returns empty
  * 2. Error handling: 1 tests
  *   a. status 500 if find exception
  * 3. Side effects: 1 tests
  *   a. Log error when error occurs
  */
describe("categoryController", () => {
  let res, req, consoleLogSpy;
  beforeEach(() => {
    jest.resetAllMocks();
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if no find exception", async () => {
      await categoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it("should return category list if no find exception", async () => {
      const mockCategories = [
        { _id: "1", name: "Shoes", slug: "shoes" },
        { _id: "2", name: "Hats", slug: "hats" }
      ];
      categoryModel.find.mockResolvedValue(mockCategories);

      await categoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: expect.arrayContaining([
            expect.objectContaining({ _id: expect.any(String), name: expect.any(String), slug: expect.any(String) })
          ])
        })
      );
    });

    it("should return empty list if find returns empty", async () => {
      categoryModel.find.mockResolvedValue([]);

      await categoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: []
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 if find exception occurs", async () => {
      const error = new Error("find error");
      categoryModel.find.mockRejectedValue(error);

      await categoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Side effects", () => {
    it("should log error when an exception occurs", async () => {
      const error = new Error("Database error");
      categoryModel.find.mockRejectedValue(error);

      await categoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
});


/**
  * Unit tests for singleCategoryController
  *
  * 1. Happy path: 2 tests
  *   a. status 200 for valid slug
  *   b. return category for valid slug
  * 2. Input validation: 4 tests
  *   a. status 422 for missing slug (slug === null)
  *   b. status 422 for empty string slug
  *   c. status 422 for only whitespace string slug
  *   d. status 404 for slug not found
  * 3. Error handling: 1 tests
  *   a. status 500 if findOne exception
  * 4. Side effects: 1 tests
  *   a. Log error when error occurs
  */
describe("singleCategoryController", () => {
  let res, req, consoleLogSpy;
  const mockSlug = 'mock-slug';
  const categoryObj = {
    _id: 'valid-id',
    name: 'Shoes',
    slug: mockSlug
  };

  beforeEach(() => {
    jest.resetAllMocks();
    req = {
      params: {
        slug: null
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if valid slug", async () => {
      req.params.slug = mockSlug;
      categoryModel.findOne.mockResolvedValue(categoryObj);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });

    it("should return category if valid slug", async () => {
      req.params.slug = mockSlug;
      categoryModel.findOne.mockResolvedValue(categoryObj);

      await singleCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: categoryObj
        })
      );
    });
  });

  describe("Input Validation", () => {
    it("should return 422 if missing slug", async () => {
      req.params.slug = null;

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if slug is empty string", async () => {
      req.params.slug = "";

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if slug is whitespace only", async () => {
      req.params.slug = " ";

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 404 if slug not found", async () => {
      req.params.slug = "non-existent-slug";

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 if findOne exception occurs", async () => {
      req.params.slug = mockSlug;
      const error = new Error("findOne error");
      categoryModel.findOne.mockRejectedValue(error);

      await singleCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Side effects", () => {
    it("should log error when an exception occurs", async () => {
      req.params.slug = mockSlug;
      const error = new Error("Database error");
      categoryModel.findOne.mockRejectedValue(error);

      await singleCategoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
});
