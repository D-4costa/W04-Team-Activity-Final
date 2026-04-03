const { MongoClient } = require("mongodb");

let client;
let db;

const connectToDatabase = async () => {
  if (db) {
    return db;
  }

  const { MONGODB_URI, MONGODB_DB_NAME } = process.env;

  if (!MONGODB_URI || !MONGODB_DB_NAME) {
    throw new Error("MONGODB_URI and MONGODB_DB_NAME are required in .env");
  }

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db(MONGODB_DB_NAME);

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true, sparse: true }),
    db.collection("habits").createIndex({ userId: 1 }),
    db.collection("records").createIndex({ userId: 1 }),
    db.collection("records").createIndex({ habitId: 1 }),
    db.collection("streaks").createIndex({ userId: 1 }),
    db.collection("streaks").createIndex({ userId: 1, habitId: 1 }, { unique: true }),
  ]);

  console.log("Connected to MongoDB");
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error("Database is not connected. Start the server first.");
  }

  return db;
};

const closeDatabase = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
};

module.exports = {
  connectToDatabase,
  getDb,
  closeDatabase,
};
