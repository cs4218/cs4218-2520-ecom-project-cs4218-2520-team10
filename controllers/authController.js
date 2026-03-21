import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { ORDER_STATUS_LIST } from "../constants/orderStatus.js";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    //validations
    // Fix: Added 400 status code to validation errors - KIM SHI TONG A0265858J
    if (!name) {
      return res.status(400).send({ message: "Name is Required" });
    }
    if (!email) {
      return res.status(400).send({ message: "Email is Required" });
    }
    if (!password) {
      return res.status(400).send({ message: "Password is Required" });
    }
    if (!phone) {
      return res.status(400).send({ message: "Phone no is Required" });
    }
    if (!address) {
      return res.status(400).send({ message: "Address is Required" });
    }
    if (!answer) {
      return res.status(400).send({ message: "Answer is Required" });
    }
    //check user
    const exisitingUser = await userModel.findOne({ email });
    //exisiting user
    // Fix: Changed from 200 to 409 Conflict for duplicate email - KIM SHI TONG A0265858J
    if (exisitingUser) {
      return res.status(409).send({
        success: false,
        message: "Already Registered. Please Login",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Register Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Registration", // Fix: Corrected typo from "Errro in Registeration" - KIM SHI TONG A0265858J
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    // Fix: Changed from 404 to 400 for missing fields - KIM SHI TONG A0265858J
    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }
    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registered", //Fixed by Kim Shi Tong A0265858J
      });
    }
    const match = await comparePassword(password, user.password);
    // Fix: Changed from 200 to 401 for invalid password - KIM SHI TONG A0265858J
    if (!match) {
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "Login Successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in Login",
      error,
    });
  }
};

//forgotPasswordController
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    // Fix: Added return statements to validation checks - KIM SHI TONG A0265858J
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }
    if (!answer) {
      return res.status(400).send({ message: "Answer is required" });
    }
    if (!newPassword) {
      return res.status(400).send({ message: "New Password is required" });
    }
    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something Went Wrong",
      error,
    });
  }
};

//test controller
// Fix: Updated response format to include status codes and consistent structure - KIM SHI TONG A0265858J
export const testController = (req, res) => {
  try {
    res.status(200).send({
      success: true,
      message: "Protected Routes",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in test controller",
      error,
    });
  }
};

// Update profile
// note: email not used?
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    
    // Enhancement: Check if user exists - YAN WEIDONG A0258151H
    // Check if user exists
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    
    // Fix: Complete Password Length Validation with Status Code - YAN WEIDONG A0258151H
    // Fix2: Changed `password !== undefined` to `password` because the frontend
    // always sends password: "" (empty string) even when the user doesn't touch the
    // field. The original check treated "" as a real password attempt and rejected it
    // with 400, preventing users from updating name/phone/address without also
    // providing a password. This is expected since the backend never returns the
    // password field to the frontend (see loginController response, line 103-109),
    // so Profile.js always initialises password state as "". - KIM SHI TONG A0265858J
    if (password && password.length < 6) {
      return res.status(400).json({ error: "Password is required and 6 character long" });
    }
    
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated Successfully",
      updatedUser,
    });
  } catch (error) {
    // Fix: Updated Status Code + Error Message - YAN WEIDONG A0258151H
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updating Profile",
      error,
    });
  }
};

// Get Orders by User
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};

// Get All Orders (Admin Only)
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Getting Orders",
      error,
    });
  }
};

// Update status of the given order 
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Fix: Added Input Validation for orderId and status - YAN WEIDONG A0258151H
    // Validate orderId format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Order ID format. Please provide a valid ObjectId.",
      });
    }

    // Validate status value
    if (!status || !ORDER_STATUS_LIST.includes(status)) {
      return res.status(400).send({
        success: false,
        message: `Invalid or missing order status. Allowed values are: ${ORDER_STATUS_LIST.join(", ")}.`,
      });
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true } // Returns the modified document rather than the original
    );

    // Handle "Order Not Found"
    if (!updatedOrder) {
      return res.status(404).send({
        success: false,
        message: "Order not found with the provided ID.",
      });
    }

    res.status(200).send({
      success: true,
      message: "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "An error occurred while updating the order status.",
      error, // Fix: Send entire error object for better debugging - YAN WEIDONG A0258151H
    });
  }
};