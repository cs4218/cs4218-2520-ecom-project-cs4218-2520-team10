// Shared DB seed helper for E2E tests - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// Usage: call seedDatabase() in test.beforeAll to wipe and restore the test DB

import { MongoClient } from "mongodb";
import { EJSON } from "bson";
import { readFileSync } from "fs";
import { resolve } from "path";
import dotenv from "dotenv";

// Load MONGO_URL from the root .env
dotenv.config({ path: resolve(__dirname, "../../../.env") });

const DB_NAME = "test";
const SCHEMA_DIR = resolve(__dirname, "../../../sample-db-schema");

const COLLECTIONS = [
  { name: "categories", file: "test.categories.json" },
  { name: "products", file: "test.products.json" },
  { name: "users", file: "test.users.json" },
  { name: "orders", file: "test.orders.json" },
];

export async function seedDatabase() {
  const client = new MongoClient(process.env.MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    for (const { name, file } of COLLECTIONS) {
      const raw = readFileSync(resolve(SCHEMA_DIR, file), "utf-8");
      const docs = EJSON.parse(raw);
      const col = db.collection(name);
      await col.deleteMany({}, { writeConcern: { w: 'majority' } });
      if (docs.length > 0) {
        await col.insertMany(docs);
      }
    }
  } finally {
    await client.close();
  }
}
