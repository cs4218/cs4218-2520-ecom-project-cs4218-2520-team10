import { getProductController, getSingleProductController, createProductController, updateProductController, deleteProductController } from './productController.js';
import productModel from '../models/productModel.js';
import fs from 'fs';
import slugify from 'slugify';

jest.mock('braintree');

jest.mock('../models/productModel.js');
jest.mock('fs');
jest.mock('slugify');

describe('ProductController', () => {
  describe('getProductController', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    // ============ HAPPY PATH ============
    describe('Happy Path', () => {
      it('should fetch all products successfully with valid data', async () => {
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

        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue(mockProducts),
        });

        await getProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          counTotal: mockProducts.length,
          message: 'All products fetched',
          products: mockProducts,
        });
      });

      it('should return empty array when no products exist', async () => {
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
          counTotal: 0,
          message: 'All products fetched',
          products: [],
        });
      });

      it('should populate category field correctly', async () => {
        const populateMock = jest.fn().mockReturnThis();

        productModel.find = jest.fn().mockReturnValue({
          populate: populateMock,
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue([]),
        });

        await getProductController(req, res);

        expect(populateMock).toHaveBeenCalledWith('category');
      });

      it('should exclude photo field from results', async () => {
        const selectMock = jest.fn().mockReturnThis();

        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: selectMock,
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockResolvedValue([]),
        });

        await getProductController(req, res);

        expect(selectMock).toHaveBeenCalledWith('-photo');
      });

			it('should limit results to 12 products', async () => {
				const limitMock = jest.fn().mockReturnThis();
				productModel.find = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnThis(),
					select: jest.fn().mockReturnThis(),
					limit: limitMock,
					sort: jest.fn().mockResolvedValue([]),
				});

				await getProductController(req, res);

				expect(limitMock).toHaveBeenCalledWith(12);
			});
		});

    // ============ ERROR HANDLING ============
    describe('Error Handling', () => {
      it('should handle database connection error', async () => {
        const mockError = new Error('Database connection failed');

        productModel.find = jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          sort: jest.fn().mockRejectedValue(mockError),
        });

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await getProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Error in getting products',
          error: mockError.message,
        });

        consoleLogSpy.mockRestore();
      });
    });
  });



	describe('getSingleProductController', () => {
		let req, res;

		beforeEach(() => {
			jest.clearAllMocks();
			req = {
				params: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};
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

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockResolvedValue(mockProduct),
        });

        await getSingleProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Single Product Fetched',
          product: mockProduct,
        });
      });

      it('should exclude photo field from result', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test Description',
          price: 100,
          category: { _id: 'cat1', name: 'Category 1' },
          quantity: 10,
          shipping: true,
        };

        req.params.slug = 'test-product';

        const selectMock = jest.fn().mockReturnThis();

        productModel.findOne = jest.fn().mockReturnValue({
          select: selectMock,
          populate: jest.fn().mockResolvedValue(mockProduct),
        });

        await getSingleProductController(req, res);

        expect(selectMock).toHaveBeenCalledWith('-photo');
      });

      it('should populate category field', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Test Product',
          slug: 'test-product',
          description: 'Test Description',
          price: 100,
          category: { _id: 'cat1', name: 'Category 1' },
          quantity: 10,
          shipping: true,
        };

        req.params.slug = 'test-product';

        const populateMock = jest.fn().mockResolvedValue(mockProduct);

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: populateMock,
        });

        await getSingleProductController(req, res);

        expect(populateMock).toHaveBeenCalledWith('category');
      });
    });

		// ============ INPUT VALIDATION =============
		describe('Invalid Input', () => {
			it('should accept empty slug parameter and return null product', async () => {
				req.params.slug = "";

				productModel.findOne = jest.fn().mockReturnValue({
					select: jest.fn().mockReturnThis(),
					populate: jest.fn().mockResolvedValue(null),
				});

				await getSingleProductController(req, res);

    		expect(res.status).toHaveBeenCalledWith(200);
    		expect(res.send.mock.calls[0][0].product).toBeNull();
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

			it('should handle invalid slug error', async () => {
        const mockError = new Error('Invalid slug format');

        req.params.slug = null;

        productModel.findOne = jest.fn().mockReturnValue({
          select: jest.fn().mockReturnThis(),
          populate: jest.fn().mockRejectedValue(mockError),
        });

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await getSingleProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        consoleLogSpy.mockRestore();
      });
		});
	});




  describe('createProductController', () => {
    let req, res;

    beforeEach(() => {
      jest.clearAllMocks();
      req = {
        fields: {},
        files: {},
      };
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };
    });

    // ============ HAPPY PATH ============
    describe('Happy Path', () => {
      it('should create product successfully without photo', async () => {
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
          save: jest.fn().mockResolvedValue(true),
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

        expect(productModel).toHaveBeenCalledWith({
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'test-product',
        });
        expect(mockProduct.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Product Created Successfully',
          products: mockProduct,
        });
      });

      it('should create product successfully with photo', async () => {
        const mockProduct = {
          _id: '1',
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

        const mockPhotoBuffer = Buffer.from('fake-image-data');

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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(mockPhotoBuffer);

        await createProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path.jpg');
        expect(mockProduct.photo.data).toBe(mockPhotoBuffer);
        expect(mockProduct.photo.contentType).toBe('image/jpeg');
        expect(mockProduct.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should create product with all fields populated', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Laptop',
          description: 'Gaming Laptop',
          price: 1500,
          category: 'cat1',
          quantity: 5,
          shipping: true,
          slug: 'laptop',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Laptop',
          description: 'Gaming Laptop',
          price: 1500,
          category: 'cat1',
          quantity: 5,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('laptop');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send.mock.calls[0][0].success).toBe(true);
      });
    });

    // ============ INPUT VALIDATION (Invalid Partition) ============
    describe('Input Validation', () => {
      it('should reject when name is missing', async () => {
        req.fields = {
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
      });

      it('should reject when description is missing', async () => {
        req.fields = {
          name: 'Test Product',
          price: 100,
          category: 'cat1',
          quantity: 10,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
      });

      it('should reject when price is missing', async () => {
        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          category: 'cat1',
          quantity: 10,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required and should be greater than or equal to 0' });
      });

      it('should reject when category is missing', async () => {
        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          quantity: 10,
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
      });

      it('should reject when quantity is missing', async () => {
        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
        };
        req.files = {};

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required and should be greater than or equal to 0' });
      });
    });

    // ============ BOUNDARY VALUE ANALYSIS (Photo Size) ============
    describe('Boundary Value Analysis - Photo Size', () => {
      it('should accept photo at maximum boundary (exactly 1MB)', async () => {
        const mockProduct = {
          _id: '1',
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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 1000000, // Exactly 1MB
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(Buffer.from('image-data'));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(mockProduct.save).toHaveBeenCalled();
      });

      it('should reject photo just above maximum boundary (1MB + 1 byte)', async () => {
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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 1000001, // 1MB + 1 byte
          },
        };

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          error: 'Photo is Required and should be less than 1mb',
        });
      });

      it('should accept small photo (well below boundary)', async () => {
        const mockProduct = {
          _id: '1',
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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 999999, // Just below 1MB
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(Buffer.from('small-image'));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should accept photo with size 0 boundary', async () => {
        const mockProduct = {
          _id: '1',
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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 0, // Empty file
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(Buffer.from(''));

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    // ============ Boundary Value Analysis (Price) ============
    describe('Boundary Value Analysis - Price', () => {
      it('should allow creation of product with free price (price = 0)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Free Product',
          description: 'Test Description',
          price: 0,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'free-product',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Free Product',
          description: 'Test Description',
          price: 0,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('free-product');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should create product with normal price (price = 1)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Normal Product',
          description: 'Test Description',
          price: 1,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'normal-product',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Normal Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('normal-product');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should not allow creation of product with negative price (price = -1)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Expensive Product',
          description: 'Test Description',
          price: -1,
          category: 'cat1',
          quantity: 1,
          shipping: true,
          slug: 'expensive-product',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Expensive Product',
          description: 'Test Description',
          price: -1,
          category: 'cat1',
          quantity: 1,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('expensive-product');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    // ============ BOUNDARY VALUE ANALYSIS (Quantity) ============
    describe('Boundary Value Analysis - Quantity', () => {
      it('should create product with zero quantity (quantity = 0)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Out of Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 0,
          shipping: true,
          slug: 'out-of-stock',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Out of Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 0,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('out-of-stock');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should create product with quantity 1 (quantity = 1)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Low Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 1,
          shipping: true,
          slug: 'low-stock',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Low Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 1,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('low-stock');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
      });

      it('should not allow creation of product with invalid quantity (quantity = -1)', async () => {
        const mockProduct = {
          _id: '1',
          name: 'High Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: -1,
          shipping: true,
          slug: 'high-stock',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'High Stock',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: -1,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('high-stock');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
      });
    });

    // ============ ERROR HANDLING ============
    describe('Error Handling', () => {
      it('should handle product save error', async () => {
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

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await createProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send.mock.calls[0][0].success).toBe(false);
        expect(res.send.mock.calls[0][0].message).toBe('Error in creating product');

        consoleLogSpy.mockRestore();
      });

      it('should handle file read error', async () => {
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

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await createProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);

        consoleLogSpy.mockRestore();
      });
    });

    // ============ SIDE EFFECTS ============
    describe('Side Effects', () => {
      it('should create slug from product name', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Test Product Name',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'test-product-name',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.fields = {
          name: 'Test Product Name',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('test-product-name');
        productModel.mockImplementation(() => mockProduct);

        await createProductController(req, res);

        expect(slugify).toHaveBeenCalledWith('Test Product Name');
      });

      it('should read file when photo is provided', async () => {
        const mockPhotoBuffer = Buffer.from('image-data');
        const mockProduct = {
          _id: '1',
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
            path: '/fake/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };

        slugify.mockReturnValue('test-product');
        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(mockPhotoBuffer);

        await createProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith('/fake/path.jpg');
        expect(mockProduct.photo.data).toBe(mockPhotoBuffer);
        expect(mockProduct.photo.contentType).toBe('image/jpeg');
      });

      it('should not read file when photo is not provided', async () => {
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
          save: jest.fn().mockResolvedValue(true),
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

        expect(fs.readFileSync).not.toHaveBeenCalled();
      });

      it('should call product save method', async () => {
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
          save: jest.fn().mockResolvedValue(true),
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

        expect(mockProduct.save).toHaveBeenCalled();
      });
    });
  });

	describe('deleteProductController', () => {
		let req, res;

		beforeEach(() => {
			jest.clearAllMocks();
			req = {
				params: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};
		});

		// ============ HAPPY PATH ============
		describe('Happy Path', () => {
			it('should delete product successfully by ID', async () => {
				productModel.findByIdAndDelete.mockReturnValue({
					select: jest.fn().mockResolvedValue(null),
				});

				req.params.pid = '1';

				await deleteProductController(req, res);

				expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('1');
				expect(res.status).toHaveBeenCalledWith(200);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Deleted Successfully',
				});
			});
		});

		// ============ ERROR HANDLING ============
		describe('Error Handling', () => {
			it('should handle product not found error', async () => {
				const mockError = new Error('Product not found');

				productModel.findByIdAndDelete.mockReturnValue({
					select: jest.fn().mockRejectedValue(mockError),
				});

				req.params.pid = 'invalid-id';

				const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

				await deleteProductController(req, res);

				expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send.mock.calls[0][0].success).toBe(false);
      	expect(res.send.mock.calls[0][0].message).toBe('Error while deleting product');

        consoleLogSpy.mockRestore();
      });

			it('should handle unsuccessful delete error', async () => {
				const mockError = new Error('Delete operation failed');

				productModel.findByIdAndDelete.mockReturnValue({
					select: jest.fn().mockRejectedValue(mockError),
				});

				req.params.pid = '1';

				const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

				await deleteProductController(req, res);

				expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send.mock.calls[0][0].success).toBe(false);
				expect(res.send.mock.calls[0][0].message).toBe('Error while deleting product');

				consoleLogSpy.mockRestore();
			});
		});
	});



	describe('updateProductController', () => {
		let req, res;

		beforeEach(() => {
			jest.clearAllMocks();
			req = {
				params: {},
				fields: {},
				files: {},
			};
			res = {
				status: jest.fn().mockReturnThis(),
				send: jest.fn().mockReturnThis(),
			};
		});

		// ============ HAPPY PATH ============
		describe('Happy Path', () => {
      it('should update product successfully without photo', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Updated Product',
          description: 'Updated Description',
          price: 150,
          category: 'cat1',
          quantity: 20,
          shipping: true,
          slug: 'updated-product',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.params.pid = '1';
        req.fields = {
          name: 'Updated Product',
          description: 'Updated Description',
          price: 150,
          category: 'cat1',
          quantity: 20,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('updated-product');
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

        await updateProductController(req, res);

        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            name: 'Updated Product',
            description: 'Updated Description',
            price: 150,
            slug: 'updated-product',
          }),
          { new: true }
        );
        expect(mockProduct.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Product Updated Successfully',
          products: mockProduct,
        });
      });

			it('should update product successfully with photo', async () => {
				const mockPhotoBuffer = Buffer.from('updated-image-data');
        const mockProduct = {
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

        req.params.pid = '1';
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
            path: '/updated/path.jpg',
            type: 'image/jpeg',
            size: 500000,
          },
        };

        slugify.mockReturnValue('updated-product');
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);
        fs.readFileSync.mockReturnValue(mockPhotoBuffer);

        await updateProductController(req, res);

        expect(fs.readFileSync).toHaveBeenCalledWith('/updated/path.jpg');
        expect(mockProduct.photo.data).toBe(mockPhotoBuffer);
        expect(mockProduct.photo.contentType).toBe('image/jpeg');
				expect(mockProduct.save).toHaveBeenCalled();
				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: mockProduct,
				});
			});
		});

		// ============ INPUT VALIDATION =============
		describe('Input Validation', () => {
			it('should reject update when name is missing', async () => {
				req.params.pid = '1';
				req.fields = {
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: 'Name is Required' });
			});

			it('should reject when description is missing', async () => {
        req.params.pid = '1';
        req.fields = {
          name: 'Test Product',
          price: 100,
          category: 'cat1',
          quantity: 10,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Description is Required' });
      });

			it('should reject when price is missing', async () => {
				req.params.pid = '1';
				req.fields = {
					name: 'Updated Product',
					description: 'Updated Description',
					category: 'cat1',
					quantity: 20,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: 'Price is Required and should be greater than or equal to 0' });
			});

			it('should reject when category is missing', async () => {
        req.params.pid = '1';
        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          quantity: 10,
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Category is Required' });
      });

			it('should reject when quantity is missing', async () => {
        req.params.pid = '1';
        req.fields = {
          name: 'Test Product',
          description: 'Test Description',
          price: 100,
          category: 'cat1',
        };
        req.files = {};

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({ error: 'Quantity is Required and should be greater than or equal to 0' });
      });
		});

		// ============ BOUNDARY VALUE ANALYSIS - Photo size ============
		describe('Boundary Value Analysis - Photo Size', () => {
			it('should accept photo at maximum boundary (exactly 1MB)', async () => {
				req.params.pid = '1';
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
						size: 1000000, // 1MB
					},
				};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});

			it('should reject photo just above maximum boundary (1MB + 1 byte)', async () => {
				req.params.pid = '1';
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

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: "Photo is Required and should be less than 1mb" });
			});

			it('should accept small photo (just below boundary)', async () => {
				req.params.pid = '1';
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
						size: 999999, // just below 1MB
					},
				};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});
		});

		// ============ Boundary Value Analysis - Price ============
		describe('Boundary Value Analysis - Price', () => {
			it('should allow update of product with free price (price = 0)', async () => {
				req.params.pid = '1';
				req.fields = {
					name: 'Free Product',
					description: 'Updated Description',
					price: 0,
					category: 'cat1',
					quantity: 20,
					shipping: true,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});

			it('should create product with normal price (price = 1)', async () => {
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
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});
			
			it('should not allow update of product with negative price (price = -1)', async () => {
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

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: "Price is Required and should be greater than or equal to 0" });
			});
		});

		// ============ Boundary Value Analysis - Quantity ============
		describe('Boundary Value Analysis - Quantity', () => {
			it('should update product with zero quantity (quantity = 0)', async () => {
				req.params.pid = '1';
				req.fields = {
					name: 'Out of Stock',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 0,
					shipping: true,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});

			it('should update product with quantity 1 (quantity = 1)', async () => {
				req.params.pid = '1';
				req.fields = {
					name: 'Low Stock',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 1,
					shipping: true,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(201);
				expect(res.send).toHaveBeenCalledWith({
					success: true,
					message: 'Product Updated Successfully',
					products: expect.any(Object),
				});
			});

			it('should not allow update of product with invalid quantity (quantity = -1)', async () => {
				req.params.pid = '1';
				req.fields = {
					name: 'High Stock',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: -1,
					shipping: true,
				};
				req.files = {};

				await updateProductController(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required and should be greater than or equal to 0" });
			});
		});

		// ============ ERROR HANDLING ============
		describe('Error Handling', () => {
			it('should handle product update error', async () => {
				const mockError = new Error('Database update failed');

				req.params.pid = '1';
				req.fields = {
					name: 'Updated Product',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
				};
				req.files = {};

				productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

				const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

				await updateProductController(req, res);

				expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
				expect(res.status).toHaveBeenCalledWith(500);
				expect(res.send.mock.calls[0][0].success).toBe(false);
				expect(res.send.mock.calls[0][0].message).toBe('Error in Update product');
				consoleLogSpy.mockRestore();
			});

      it('should handle file read error during update', async () => {
        const mockError = new Error('File read failed');

        req.params.pid = '1';
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
            path: 'path/to/photo.jpg',
            type: 'image/jpeg',
          },
        };

        fs.readFileSync = jest.fn().mockImplementation(() => {
          throw mockError;
        });

        // Mock findByIdAndUpdate to return a valid product so file read is attempted
        const mockProduct = {
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
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await updateProductController(req, res);

        expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send.mock.calls[0][0].success).toBe(false);
        expect(res.send.mock.calls[0][0].message).toBe('Error in Update product');
        consoleLogSpy.mockRestore();
      });

			it('should handle product not found error', async () => {
        const mockError = new Error('Product not found');

        req.params.pid = 'invalid-id';
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
        productModel.findByIdAndUpdate = jest.fn().mockRejectedValue(mockError);

        const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

        await updateProductController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send.mock.calls[0][0].success).toBe(false);

        consoleLogSpy.mockRestore();
      });
		});

		// ============ SIDE EFFECTS ============
		describe('Side Effects', () => {
			it('should create slug from updated product name', async () => {
				const mockProduct = {
					_id: '1',
					name: 'Updated Product Name',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
					slug: 'updated-product-name',
					photo: {},
					save: jest.fn().mockResolvedValue(true),
				};

				req.params.pid = '1';
				req.fields = {
					name: 'Updated Product Name',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
				};
				req.files = {};

				slugify.mockReturnValue('updated-product-name');
				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

				await updateProductController(req, res);

				expect(slugify).toHaveBeenCalledWith('Updated Product Name');
			});

			it('should read file when updated photo is provided', async () => {
				const mockPhotoBuffer = Buffer.from('new-image-data');
				const mockProduct = {
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

				req.params.pid = '1';
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
						path: 'path/to/photo.jpg',
						type: 'image/jpeg',
					},
				};

				fs.readFileSync = jest.fn().mockImplementation(() => {
					return mockPhotoBuffer;
				});

				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

				await updateProductController(req, res);

				expect(fs.readFileSync).toHaveBeenCalledWith('path/to/photo.jpg');
			});

			it('should not read file when updated photo is not provided', async () => {
				const mockProduct = {
					_id: '1',
					name: 'Updated Product',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
					slug: 'updated-product',
					photo: {},
					save: jest.fn().mockResolvedValue(true),
				};

				req.params.pid = '1';
				req.fields = {
					name: 'Updated Product',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
				};
				req.files = {};

				fs.readFileSync = jest.fn();

				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

				await updateProductController(req, res);

				expect(fs.readFileSync).not.toHaveBeenCalled();
			});

			it('should call product save method after update', async () => {
				const mockProduct = {
					_id: '1',
					name: 'Updated Product',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
					slug: 'updated-product',
					photo: {},
					save: jest.fn().mockResolvedValue(true),
				};

				req.params.pid = '1';
				req.fields = {
					name: 'Updated Product',
					description: 'Updated Description',
					price: 150,
					category: 'cat1',
					quantity: 20,
					shipping: true,
				};
				req.files = {};

				productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

				await updateProductController(req, res);

				expect(mockProduct.save).toHaveBeenCalled();
			});

			it('should call findByIdAndUpdate with correct parameters', async () => {
        const mockProduct = {
          _id: '1',
          name: 'Updated',
          description: 'Updated Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
          slug: 'updated',
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        req.params.pid = '1';
        req.fields = {
          name: 'Updated',
          description: 'Updated Description',
          price: 100,
          category: 'cat1',
          quantity: 10,
          shipping: true,
        };
        req.files = {};

        slugify.mockReturnValue('updated');
        productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(mockProduct);

        await updateProductController(req, res);

        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            name: 'Updated',
            description: 'Updated Description',
            price: 100,
            slug: 'updated',
          }),
          { new: true }
        );
      });
		});
	});
});