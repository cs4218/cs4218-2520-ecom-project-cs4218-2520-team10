/*
	Test cases written by: Ong Chang Heng Bertrand A0253013X
	Chosen product controller functions to test: getProductController, getSingleProductController, createProductController, updateProductController, deleteProductController
*/

import { getProductController, getSingleProductController, createProductController, updateProductController, deleteProductController } from './productController.js';
import productModel from '../models/productModel.js';
import fs from 'fs';
import slugify from 'slugify';

jest.mock('braintree');

jest.mock('../models/productModel.js');
jest.mock('fs');
jest.mock('slugify');

describe('ProductController', () => {

  /*
    Test cases for getProductController:
    1. Happy path: 2 tests
      a. Should return 200 on fetch all products successfully with valid data
      b. Should return 200 with empty array when no products exist
    2. Error handling: 1 test
      a. Should return 500 on handle database error
    3. Side effects: 1 test
      a. Should log error when an exception occurs
  */

  describe('getProductController', () => {
    let req, res;

    beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    // ============ HAPPY PATH ============
    describe('Happy Path', () => {
      it('should return 200 on fetch all products successfully with valid data', async () => {
        const mockProducts = [
          {
            _id: '1',
            name: 'Product 1',
            slug: 'product-1',
            description: 'This is product 1 description',
            price: 100,
            category: { _id: 'cat1', name: 'Category 1' },
            quantity: 10,
            shipping: true,
            createdAt: new Date('2024-01-01'),
          },
          {
            _id: '2',
            name: 'Product 2',
            slug: 'product-2',
            description: 'This is product 2 description',
            price: 200,
            category: { _id: 'cat1', name: 'Category 1' },
            quantity: 5,
            shipping: false,
            createdAt: new Date('2024-01-02'),
          },
        ];
        const populateMock = jest.fn().mockReturnThis();
        const selectMock = jest.fn().mockReturnThis();
        const limitMock = jest.fn().mockReturnThis();
        const sortMock = jest.fn().mockResolvedValue(mockProducts);

        productModel.find = jest.fn().mockReturnValue({
          populate: populateMock,
          select: selectMock,
          limit: limitMock,
          sort: sortMock,
        });

        await getProductController(req, res);

        expect(productModel.find).toHaveBeenCalled();
        expect(populateMock).toHaveBeenCalledWith('category');
        expect(selectMock).toHaveBeenCalledWith('-photo');
        expect(limitMock).toHaveBeenCalledWith(12);
        expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          countTotal: mockProducts.length,
          message: expect.any(String),
          products: mockProducts,
        });
      });

      it('should return 200 with empty array when no products exist', async () => {
        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue([]),
        });

        await getProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          countTotal: 0,
          message: expect.any(String),
          products: [],
        });
      });
    });

    // ============ ERROR HANDLING ============
    describe('Error Handling', () => {
      it('should return 500 on handle database error', async () => {
        const mockError = new Error('Database failed');

        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockRejectedValue(mockError),
        });

        await getProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
          error: mockError.message,
        });
      });
    });

    // ============ SIDE EFFECTS ============
    describe('Side Effects', () => {
      it('should log error when an exception occurs', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        const mockError = new Error('Database failed');
        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockRejectedValue(mockError),
        });

        await getProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        consoleLogSpy.mockRestore();
      });
    });
  });

  /*
    Test cases for getSingleProductController:
    1. Happy path: 1 test
      a. Should fetch single product successfully by slug
    2. Input validation: 4 tests
      a. Should return 404 on non-existent slug parameter and return null product
      b. Should return 404 on empty string slug parameter and return null product
      c. Should return 404 on null slug parameter and return null product
      d. Should return 404 on undefined slug parameter and return null product
    3. Error handling: 1 test
      a. Should handle database connection error
    4. Side effects: 1 test
      a. Should log error when an exception occurs
  */

	describe('getSingleProductController', () => {
		let req, res;

		beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
			req = {
				params: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};
		});

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    // ============ HAPPY PATH ============
    describe('Happy Path', () => {
      it('should fetch single product successfully by slug', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test Description',
          price: 100,
          category: { _id: 'cat1', name: 'Category 1' },
          quantity: 10,
          shipping: true,
          createdAt: new Date('2024-01-01'),
        };
        req.params.slug = 'test-product';
        selectMock = jest.fn().mockReturnThis();
        populateMock = jest.fn().mockResolvedValue(mockProduct);

        productModel.findOne = jest.fn().mockReturnValue({
          select: selectMock,
          populate: populateMock,
        });

        await getSingleProductController(req, res);

        expect(productModel.findOne).toHaveBeenCalledWith({ slug: 'test-product' });
        expect(selectMock).toHaveBeenCalledWith('-photo');
        expect(populateMock).toHaveBeenCalledWith('category');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Single Product Fetched',
          product: mockProduct,
        });
      });
    });

		// ============ INPUT VALIDATION =============
		describe('Input Validation', () => {
      it('should return 404 on non-existent slug parameter and return null product', async () => {
        req.params.slug = 'non-existent-slug';

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(null),
        });

        await getSingleProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
    			success: false,
    			message: expect.any(String),
    		});
      });

			it('should return 404 on empty string slug parameter and return null product', async () => {
				req.params.slug = "";

				productModel.findOne = jest.fn().mockReturnValue({
					select: jest.fn().mockReturnThis(),
					populate: jest.fn().mockResolvedValue(null),
				});

				await getSingleProductController(req, res);

    		expect(res.status).toHaveBeenCalledWith(404);
    		expect(res.send).toHaveBeenCalledWith({
    			success: false,
    			message: expect.any(String),
    		});
			});

      it("should return 404 on null slug parameter and return null product", async () => {
        req.params.slug = null;

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(null),
        });

        await getSingleProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
    			success: false,
    			message: expect.any(String),
    		});
      });

      it("should return 404 on undefined slug parameter and return null product", async () => {
        req.params.slug = undefined;

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(null),
        });

        await getSingleProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
    			success: false,
    			message: expect.any(String),
    		});
      });
		});

		// ============ ERROR HANDLING ============
    describe('Error Handling', () => {
      it('should handle database connection error', async () => {
        const mockError = new Error('Database connection failed');

        req.params.slug = 'test-product';

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockRejectedValue(mockError),
        });

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await getSingleProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send.mock.calls[0][0].success).toBe(false);
        expect(res.send.mock.calls[0][0].message).toBe('Error while getting single product');

        consoleLogSpy.mockRestore();
      });
		});

    // ============ SIDE EFFECTS ============
    describe('Side Effects', () => {
      it('should log error when an exception occurs', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        const mockError = new Error('Database connection failed');
        req.params.slug = 'test-product';
        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockRejectedValue(mockError),
        });

        await getSingleProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        consoleLogSpy.mockRestore();
      });
    });
  });

  /*
    Test cases for createProductController:
    1. Happy path: 2 tests
      a. Should return create product successfully without photo
      b. Should create product successfully with photo
    2. Input validation: 16 tests
      a. Should return 409 when product with same name already exists
      b. Should return 422 and reject when name is missing
      c. Should return 422 and reject when description is missing
      d. Should return 422 and reject when price is missing
      e. Should return 422 and reject when category is missing
      f. Should return 422 and reject when quantity is missing
      g. Should return 422 and reject when shipping is missing
      h. Boundary value analysis of photo size (<1MB, =1MB, >1MB)
      i. Boundary value analysis of price (-1, 0, 1)
      j. Boundary value analysis of quantity (-1, 0, 1)
    3. Error handling: 2 tests
      a. Should handle database error
      b. Should handle file system error when reading photo
    4. Side effects: 3 tests
      a. Should create product slug correctly using product name
      b. Should call save method on product model instance to save product to database
      c. Should log error when an exception occurs
  */

  describe('createProductController', () => {
    let req, res;

    const mockProductData = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      category: 'cat1',
      quantity: 10,
      shipping: true,
      slug: 'test-product',
      photo: {
        data: null,
        contentType: null,
      },
      save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
      req = {
        fields: {},
        files: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      productModel.findOne = jest.fn().mockReturnValue(null);

      mockProductData.photo.data = null;
      mockProductData.photo.contentType = null;
      mockProductData.save.mockClear();
    });

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

    // ============ HAPPY PATH ============
    describe('Happy Path', () => {
      it('should return 201 and create product successfully without photo', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
        };
        req.files = {};

        slugify.mockReturnValue(mockProductData.slug);
        productModel.mockImplementation(() => mockProductData);

        await createProductController(req, res);

        expect(productModel).toHaveBeenCalledWith({
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
          slug: mockProductData.slug,
        });
        expect(mockProductData.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: expect.any(String),
          products: mockProductData,
        });
      });

      it('should return 201 and create product successfully with photo', async () => {
        const mockPhotoBuffer = Buffer.from('fake-image-data');
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
        };
        req.files = {
          photo: {
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };
        slugify.mockReturnValue(mockProductData.slug);
        productModel.mockImplementation(() => mockProductData);
        fs.readFileSync.mockReturnValue(mockPhotoBuffer);

        await createProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path.jpg');
        expect(mockProductData.photo.data).toBe(mockPhotoBuffer);
        expect(mockProductData.photo.contentType).toBe('image/jpeg');
        expect(mockProductData.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: expect.any(String),
          products: mockProductData,
        });
      });
    });

    // ============ INPUT VALIDATION ============
    describe('Input Validation', () => {
      it("should return 409 when product with same name already exists", async () => {
        productModel.findOne = jest.fn().mockReturnValue({ name: mockProductData.name });

        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when name is missing', async () => {
        req.fields = {
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when description is missing', async () => {
        req.fields = {
          name: mockProductData.name,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when price is missing', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when category is missing', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          quantity: mockProductData.quantity,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when quantity is missing', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when shipping is missing', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      // ============ BOUNDARY VALUE ANALYSIS (Photo Size) ============
      describe('Boundary Value Analysis - Photo Size', () => {
        it('should return 201 and accept photo at maximum boundary (exactly 1MB)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {
            photo: {
              path: '/fake/path.jpg',
              type: 'image/jpeg',
              size: 1000000, // Exactly 1MB
            },
          };

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);
          fs.readFileSync.mockReturnValue(Buffer.from('image-data'));

          await createProductController(req, res);

          expect(mockProductData.photo.data).toEqual(Buffer.from('image-data'));
          expect(mockProductData.photo.contentType).toBe('image/jpeg');
          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });

        it('should return 422 and reject photo just above maximum boundary (1MB + 1 byte)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {
            photo: {
              path: '/fake/path.jpg',
              type: 'image/jpeg',
              size: 1000001, // 1MB + 1 byte
            },
          };

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
        });

        it('should return 201 and accept small photo (below boundary)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {
            photo: {
              path: '/fake/path.jpg',
              type: 'image/jpeg',
              size: 999999, // Just below 1MB
            },
          };

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);
          fs.readFileSync.mockReturnValue(Buffer.from('small-image'));

          await createProductController(req, res);

          expect(mockProductData.photo.data).toEqual(Buffer.from('small-image'));
          expect(mockProductData.photo.contentType).toBe('image/jpeg');
          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });
      });

      // ============ Boundary Value Analysis (Price) ============
      describe('Boundary Value Analysis - Price', () => {
        it('should return 201 and allow creation of product with free price (price = 0)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: 0,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });

        it('should return 201 and create product with normal price (price = 1)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: 1,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });

        it('should return 422 and not allow creation of product with negative price (price = -1)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: -1,
            category: mockProductData.category,
            quantity: mockProductData.quantity,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
        });
      });

      // ============ BOUNDARY VALUE ANALYSIS (Quantity) ============
      describe('Boundary Value Analysis - Quantity', () => {
        it('should return 201 and create product with zero quantity (quantity = 0)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: 0,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });

        it('should return 201 and create product with quantity 1 (quantity = 1)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: 1,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          slugify.mockReturnValue(mockProductData.slug);
          productModel.mockImplementation(() => mockProductData);

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: mockProductData,
          });
        });

        it('should return 422 and not allow creation of product with invalid quantity (quantity = -1)', async () => {
          req.fields = {
            name: mockProductData.name,
            description: mockProductData.description,
            price: mockProductData.price,
            category: mockProductData.category,
            quantity: -1,
            shipping: mockProductData.shipping,
          };
          req.files = {};

          await createProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
        });
      });
    });

    // ============ ERROR HANDLING ============
    describe('Error Handling', () => {
      it('should return 500 and handle product save error', async () => {
        const mockError = new Error('Database save failed');
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'test-product',
          photo: {},
          save: jest.fn().mockRejectedValue(mockError),
        };

        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: mockError,
          message: expect.any(String),
        });
      });

      it('should return 500 and handle file read error', async () => {
        const mockError = new Error('File read failed');
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'test-product',
          photo: {},
          save: jest.fn().mockRejectedValue(mockError),
        };

        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {
          photo: {
            path: '/invalid/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockImplementation(() => {
          throw mockError;
        });

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: mockError,
          message: expect.any(String),
        });
      });
    });

    // ============ SIDE EFFECTS ============
    describe('Side Effects', () => {
      it('should create slug from product name', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
        };
        req.files = {};

        slugify.mockReturnValue(mockProductData.slug);
        productModel.mockImplementation(() => mockProductData);

        await createProductController(req, res);

        expect(slugify).toHaveBeenCalledWith(mockProductData.name);
      });

      it('should call product save method', async () => {
        req.fields = {
          name: mockProductData.name,
          description: mockProductData.description,
          price: mockProductData.price,
          category: mockProductData.category,
          quantity: mockProductData.quantity,
          shipping: mockProductData.shipping,
        };
        req.files = {};

        slugify.mockReturnValue(mockProductData.slug);
        productModel.mockImplementation(() => mockProductData);

        await createProductController(req, res);

        expect(mockProductData.save).toHaveBeenCalled();
      });
    });

    it('should log error when an exception occurs', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockError = new Error('Database save failed');
      const mockProduct = {
        _id: '1',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'cat1',
        quantity: 10,
        shipping: true,
        slug: 'test-product',
        photo: {},
        save: jest.fn().mockRejectedValue(mockError),
      };

      req.fields = {
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        category: 'cat1',
        quantity: 10,
        shipping: true,
      };
      req.files = {};

      slugify.mockReturnValue('test-product');
      productModel.mockImplementation(() => mockProduct);

      await createProductController(req, res);

      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
  });

  /*
    Test cases for deleteProductController:
    1. Happy path: 1 test
      a. Should delete product successfully by ID
    2. Input validation: 4 tests
      a. Should return 404 when product with given ID does not exist
      b. Should return 404 when product ID is empty string
      c. Should return 404 when product ID is null
      d. Should return 404 when product ID is undefined
    3. Error handling: 1 test
      a. Should return 500 when database delete failed
    4. Side effects: 1 test
      a. Should log error when an exception occurs
  */

	describe('deleteProductController', () => {
		let req, res;

		beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
			req = {
				params: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};
		});

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

		// ============ HAPPY PATH ============
		describe('Happy Path', () => {
			it('should return 200 and delete product successfully by ID', async () => {
        req.params.pid = '1';
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
        };
        const selectMock = jest.fn().mockResolvedValue(mockProduct);
        productModel.findByIdAndDelete = jest.fn().mockReturnValue({
          select: selectMock,
        });

        await deleteProductController(req, res);

        expect(selectMock).toHaveBeenCalledWith('-photo');
        expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('1');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Product deleted successfully',
        });
      });
		});

    // ============ INPUT VALIDATION =============
    describe('Input Validation', () => {
      it('should return 404 when product with given ID does not exist', async () => {
        productModel.findByIdAndDelete.mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });
        req.params.pid = 'non-existent-id';

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 404 when product ID is empty string', async () => {
        productModel.findByIdAndDelete.mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });
        req.params.pid = "";

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 404 when product ID is null', async () => {
        productModel.findByIdAndDelete.mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });
        req.params.pid = null;

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 404 when product ID is undefined', async () => {
        productModel.findByIdAndDelete.mockReturnValue({
          select: jest.fn().mockResolvedValue(null),
        });
        req.params.pid = undefined;

        await deleteProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });
    });

		// ============ ERROR HANDLING ============
		describe('Error Handling', () => {
			it('should return 500 when database delete failed', async () => {
				const mockError = new Error('Database delete failed');

				productModel.findByIdAndDelete.mockReturnValue({
					select: jest.fn().mockRejectedValue(mockError),
				});

				req.params.pid = 'invalid-id';

				await deleteProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
          error: mockError,
        });
      });
    });

    // ============ SIDE EFFECTS ============
    describe('Side Effects', () => {
      it('should log error when an exception occurs', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        const mockError = new Error('Database delete failed');

        productModel.findByIdAndDelete.mockReturnValue({
          select: jest.fn().mockRejectedValue(mockError),
        });

        req.params.pid = 'invalid-id';

        await deleteProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      });
    });
  });

  /*
    Test cases for updateProductController:
    1. Happy path: 2 tests
      a. Should update product successfully without photo
      b. Should update product successfully with photo
    2. Input validation: 17 tests
      a. Should return 404 when product with given ID does not exist
      b. Should return 409 when updating product name to a name that already exists for another product
      c. Should return 422 and reject when name is missing
      d. Should return 422 and reject when description is missing
      e. Should return 422 and reject when price is missing
      f. Should return 422 and reject when category is missing
      g. Should return 422 and reject when quantity is missing
      h. Should return 422 and reject when shipping is missing
      i. Boundary value analysis of photo size (<1MB, =1MB, >1MB)
      j. Boundary value analysis of price (-1, 0, 1)
      k. Boundary value analysis of quantity (-1, 0, 1)
    3. Error handling: 2 tests
      a. Should return 500 when database update failed
      b. Should return 500 when file system error occurs while reading photo
    4. Side effects: 3 test
      a. Should create slug from updated product name
      b. Should call product save method
      c. Should log error when an exception occurs
  */

	describe('updateProductController', () => {
		let req, res;

    const mockUpdatedProductData = {
      _id: '1',
      name: 'Updated Product',
      description: 'Updated Description',
      price: 150,
      category: 'cat1',
      quantity: 20,
      shipping: true,
      slug: 'updated-product',
      photo: {
        data: null,
        contentType: null,
      },
      save: jest.fn().mockResolvedValue(true),
    };

		beforeEach(() => {
      jest.spyOn(console, "log").mockImplementation();
			req = {
				params: {},
				fields: {},
				files: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};

      productModel.findOne = jest.fn().mockReturnValue(null);
      productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);
      mockUpdatedProductData.photo.data = null;
      mockUpdatedProductData.photo.contentType = null;
      mockUpdatedProductData.save.mockClear();
		});

    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });

		// ============ HAPPY PATH ============
		describe('Happy Path', () => {
      it('should return 201 and update product successfully without photo', async () => {
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {};

        slugify.mockReturnValue(mockUpdatedProductData.slug);
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);

        await updateProductController(req, res);

        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            slug: mockUpdatedProductData.slug,
          }),
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: expect.any(String),
          products: mockUpdatedProductData,
        });
      });

			it('should return 201 and update product successfully with photo', async () => {
				const mockPhotoBuffer = Buffer.from('updated-image-data');
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {
          photo: {
            path: '/updated/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };

        slugify.mockReturnValue(mockUpdatedProductData.slug);
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);
        fs.readFileSync.mockReturnValue(mockPhotoBuffer);

        await updateProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith('/updated/path.jpg');
        expect(mockUpdatedProductData.photo.data).toBe(mockPhotoBuffer);
        expect(mockUpdatedProductData.photo.contentType).toBe('image/jpeg');
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: expect.any(String),
					products: mockUpdatedProductData,
				});
			});
		});

		// ============ INPUT VALIDATION =============
		describe('Input Validation', () => {
      it('should return 404 when product with given ID does not exist', async () => {
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
        req.params.pid = 'non-existent-id';
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it("should return 409 when updating product name to a name that already exists for another product", async () => {
        const existingProduct = {
          _id: '2',
          name: 'Existing Product',
          slug: 'existing-product',
        };
        productModel.findOne = jest.fn().mockResolvedValue(existingProduct);
        slugify.mockReturnValue(existingProduct.slug);
        req.params.pid = '1';
        req.fields = {
          name: existingProduct.name, // Attempting to update to a name that already exists
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

			it('should return 422 and reject update when name is missing', async () => {
				req.params.pid = mockUpdatedProductData._id;
				req.fields = {
					description: mockUpdatedProductData.description,
					price: mockUpdatedProductData.price,
					category: mockUpdatedProductData.category,
					quantity: mockUpdatedProductData.quantity,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(422);
				expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
			});

			it('should return 422 and reject when description is missing', async () => {
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

			it('should return 422 and reject when price is missing', async () => {
				req.params.pid = mockUpdatedProductData._id;
				req.fields = {
					name: mockUpdatedProductData.name,
					description: mockUpdatedProductData.description,
					category: mockUpdatedProductData.category,
					quantity: mockUpdatedProductData.quantity,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(422);
				expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
			});

			it('should return 422 and reject when category is missing', async () => {
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          quantity: mockUpdatedProductData.quantity,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

			it('should return 422 and reject when quantity is missing', async () => {
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      it('should return 422 and reject when shipping is missing', async () => {
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(422);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
      });

      // ============ BOUNDARY VALUE ANALYSIS - Photo size ============
      describe('Boundary Value Analysis - Photo Size', () => {
        it('should return 201 and accept photo at maximum boundary (exactly 1MB)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            category: mockUpdatedProductData.category,
            quantity: mockUpdatedProductData.quantity,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {
            photo: {
              path: '/path/to/photo.jpg',
              type: 'image/jpeg',
              size: 1000000, // 1MB
            },
          };

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });

        it('should return 422 and reject photo just above maximum boundary (1MB + 1 byte)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: 'Updated Product',
            description: 'Updated Description',
            price: 150,
            category: 'cat1',
            quantity: 20,
            shipping: true,
          };
          req.files = {
            photo: {
              path: '/path/to/photo.jpg',
              type: 'image/jpeg',
              size: 1000001, // 1MB + 1 byte
            },
          };

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
        });

        it('should return 201 and accept small photo (below boundary)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            category: mockUpdatedProductData.category,
            quantity: mockUpdatedProductData.quantity,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {
            photo: {
              path: '/path/to/photo.jpg',
              type: 'image/jpeg',
              size: 999999, // just below 1MB
            },
          };

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });
      });

      // ============ Boundary Value Analysis - Price ============
      describe('Boundary Value Analysis - Price', () => {
        it('should return 201 and allow update of product with free price (price = 0)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: 0,
            category: mockUpdatedProductData.category,
            quantity: mockUpdatedProductData.quantity,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });

        it('should return 201 and create product with normal price (price = 1)', async () => {
          req.params.pid = '1';
          req.fields = {
            name: 'Normal Product',
            description: 'Updated Description',
            price: 1,
            category: 'cat1',
            quantity: 20,
            shipping: true,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });
        
        it('should return 422 and not allow update of product with negative price (price = -1)', async () => {
          req.params.pid = '1';
          req.fields = {
            name: 'Expensive Product',
            description: 'Updated Description',
            price: -1,
            category: 'cat1',
            quantity: 20,
            shipping: true,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
        });
        });
      });

      // ============ Boundary Value Analysis - Quantity ============
      describe('Boundary Value Analysis - Quantity', () => {
        it('should return 201 and update product with zero quantity (quantity = 0)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            category: mockUpdatedProductData.category,
            quantity: 0,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });

        it('should return 201 and update product with quantity 1 (quantity = 1)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            category: mockUpdatedProductData.category,
            quantity: 1,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(201);
          expect(res.send).toHaveBeenCalledWith({
            success: true,
            message: expect.any(String),
            products: expect.any(Object),
          });
        });

        it('should return 422 and not allow update of product with invalid quantity (quantity = -1)', async () => {
          req.params.pid = mockUpdatedProductData._id;
          req.fields = {
            name: mockUpdatedProductData.name,
            description: mockUpdatedProductData.description,
            price: mockUpdatedProductData.price,
            category: mockUpdatedProductData.category,
            quantity: -1,
            shipping: mockUpdatedProductData.shipping,
          };
          req.files = {};

          await updateProductController(req, res);

          expect(res.status).toHaveBeenCalledWith(422);
          expect(res.send).toHaveBeenCalledWith({
            success: false,
            message: expect.any(String),
          });
        });
      });
		});

		// ============ ERROR HANDLING ============
		describe('Error Handling', () => {
			it('should handle product update error', async () => {
				const mockError = new Error('Database update failed');
				req.params.pid = mockUpdatedProductData._id;
				req.fields = {
					name: mockUpdatedProductData.name,
					description: mockUpdatedProductData.description,
					price: mockUpdatedProductData.price,
					category: mockUpdatedProductData.category,
					quantity: mockUpdatedProductData.quantity,
					shipping: mockUpdatedProductData.shipping,
				};
				req.files = {};

				productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
          error: mockError,
        });
			});

      it('should handle file read error during update', async () => {
        const mockError = new Error('File read failed');
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {
          photo: {
            path: 'path/to/photo.jpg',
            type: 'image/jpeg',
          },
        };

        fs.readFileSync = jest.fn().mockImplementation(() => {
          throw mockError;
        });

        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String),
          error: mockError,
        });
      });
		});

		// ============ SIDE EFFECTS ============
		describe('Side Effects', () => {
			it('should create slug from updated product name', async () => {
				req.params.pid = mockUpdatedProductData._id;
				req.fields = {
					name: mockUpdatedProductData.name,
					description: mockUpdatedProductData.description,
					price: mockUpdatedProductData.price,
					category: mockUpdatedProductData.category,
					quantity: mockUpdatedProductData.quantity,
					shipping: mockUpdatedProductData.shipping,
				};
				req.files = {};

				slugify.mockReturnValue(mockUpdatedProductData.slug);
				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);

				await updateProductController(req, res);

				expect(slugify).toHaveBeenCalledWith(mockUpdatedProductData.name);
			});

			it('should call product save method after update', async () => {
				req.params.pid = mockUpdatedProductData._id;
				req.fields = {
					name: mockUpdatedProductData.name,
					description: mockUpdatedProductData.description,
					price: mockUpdatedProductData.price,
					category: mockUpdatedProductData.category,
					quantity: mockUpdatedProductData.quantity,
					shipping: mockUpdatedProductData.shipping,
				};
				req.files = {};

				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedProductData);

				await updateProductController(req, res);

				expect(mockUpdatedProductData.save).toHaveBeenCalled();
			});

      it('should log error when an exception occurs', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        const mockError = new Error('Database update failed');
        req.params.pid = mockUpdatedProductData._id;
        req.fields = {
          name: mockUpdatedProductData.name,
          description: mockUpdatedProductData.description,
          price: mockUpdatedProductData.price,
          category: mockUpdatedProductData.category,
          quantity: mockUpdatedProductData.quantity,
          shipping: mockUpdatedProductData.shipping,
        };
        req.files = {};

        productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

        await updateProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      });
		});
	});
});