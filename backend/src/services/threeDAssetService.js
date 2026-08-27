const {NodeIO} = require("@gltf-transform/core");

const io= new NodeIO();

async function validateThreeDAsset(buffer,format){
    if(!buffer||!buffer.length){
        throw new Error("3D asset file is empty");
    }
    try {
        const document=format==="glb" ? await io.readBinary(buffer) : null;
        if(!document && format==="gltf"){
            throw new Error("GLTF assets must currently be uploaded as binary GLB files.")
        }
        const root=document.getRoot();

        const meshes=root.listMeshes();

        if(!meshes.length){
            throw new Error("3D asset does not contain any mesh .");
        }
        let polygonCount=0;

        for(const mesh of meshes)
        {
            for(const primitive of mesh.listPrimitives()){
                const indices= primitive.getIndices();
                if(indices){
                    polygonCount+=Math.floor(indices.getCount()/3);
                }
            }
        }
        return {
            valid:true,
            polygonCount,
            meshCount:meshes.length
        }
    } catch (error) {
        throw new Error(
            error.message || "Invalid 3D asset.",
        )
    }
}

function getAssetFormat(filename){
    const extension=filename.split(".").pop().toLowerCase();
    if(extension==="glb")
    {
        return "glb";
    }
    if(extension==="gltf"){
        return "gltf";
    }
    return null;
}
module.exports={validateThreeDAsset,getAssetFormat}