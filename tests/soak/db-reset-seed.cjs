const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');
const { readFileSync, existsSync } = require('fs');
const { resolve } = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: resolve(process.cwd(), '.env') });

const DB_NAME = process.env.SOAK_DB_NAME || 'test';
const MONGO_URL = process.env.MONGO_URL;
const ALLOW_DB_RESET = process.env.SOAK_ALLOW_DB_RESET === 'true';

const COLLECTIONS = [
  { name: 'categories', file: 'test.categories.json' },
  { name: 'products', file: 'test.products.json' },
  { name: 'users', file: 'test.users.json' },
  { name: 'orders', file: 'test.orders.json' },
];

function resolveSchemaDir() {
  const candidates = [
    resolve(process.cwd(), 'Sample DB Schema'),
    resolve(process.cwd(), 'sample db schema'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    'Cannot find sample schema directory. Expected "Sample DB Schema" or "sample db schema" in project root.'
  );
}

async function seedDatabase() {
  if (!ALLOW_DB_RESET) {
    throw new Error(
      'Refusing to reset DB. Set SOAK_ALLOW_DB_RESET=true to acknowledge destructive reset.'
    );
  }

  if (!MONGO_URL) {
    throw new Error('MONGO_URL is not set in environment/.env');
  }

  const schemaDir = resolveSchemaDir();
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    for (const { name, file } of COLLECTIONS) {
      const col = db.collection(name);
      const raw = readFileSync(resolve(schemaDir, file), 'utf-8');
      const docs = EJSON.parse(raw);

      await col.deleteMany({}, { writeConcern: { w: 'majority' } });
      if (Array.isArray(docs) && docs.length > 0) {
        await col.insertMany(docs, { ordered: true });
      }
    }
  } finally {
    await client.close();
  }
}

seedDatabase()
  .then(() => {
    console.log(`Database reset complete for ${DB_NAME}.`);
  })
  .catch((error) => {
    console.error('Database reset failed:', error.message);
    process.exit(1);
  });
