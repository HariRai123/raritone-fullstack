const mongoose=require("mongoose");

const tryOnSessionSchema= new mongoose.Schema(
  {
    userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"User",
      required:true,
    },
    productId :{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Product",
      required:true
   },
   inputImageReference:{
    type:String,
    required:true
   },
   resultImageReference:{
    type:String,
    default:null,
   },
   aiModelVersion:{
    type:String,
    default:"vton-v1",
   },
   status:{
    type:String,
    enum:["pending","processing","completed","failed"],
    default:"pending"
   },
   processingTime:{
    type:Number,
    dafault:null
   },
   personDetected:{
    type:Boolean,
    default:false
   },
   poseResult:{
    type:mongoose.Schema.Types.Mixed,
    default:{},
   },
   bodyMeasurements:{
    type:mongoose.Schema.Types.Mixed,
    default:{}
   },
   message:{
     type:String,
    default:"",
   },
   errorCode:{
     type:String,
    default:null,
   },
   errorMessage:{
     type:String,
    default:"",
   },
   retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps:true,
    collection:"tryOnSessions"
  }

)

tryOnSessionSchema.index({
  userId:1,
  createdAt:-1
})

module.exports=mongoose.model("TryOnSession",tryOnSessionSchema)