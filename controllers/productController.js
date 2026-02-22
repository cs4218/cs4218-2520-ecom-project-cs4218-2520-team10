import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import { error } from "console";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    // Validation
    switch (true) {
      case !name:
        // Bug fix: Changed status code from 500 to 422 for validation error - Ong Chang Heng Bertrand A0253013X
        // Bug fix: Added success: false and changed error field to message for consistency in error response structure - Ong Chang Heng Bertrand A0253013X
        return res.status(422).send({ success: false, message: "Name is required" });
      case !description:
        return res.status(422).send({ success: false, message: "Description is required" });
      case price === undefined || price === null || price === "" || price < 0: // Bug fix from "!price" - Ong Chang Heng Bertrand A0253013X
        return res.status(422).send({ success: false, message: "Price is required and should be greater than or equal to 0" });
      case !category:
        return res.status(422).send({ success: false, message: "Category is required" });
      case quantity === undefined || quantity === null || quantity === ""|| quantity < 0: // Bug fix from "!quantity" - Ong Chang Heng Bertrand A0253013X
        return res.status(422).send({ success: false, message: "Quantity is required and should be greater than or equal to 0" });
      case photo && photo.size > 1000000:
        return res
          .status(422)
          .send({ success: false, message: "Photo should be less than 1mb" });
      // Bug fix: Added validation for shipping field - Ong Chang Heng Bertrand A0253013X
      case shipping === undefined || shipping === null || shipping === "":
        return res.status(422).send({ success: false, message: "Shipping is required" });
    }

    // Bug fix: Added check for existing product with the same slug to prevent duplicates - Ong Chang Heng Bertrand A0253013X
    const slug = slugify(name);
    const existingProduct = await productModel.findOne({ slug });
    if (existingProduct) {
      return res.status(409).send({ success: false, message: "Product with this name already exists" });
    }

    const products = new productModel({ ...req.fields, slug: slug });
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(201).send({
      success: true,
      message: "Product created successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All products fetched",
      products,
    });
  } catch (error) {
    console.log(error);
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};

// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");
    // Bug fix: Added check for product existence and return 404 if not found - Ong Chang Heng Bertrand A0253013X
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product,
    });
  } catch (error) {
    console.log(error);
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Erorr while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    const deletedProduct = await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    // Bug fix: Added check for product existence and return 404 if not found - Ong Chang Heng Bertrand A0253013X
    if (!deletedProduct) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }
    return res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.log(error);
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//update products
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //Validation
    switch (true) {
      // Bug fix: Changed return status code from 500 to 422 for validation errors - Ong Chang Heng Bertrand A0253013X
      // Bug fix: Added success: false and changed error field to message for consistency in error response structure - Ong Chang Heng Bertrand A0253013X
      case !name:
        return res.status(422).send({ success: false, message: "Name is required" });
      case !description:
        return res.status(422).send({ success: false, message: "Description is required" });
      case price === undefined || price === null || price === "" || price < 0: // Bug fix from "!price" - Ong Chang Heng Bertrand A0253013X
        return res.status(422).send({ success: false, message: "Price is required and should be greater than or equal to 0" });
      case !category:
        return res.status(422).send({ success: false, message: "Category is required" });
      case quantity === undefined || quantity === null || quantity === ""|| quantity < 0: // Bug fix from "!quantity" - Ong Chang Heng Bertrand A0253013X
        return res.status(422).send({ success: false, message: "Quantity is required and should be greater than or equal to 0" });
      case photo && photo.size > 1000000:
        return res
          .status(422)
          .send({ success: false, message: "Photo should be less than 1mb" });
      // Bug fix: Added validation for shipping field - Ong Chang Heng Bertrand A0253013X
      case shipping === undefined || shipping === null || shipping === "":
        return res.status(422).send({ success: false, message: "Shipping is required" });
    }

    // Bug fix: Added check for existing product with the same slug to prevent duplicates - Ong Chang Heng Bertrand A0253013X
    const slug = slugify(name);
    const existingProduct = await productModel.findOne({ slug, _id: { $ne: req.params.pid } });
    if (existingProduct) {
      return res.status(409).send({ success: false, message: "Another product with this name already exists" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true },
    );

    // Bug fix: Added check for product existence and return 404 if not found - Ong Chang Heng Bertrand A0253013X
    if (!products) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(201).send({
      success: true,
      message: "Product updated successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    // Bug fix: Added 'return' keyword - Ong Chang Heng Bertrand A0253013X
    return res.status(500).send({
      success: false,
      error,
      message: "Error in updating product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const resutls = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");
    res.json(resutls);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(3)
      .populate("category");
    res.status(200).send({
      success: true,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while geting related product",
      error,
    });
  }
};

// get prdocyst by catgory
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({
      success: true,
      category,
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      // Refactor: Delegate error handling to outer try-catch
      // for better readability and maintainability - YAN WEIDONG A0258151H
      if (err) {
        throw err;
      }

      res.send(response);
    });
  } catch (error) {
    console.log(error);
    // Fix: Add error details to response for better debugging - YAN WEIDONG A0258151H
    res.status(500).send({
      success: false,
      message: "Error generating payment token",
      error,
    });
  }
};

//payment
// Refactor: Update function name to match with module naming convention - YAN WEIDONG A0258151H
export const braintreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;

    // Fix: Add validation for nonce and cart to input validation - YAN WEIDONG A0258151H
    if (!nonce) {
      return res.status(400).send({
        success: false,
        message: "Payment nonce is required",
      });
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Cart is required and must not be empty",
      });
    }

    // Refactor: Use reduce for calculating total and add validation for price - YAN WEIDONG A0258151H
    let total = cart.reduce((sum, item) => {
      // Fix: Check for number type and non-negative instead of falsy check
      // This allows price = 0 (free items) but rejects undefined, null, strings, and negative values
      if (typeof item.price !== "number" || isNaN(item.price) || item.price < 0) {
        throw new Error("Invalid price in cart item");
      }
      return sum + item.price;
    }, 0);

    // Refactor: Use Promise-based approach to improve readability - YAN WEIDONG A0258151H
    const result = await new Promise((resolve, reject) => {
      gateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: {
            submitForSettlement: true,
          },
        },
        (error, result) => {
          if (error) reject(error);
          else if (result.success) resolve(result);
          else reject(new Error(result.message));
        },
      );
    });

    // Save order with proper await
    const order = await new orderModel({
      products: cart,
      payment: result,
      buyer: req.user._id,
    }).save();

    res.json({ ok: true, order });
  } catch (error) {
    console.log(error);
    // Fix: Add error details to response for better debugging - YAN WEIDONG A0258151H
    res.status(500).send({
      success: false,
      message: "Error Processing Payment",
      error,
    });
  }
};
