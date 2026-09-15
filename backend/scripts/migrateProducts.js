const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const Product = require("../src/models/products.model");

async function migrateProducts() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in backend/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    const result = await Product.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log("Product migration completed.");
    console.log(`Matched products: ${result.matchedCount}`);
    console.log(`Modified products: ${result.modifiedCount}`);
  } catch (error) {
    console.error("PRODUCT MIGRATION ERROR:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
}

migrateProducts();