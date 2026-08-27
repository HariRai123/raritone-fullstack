const multer = require("multer");

const MAX_FILE_SIZE=25*1024*1024;

const upload=multer({
    storage:multer.memoryStorage(),
    limits:{
        fileSize:MAX_FILE_SIZE,
        files:1
    },

fileFilter:(req,file,cb)=>{
    const allowedMimeTypes=[
        "model/gltf-binary",
        "model/gltf+json",
        "application/octet-stream",
    ];

    const extension=file.originalname.split(".").pop().toLowerCase();

    const validExtension=["glb","gltf"].includes(extension);
    const validMimeType=allowedMimeTypes.includes(file.mimetype);

    if(!validExtension || !validMimeType){
        return cb(
            new Error("Only valid GLB or GLTF 3D assets are allowed."),
        );
    }
    cb(null,true);
},
})

function handleThreeDAssetUpload(req,res,next){
    upload.single("asset")(req,res,(error)=>{
        if(error instanceof multer.MulterError){
            if(error.code==="LIMIT_FILE_SIZE"){
                return res.status(400).json({
                    success:false,
                    error:{
                        code:"ASSET_TOO_LARGE",
                        message:"3D asset must be smaller than 50MB"
                    }
                })
            }
            return res.status(400).json({
                success:false,
                error:{
                    code:"ASSET_UPLOAD_FAILED",
                    message:error.message
                }
            })
        }
        if(error){
            return res.status(400).json({
                success:false,
                error:{
                    code:"INVALID_3D_ASSET",
                    message:error.message
                }
            })
        }
        next();
    })
}

module.exports=handleThreeDAssetUpload;
