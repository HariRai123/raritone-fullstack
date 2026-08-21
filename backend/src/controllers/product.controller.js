const uploadFile = require("../services/storage.service");
const Product = require("../models/products.model");

function optimizeImageUrl(url) {
  // Return the original ImageKit URL.
  // The previous /tr:w-600,q-72,f-auto path format was generating
  // 404 responses for the current ImageKit URLs.
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
    const { productId, name, category, price, description, brand, stock } =
      req.body;
    if (!req.file) {
      return res.status(400).json({
        message: "Product Image is required",
      });
    }
    const imageResult = await uploadFile(req.file.buffer);
    const product = await Product.create({
      productId,
      name,
      category,
      price,
      image:imageResult.url,
      description,
      brand,
      stock,
    });
    res.status(201).json({
        message:"Product created successfully",
        product
    })
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Failed to create the product",
      error: error.message,
    });
  }
}

async function getProducts(req,res){

    try{
        res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
        const products= await Product.find()
        .select("productId name category price image brand stock createdAt")
        .sort({ createdAt: -1 })
        .lean();
      const catalogProducts = products.map(toCatalogProduct);
        res.status(200).json({
            message:"Products fetched successfully",
            products: catalogProducts
        })
    }
    catch(err)
    {
        console.log(err);
        res.status(500).json({
            message:"Failed to fetch products",
            error:err.message
        })
    }
}

async function getProductById(req,res){
    try {
        const {id}=req.params ;
        const product= await Product.findById(id);
        if(!product)
        {
            res.status(404).json({
                message:"Product not found"
            })
        }
      const responseProduct = product.toObject();
      responseProduct.image = optimizeImageUrl(responseProduct.image);
      return res.status(200).json({
        message:"Product fetched successfully",
        product: responseProduct
      })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message:"Failed to fetch products",
            error:error.message
        })
    }
}

async function updateProduct(req,res){
  try {
    const {id}=req.params;
     const { productId, name, category, price, description, brand, stock } =req.body;
     const product=await Product.findById(id);
     if(!product){
      return res.status(404).json({
        message:"Product not found"
      })
     }
    product.productId = productId ?? product.productId;
    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.price = price ?? product.price;
    product.description = description ?? product.description;
    product.brand = brand ?? product.brand;
    product.stock = stock ?? product.stock;
     if(req.file)
     {
      const imageResult=await uploadFile(req.file.buffer);
      product.image=imageResult.url;
     }
     const updatedProduct=await product.save();
     return res.status(200).json({
      message:"Product updated successfully",
      product:updatedProduct
     })
  } catch (error) {
     console.log(error);
        res.status(500).json({
            message:"Failed to update products",
            error:error.message
        })
  }
}

async function deleteProduct(req,res){
 try {
  const {id}= req.params;
  const product= await Product.findByIdAndDelete(id);
  if(!product)
  {
    return res.status(404).json({
      message:"Product not found"
    })
  }
  return res.status(200).json({
    message:"Product deleted successfully",
    product,
  })
 } catch (error) {
   console.log(error);
        res.status(500).json({
            message:"Failed to delete product",
            error:error.message
        })
 }
}

module.exports = { postProducts,getProducts,getProductById ,updateProduct,deleteProduct};
