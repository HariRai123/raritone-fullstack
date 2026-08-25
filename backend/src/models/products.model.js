const mongoose = require("mongoose");

const productSchema=new mongoose.Schema({
    productId:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    name:{
        type:String,
        required:true,
        trim:true,
    },
    category:{
        type:String,
        required:true,
        trim:true,
    },
    price:{
        type:Number,
        required:true,
        min:0,
    },
    description:{
        type:String,
        required:true,
        trim:true,
    },
    image:{
        type:String,
        required:true,
    },
    brand:{
        type:String,
        required:true,
        trim:true,
    },
    stock:{
        type:Number,
        required:true,
        min:0,
        default:0
    }
},{timestamps:true}
);

const Product= mongoose.model("Product",productSchema);

module.exports=Product;