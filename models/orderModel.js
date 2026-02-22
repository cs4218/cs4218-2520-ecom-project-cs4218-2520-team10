import mongoose from "mongoose";
import { ORDER_STATUS_LIST, DEFAULT_ORDER_STATUS } from "../client/src/constants/orderStatus.js";

// Refactoring: Update status field to use enum for better data integrity - YAN WEIDONG A0258151H
const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
    payment: {},
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
    },
    status: {
      type: String,
      default: DEFAULT_ORDER_STATUS,
      enum: ORDER_STATUS_LIST,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);