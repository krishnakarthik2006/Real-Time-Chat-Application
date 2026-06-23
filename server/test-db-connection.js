require("dotenv").config();
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/";
const dbName = process.env.MONGODB_DB_NAME || "Real_Time_Chat_Application";

async function testDatabaseConnection() {
  console.log("Testing MongoDB connection");
  console.log(`URI: ${uri}`);
  console.log(`Database: ${dbName}`);

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 10000,
    });

    const adminResult = await mongoose.connection.db.admin().ping();
    const collections = await mongoose.connection.db.listCollections().toArray();

    console.log("MongoDB ping:", adminResult.ok === 1 ? "ok" : adminResult);
    console.log(`Collections found: ${collections.length}`);

    collections.forEach((collection) => {
      console.log(`- ${collection.name}`);
    });
  } finally {
    await mongoose.disconnect();
  }
}

testDatabaseConnection().catch((error) => {
  console.error("MongoDB connection failed:");
  console.error(error.message);
  process.exit(1);
});
