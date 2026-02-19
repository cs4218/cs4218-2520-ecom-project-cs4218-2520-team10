import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) { // Fix: add validation for whitespace only names - Shaun Lee Xuan Wei A0252626E
      return res.status(422).send({ // Fix: status 422 instead of 401 for invalid input - Shaun Lee Xuan Wei A0252626E
        success: false, // Fix: add success field for invalid input 422 status - Shaun Lee Xuan Wei A0252626E
        message: "Name is required"
      });
    }
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(200).send({
        success: true,
        message: "Category already exists", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
      });
    }
    const category = await new categoryModel({
      name,
      slug: slugify(name),
    }).save();
    res.status(201).send({
      success: true,
      message: "New category created", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error, // Fix: change typo "errro" to error - Shaun Lee Xuan Wei A0252626E
      message: "Error in category", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    });
  }
};

//update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
     // Fix: add validation for null name - Shaun Lee Xuan Wei A0252626E
     // Fix: add validation for empty string name - Shaun Lee Xuan Wei A0252626E
     // Fix: add validation for whitespace only name - Shaun Lee Xuan Wei A0252626E
    if (!name || !name.trim()) {
      return res.status(422).send({
        success: false,
        message: "Name is required"
      });
    }
    // Fix: add validation for duplicate name - Shaun Lee Xuan Wei A0252626E
    const existingCategory = await categoryModel.findOne({ name });
    if (existingCategory) {
      return res.status(422).send({
        success: false,
        message: "Category name already exists",
      });
    }
    // Fix: add validation for category id - Shaun Lee Xuan Wei A0252626E
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).send({
        success: false,
        message: "Invalid category id",
      });
    }
    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug: slugify(name) },
      { new: true }
    );
    // Fix: add validation for category id not found - Shaun Lee Xuan Wei A0252626E
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category id not found",
      });
    }
    // Minor fix: typo, message casing - Shaun Lee Xuan Wei A0252626E
    res.status(200).send({
      success: true,
      message: "Category updated successfully", // Fix: change field typo "messsage" to "message" - Shaun Lee Xuan Wei A0252626E
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating category",
    });
  }
};

// get all cat
export const categoryController = async (req, res) => { // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
  try {
    const category = await categoryModel.find({});
    res.status(200).send({
      success: true,
      message: "Get all categories list successfully", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// single category
export const singleCategoryController = async (req, res) => {
  try {
    const { slug } = req.params;
    // Fix: add validation for null slug - Shaun Lee Xuan Wei A0252626E
    // Fix: add validation for empty string slug - Shaun Lee Xuan Wei A0252626E
    // Fix: add validation for whitespace only slug - Shaun Lee Xuan Wei A0252626E
    if (!slug || !slug.trim()) {
      return res.status(422).send({
        success: false,
        message: "Slug is required"
      });
    }
    const category = await categoryModel.findOne({ slug });
    // Fix: add validation for slug not found - Shaun Lee Xuan Wei A0252626E
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Slug not found"
      });
    }
    res.status(200).send({
      success: true,
      message: "Get single category successfully", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while getting single category", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    });
  }
};

// delete category
export const deleteCategoryController = async (req, res) => { // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
  try {
    const { id } = req.params;
    const category = await categoryModel.findByIdAndDelete(id);
    // Fix: add validation for category id - Shaun Lee Xuan Wei A0252626E
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(422).send({
        success: false,
        message: "Invalid category id"
      });
    }
    // Fix: add validation for category id not found
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category id not found"
      });
    }
    res.status(200).send({
      success: true,
      message: "Category deleted successfully", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting category", // Minor fix: typo - Shaun Lee Xuan Wei A0252626E
      error,
    });
  }
};
