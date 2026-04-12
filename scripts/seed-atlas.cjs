// Seed Atlas DB with Sample DB Schema files
// Drops existing collections and re-imports from JSON seed files

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error("Error: MONGO_URL environment variable is required.");
  console.error("Usage: MONGO_URL=mongodb+srv://... node scripts/seed-atlas.cjs");
  process.exit(1);
}
const SEED_DIR = path.join(__dirname, "..", "Sample DB Schema");

const COLLECTIONS = [
  { file: "test.categories.json", name: "categories" },
  { file: "test.products.json", name: "products" },
  { file: "test.users.json", name: "users" },
  { file: "test.orders.json", name: "orders" },
];

async function seed() {
  console.log("Connecting to Atlas...");
  await mongoose.connect(MONGO_URL);
  console.log("Connected.");

  const db = mongoose.connection.db;

  for (const col of COLLECTIONS) {
    const filePath = path.join(SEED_DIR, col.file);
    const raw = fs.readFileSync(filePath, "utf8");
    const docs = JSON.parse(raw);

    // Convert $oid and $date fields to proper BSON types
    const converted = docs.map((doc) => convertBsonTypes(doc));

    console.log(`Dropping ${col.name}...`);
    try {
      await db.collection(col.name).drop();
    } catch (e) {
      // Collection may not exist yet
    }

    console.log(`Inserting ${converted.length} docs into ${col.name}...`);
    await db.collection(col.name).insertMany(converted);
    console.log(`  Done: ${col.name}`);
  }

  console.log("\nSeed complete!");
  await mongoose.disconnect();
}

function convertBsonTypes(obj) {
  if (obj === null || typeof obj !== "object") return obj;

  if (obj.$oid) {
    return new mongoose.Types.ObjectId(obj.$oid);
  }
  if (obj.$date) {
    return new Date(obj.$date);
  }

  if (Array.isArray(obj)) {
    return obj.map(convertBsonTypes);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertBsonTypes(value);
  }
  return result;
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
