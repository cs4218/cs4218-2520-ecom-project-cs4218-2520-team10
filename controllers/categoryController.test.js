/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import { categoryController, createCategoryController, deleteCategoryController, singleCategoryController, updateCategoryController } from './categoryController';
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
  * 3. Error handling: 1 tests
  *   a. status 500 if database error occurs
  */
describe("createCategoryController", () => {
  let res, req;
  const mockSlug = 'mock-slug';
  const validCategoryName = 'Shoes';

  beforeEach(() => {
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
    jest.spyOn(console, "log").mockImplementation(() => {})
  });

  afterEach(() => {
    jest.resetAllMocks();
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
    it('should return 500 if database error occurs', async () => {
      req.body.name = validCategoryName;
      const error = new Error('Database error');
      categoryModel.findOne.mockRejectedValue(error);
      categoryModel.mockImplementation(() => {
        return {
          save: jest.fn().mockRejectedValue(error)
        }
      })

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
  * 3. Error handling: 1 tests
  *   a. status 500 if database error occurs
  */
describe("updateCategoryController", () => {
  let res, req;
  const mockSlug = 'mock-slug';
  const validCategoryName = 'Shoes';
  const validCategoryId = 'validId';
  const mockCategory = {
    _id: validCategoryId,
    name: validCategoryName,
    slug: mockSlug
  };

  beforeEach(() => {
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
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if valid new name given", async () => {
      req.body.id = validCategoryId;
      req.body.name = validCategoryName;
      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.findByIdAndUpdate.mockResolvedValue(mockCategory);

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
      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.findByIdAndUpdate.mockResolvedValue(mockCategory);

      await updateCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: mockCategory
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
      categoryModel.findOne.mockResolvedValue(mockCategory);

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
      categoryModel.findOne.mockResolvedValue(null);
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
    it("should return 500 if database error occurs", async () => {
      req.body.name = validCategoryName;
      req.params.id = validCategoryId;
      const error = new Error("Database error");
      categoryModel.findOne.mockRejectedValue(error);
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
});

/**
  * Unit tests for categoryController
  *
  * 1. Happy path: 3 tests
  *   a. status 200 if no exception
  *   b. return category structure if no exception
  *   c. return empty category list if find returns empty
  * 2. Error handling: 1 tests
  *   a. status 500 if database error occurs
  */
describe("categoryController", () => {
  let res, req;
  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if no database error", async () => {
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

      expect(res.send.mock.calls[0][0].category).toHaveLength(mockCategories.length);
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
    it("should return 500 if database error occurs", async () => {
      const error = new Error("Database error");
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
  *   a. status 500 if database error occurs
  */
describe("singleCategoryController", () => {
  let res, req;
  const mockSlug = 'mock-slug';
  const mockCategory = {
    _id: 'validId',
    name: 'Shoes',
    slug: mockSlug
  };

  beforeEach(() => {
    req = {
      params: {
        slug: null
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if valid slug", async () => {
      req.params.slug = mockSlug;
      categoryModel.findOne.mockResolvedValue(mockCategory);

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
      categoryModel.findOne.mockResolvedValue(mockCategory);

      await singleCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: mockCategory
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
    it("should return 500 if database error occurs", async () => {
      req.params.slug = mockSlug;
      const error = new Error("Database error");
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
});

/**
  * Unit tests for deleteCategoryController
  *
  * 1. Happy path: 1 tests
  *   a. status 200 for valid id
  * 2. Input validation: 3 tests
  *   a. status 422 for missing category id (id === null)
  *   b. status 422 for invalid category id
  *   c. status 404 for category id not found
  * 3. Error handling: 1 tests
  *   a. status 500 if database error occurs
  */
describe("deleteCategoryController", () => {
  let res, req;
  const validCategoryId = 'validId';
  const mockCategory = {
    _id: validCategoryId,
    name: 'Shoes',
    slug: 'mock-slug'
  };

  beforeEach(() => {
    req = {
      params: {
        id: null
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should return 200 if valid id", async () => {
      req.params.id = validCategoryId;
      categoryModel.findByIdAndDelete.mockResolvedValue(mockCategory);

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String)
        })
      );
    });
  });

  describe("Input Validation", () => {
    it("should return 422 if null category id", async () => {
      req.params.id = null;
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 422 if invalid category id", async () => {
      req.params.id = "invalid-id";
      jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(false);

      await deleteCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.any(String)
        })
      );
    });

    it("should return 404 if category id not found", async () => {
      req.params.id = "non-existent-id";

      await deleteCategoryController(req, res);

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
    it("should return 500 if database error occurs", async () => {
      req.params.id = validCategoryId;
      const error = new Error("Database error");
      categoryModel.findByIdAndDelete.mockRejectedValue(error);

      await deleteCategoryController(req, res);

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
});
