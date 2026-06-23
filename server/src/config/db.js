const mongoose = require("mongoose");
const env = require("./env");

async function initDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected: ${env.MONGODB_DB_NAME}`);
  return mongoose.connection;
}

function getConnection() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB connection has not been initialized.");
  }

  return mongoose.connection;
}

module.exports = {
  initDatabase,
  getConnection,
};
