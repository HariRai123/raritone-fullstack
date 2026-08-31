const { NodeIO } = require("@gltf-transform/core");
const {
  EXTTextureWebP,
  KHRMaterialsSpecular,
  KHRDracoMeshCompression,
} = require("@gltf-transform/extensions");
const draco3d = require("draco3dgltf");

let ioPromise;

async function getIO() {
  if (!ioPromise) {
    ioPromise = (async () => {
      const decoderModule =
        await draco3d.createDecoderModule();

      return new NodeIO()
        .registerExtensions([
          EXTTextureWebP,
          KHRMaterialsSpecular,
          KHRDracoMeshCompression,
        ])
        .registerDependencies({
          "draco3d.decoder": decoderModule,
        });
    })();
  }

  return ioPromise;
}

async function validateThreeDAsset(buffer, format) {
  if (!buffer || !buffer.length) {
    throw new Error("3D asset file is empty.");
  }

  if (!["glb", "gltf"].includes(format)) {
    throw new Error("Unsupported 3D asset format.");
  }

  try {
    if (format !== "glb") {
      throw new Error(
        "GLTF files with external resources are not supported through the current upload system. Please upload the GLB version.",
      );
    }

    const io = await getIO();
    const document = await io.readBinary(buffer);

    const root = document.getRoot();
    const meshes = root.listMeshes();

    if (!meshes.length) {
      throw new Error(
        "3D asset does not contain any mesh.",
      );
    }

    let polygonCount = 0;

    for (const mesh of meshes) {
      for (const primitive of mesh.listPrimitives()) {
        const indices = primitive.getIndices();

        if (indices) {
          polygonCount += Math.floor(
            indices.getCount() / 3,
          );
        } else {
          const position =
            primitive.getAttribute("POSITION");

          if (position) {
            polygonCount += Math.floor(
              position.getCount() / 3,
            );
          }
        }
      }
    }

    return {
      valid: true,
      polygonCount,
      meshCount: meshes.length,
    };
  } catch (error) {
    console.error(
      "3D VALIDATION ERROR:",
      error.message,
    );

    throw new Error(
      error.message || "Invalid 3D asset.",
    );
  }
}

function getAssetFormat(filename) {
  if (!filename) {
    return null;
  }

  const extension = filename
    .split(".")
    .pop()
    .toLowerCase();

  if (extension === "glb") {
    return "glb";
  }

  if (extension === "gltf") {
    return "gltf";
  }

  return null;
}

module.exports = {
  validateThreeDAsset,
  getAssetFormat,
};