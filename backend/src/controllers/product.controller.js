const uploadFile = require("../services/storage.service");
const Product = require("../models/products.model");

function optimizeImageUrl(url) {
  return url;
}

function toCatalogProduct(product) {
  return {
    ...product,
    image: optimizeImageUrl(product.image),
  };
}

async function postProducts(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const {
      productId,
      name,
      gender,
      category,
      subcategory,
      price,
      description,
      brand,
      stock,
      discount,
    } = req.body;

    if (
      !productId ||
      !name ||
      !gender ||
      !category ||
      !subcategory ||
      price === undefined ||
      !description ||
      !brand
    ) {
      return res.status(400).json({
        success: false,
        message: "All product details are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Product Image is required",
      });
    }

    const imageResult = await uploadFile(req.file.buffer);

    const productData = {
      productId,
      name,
      gender,
      category,
      subcategory,
      price: Number(price),
      image: imageResult.url,
      description,
      brand,
      stock: Number(stock) || 0,
      discount: Number(discount) || 0,
    };

    if (req.user.role === "vendor") {
      productData.vendorId = req.user.id;
    }

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create the product",
      error: error.message,
    });
  }
}

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
    })
      .select(
        "productId name gender category subcategory price image brand stock discount createdAt"
      )
      .sort({ createdAt: -1 });

    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch products.",
    });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .select(
        "productId name gender category subcategory price image brand stock discount isActive createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET ADMIN PRODUCTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin products.",
    });
  }
};

async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.image = optimizeImageUrl(product.image);

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    const {
      productId,
      name,
      gender,
      category,
      subcategory,
      price,
      description,
      brand,
      stock,
      discount,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.productId = productId ?? product.productId;
    product.name = name ?? product.name;
    product.gender = gender ?? product.gender;
    product.category = category ?? product.category;
    product.subcategory = subcategory ?? product.subcategory;
    product.price = price !== undefined ? Number(price) : product.price;
    product.description = description ?? product.description;
    product.brand = brand ?? product.brand;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.discount =
      discount !== undefined ? Number(discount) : product.discount;

    if (req.file) {
      const imageResult = await uploadFile(req.file.buffer);
      product.image = imageResult.url;
    }

    const updatedProduct = await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      product,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
}

const archiveProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is already archived.",
      });
    }

    product.isActive = false;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product archived successfully.",
      product,
    });
  } catch (error) {
    console.error("ARCHIVE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to archive product.",
    });
  }
};

const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is already active.",
      });
    }

    product.isActive = true;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product restored successfully.",
      product,
    });
  } catch (error) {
    console.error("RESTORE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore product.",
    });
  }
};

module.exports = {
  postProducts,
  getProducts,
  getAdminProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct,
};