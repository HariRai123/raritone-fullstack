require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../src/models/products.model");

async function migrateProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    const products = await Product.find();

    console.log(`Found ${products.length} products`);

    let updated = 0;
    let skipped = 0;
    let manual = 0;

    for (const product of products) {
      const oldCategory = String(product.category || "")
        .trim()
        .toLowerCase();

      let gender = product.gender;
      let category = product.category;
      let subcategory = product.subcategory;

      if (
        product.gender &&
        product.subcategory &&
        ["Clothing", "Footwear", "Accessories"].includes(
          product.category
        )
      ) {
        skipped++;
        continue;
      }

      if (oldCategory === "mens-tshirts") {
        gender = "Men";
        category = "Clothing";
        subcategory = "T-Shirts";
      } else if (oldCategory === "mens-shirts") {
        gender = "Men";
        category = "Clothing";
        subcategory = "Shirts";
      } else if (oldCategory === "mens-jeans") {
        gender = "Men";
        category = "Clothing";
        subcategory = "Jeans";
      } else if (oldCategory === "women's-tops") {
        gender = "Women";
        category = "Clothing";
        subcategory = "Tops";
      } else if (oldCategory === "women - bottoms") {
        gender = "Women";
        category = "Clothing";
        subcategory = "Jeans";
      } else if (oldCategory === "women - dresses") {
        gender = "Women";
        category = "Clothing";
        subcategory = "Dresses";
      } else if (oldCategory === "shoes") {
        gender = "Unisex";
        category = "Footwear";
        subcategory = "Sneakers";
      } else if (oldCategory === "accessories") {
        if (
          String(product.name || "")
            .toLowerCase()
            .includes("watch")
        ) {
          gender = product.gender || "Unisex";
          category = "Accessories";
          subcategory = "Watches";
        } else if (
          String(product.name || "")
            .toLowerCase()
            .includes("sunglass")
        ) {
          gender = product.gender || "Unisex";
          category = "Accessories";
          subcategory = "Glasses";
        } else if (
          String(product.name || "")
            .toLowerCase()
            .includes("glass")
        ) {
          gender = product.gender || "Unisex";
          category = "Accessories";
          subcategory = "Glasses";
        } else {
          console.log(
            `MANUAL REVIEW: ${product.productId} | ${product.name}`
          );

          manual++;
          continue;
        }
      } else {
        console.log(
          `MANUAL REVIEW: ${product.productId} | ${product.name} | ${product.category}`
        );

        manual++;
        continue;
      }

      product.gender = gender;
      product.category = category;
      product.subcategory = subcategory;

      if (
        product.discount === undefined ||
        product.discount === null
      ) {
        product.discount = 0;
      }

      await product.save();

      updated++;

      console.log(
        `Updated: ${product.productId} | ${product.name} → ${gender} → ${category} → ${subcategory}`
      );
    }

    console.log("");
    console.log("========== MIGRATION COMPLETE ==========");
    console.log(`Updated : ${updated}`);
    console.log(`Skipped : ${skipped}`);
    console.log(`Manual  : ${manual}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);

    try {
      await mongoose.disconnect();
    } catch {}

    process.exit(1);
  }
}

migrateProducts();