import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    photo: {
      data: Buffer,
      contentType: String,
    },
    shipping: {
      type: Boolean,
      // Bug fix: Made shipping field required for consistency - Ong Chang Heng Bertrand A0253013X
      required: true,
    },
  },
  { timestamps: true }
);

// Added indexes on slug, category, price, and createdAt for improved query performance - Ong Chang Heng Bertrand A0253013X
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });

productSchema.index({ name: 'text', description: 'text' });

export default mongoose.model("Products", productSchema);