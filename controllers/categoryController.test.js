/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import slugify from 'slugify';
import categoryModel from '../models/categoryModel';
import { createCategoryController } from './categoryController';

jest.mock('../models/categoryModel');
jest.mock('slugify');

/**
  * Unit tests for createCategoryController
  *
  * 1. Happy path: 3 tests
  *   a. status 201 for valid new category
  *   b. status 200 for existing category
  *   c. returned category structure for valid new category
  * 2. Input validation: 2 tests
  *   a. status 401 for missing name (name === null)
  *   b. status 401 for empty string name
  * 3. Error handling: 2 tests
  *   a. status 500 if findOne exception
  *   b. status 500 if save exception
  * 4. Side effects: x tests
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
    consoleLogSpy.mockRestore();
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
      )
    })

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
      }
      const mockSave = jest.fn().mockResolvedValue(categoryObj);
      categoryModel.mockImplementation(() => {
        return {
          save: mockSave
        }
      })

      await createCategoryController(req, res);

      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          category: categoryObj
        })
      );
    });
  });

  describe("Input Validation", () => {
    it("should return 401 if missing name", async () => {
      req.body.name = null;

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      )
    });

    it("should return 401 if name is empty string", async () => {
      req.body.name = "";

      await createCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      )
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

  describe("Side effects", () => {
    it("should log error when an exception occurs", async () => {
      req.body.name = validCategoryName;
      const error = new Error("Database error");
      categoryModel.findOne = jest.fn().mockRejectedValue(error);

      await createCategoryController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(error);
    });
  });
})
