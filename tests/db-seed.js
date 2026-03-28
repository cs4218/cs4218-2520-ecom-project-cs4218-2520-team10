// Shared DB seed helper for E2E tests - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
// Usage: Call `npm run test:seed` to seed the test database with the default product dataset (2 products).
// To seed with the larger spike test dataset (50+ products), set the environment variable `USE_SPIKE_DATA=true` before running the test command.

import { MongoClient } from "mongodb";
import { EJSON } from "bson";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, "../.env") });

const DB_NAME = "test";
const SCHEMA_DIR = resolve(__dirname, "../sample-db-schema");

// Flag to determine which product dataset to use
// Set via environment variable: USE_SPIKE_DATA=true
const USE_SPIKE_DATA = process.env.USE_SPIKE_DATA === 'true';

const COLLECTIONS = [
  { name: "categories", file: "test.categories.json" },
  { 
    name: "products", 
    file: USE_SPIKE_DATA ? "test.products.spike-test.json" : "test.products.json" 
  },
  { name: "users", file: "test.users.json" },
  { name: "orders", file: "test.orders.json" },
];

export async function seedSpikeDatabase() {
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

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSpikeDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
