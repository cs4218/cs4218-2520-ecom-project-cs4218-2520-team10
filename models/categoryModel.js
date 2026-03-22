import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // Bug fix: enforce required constraint at schema level - Shaun Lee Xuan Wei A0252626E
    unique: true, // Bug fix: enforce unique constraint at schema level to prevent race condition duplicates - Shaun Lee Xuan Wei A0252626E
  },
  slug: {
    type: String,
    lowercase: true,
  },
});

export default mongoose.model("Category", categorySchema);