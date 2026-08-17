import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { analyzeTryOn } from "../services/tryonService";
import { useAuth } from "../context/AuthContext";
import { getProducts } from "../services/productService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

function TryOn() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedProductId = searchParams.get("product");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Stop camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCameraLoading(false);
  };

  // Validate image dimensions
  const validateImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(imageUrl);

        if (image.width < 300 || image.height < 300) {
          reject(
            new Error(
              "Image is too small. Please upload an image at least 300 × 300 pixels.",
            ),
          );
          return;
        }

        resolve(true);
      };

      image.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error("Unable to read the image."));
      };

      image.src = imageUrl;
    });
  };

  // Process selected/captured image
  const processImage = async (file) => {
    setError("");
    setResult(null);

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a JPG, JPEG, or PNG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    try {
      await validateImageDimensions(file);

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      const imagePreview = URL.createObjectURL(file);

      setSelectedFile(file);
      setPreview(imagePreview);
    } catch (err) {
      setError(err.message || "Invalid image.");
    }
  };

  // Upload image
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await processImage(file);

    event.target.value = "";
  };

  // Open camera
  const openCamera = async () => {
    setError("");
    setResult(null);
    setCameraLoading(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access is not supported by this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: {
            ideal: "environment",
          },
          width: {
            ideal: 1280,
          },
          height: {
            ideal: 720,
          },
        },
        audio: false,
      });

      streamRef.current = stream;

      setCameraOpen(true);

      // Wait for video element to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current.play().catch((err) => {
            console.error("Camera playback error:", err);
          });
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission was denied. Please allow camera access in your browser.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera was found on this device.");
      } else {
        setError(err.message || "Unable to access the camera.");
      }

      setCameraOpen(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video) {
      setError("Camera is not ready.");
      return;
    }

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera is still loading. Please try again.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture camera image.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Unable to capture image."));
            }
          },
          "image/jpeg",
          0.9,
        );
      });

      const file = new File([blob], `try-on-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      stopCamera();

      await processImage(file);
    } catch (err) {
      console.error("Capture error:", err);

      setError(err.message || "Unable to capture the image.");
    }
  };

  // Load products after a successful analysis so the user can
  // continue from body analysis to product selection.
  useEffect(() => {
    if (!result || !isAuthenticated) {
      return;
    }

    let mounted = true;

    const loadProducts = async () => {
      try {
        setProductsLoading(true);

        const productList = await getProducts();

        if (!mounted) return;

        setProducts(productList);

        if (requestedProductId) {
          const requestedProduct = productList.find(
            (product) => product._id === requestedProductId,
          );

          if (requestedProduct) {
            setSelectedProduct(requestedProduct);
          }
        }
      } catch (error) {
        console.error("Product selection load error:", error);
      } finally {
        if (mounted) {
          setProductsLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      mounted = false;
    };
  }, [result, isAuthenticated, requestedProductId]);

  // Remove selected image
  const handleRemoveImage = () => {
    stopCamera();

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setSelectedFile(null);
    setPreview("");
    setResult(null);
    setSelectedProduct(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Analyze image
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please upload or capture an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const data = await analyzeTryOn(selectedFile);

      setResult(data);
    } catch (err) {
      console.error("Try-on analysis error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to analyze the image. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="simple-page app-page try-on-page">
      {/* Header */}
      <div className="try-on-header">
        <span className="eyebrow">AI TRY-ON STUDIO</span>

        <h1>Try On Studio</h1>

        <p>
          Upload a clear full-body photo and let our AI analyze your pose and
          body measurements.
        </p>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Upload / Camera Section */}
      {!preview && !loading && !result && !cameraOpen && (
        <div className="try-on-upload-panel">
          <div className="upload-icon">◎</div>

          <h2>Upload your photo</h2>

          <p>
            Use a clear full-body image with good lighting for better analysis.
          </p>

          <div className="try-on-actions">
            {/* Upload */}
            <label className="primary-button upload-button">
              Upload Image
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileChange}
                hidden
              />
            </label>

            {/* Camera */}
            <button
              type="button"
              className="secondary-button camera-button"
              onClick={openCamera}
              disabled={cameraLoading}
            >
              {cameraLoading ? "Opening Camera..." : "📷 Camera"}
            </button>
          </div>

          <small>JPG, JPEG or PNG · Maximum 10 MB</small>
        </div>
      )}

      {/* Live Camera */}
      {cameraOpen && !loading && (
        <div className="camera-panel">
          <div className="camera-header">
            <h2>Take a Photo</h2>

            <button type="button" className="danger-text" onClick={stopCamera}>
              Close Camera
            </button>
          </div>

          <div className="camera-preview-wrapper">
            <video
              ref={videoRef}
              className="camera-preview"
              autoPlay
              playsInline
              muted
            />

            <div className="camera-guide">
              <span>Position your full body inside the frame</span>
            </div>
          </div>

          <div className="camera-controls">
            <button
              type="button"
              className="capture-button"
              onClick={capturePhoto}
            >
              <span className="capture-icon">📷</span>
              Capture Photo
            </button>
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && !loading && !result && (
        <div className="try-on-workspace">
          <div className="try-on-preview-panel">
            <div className="try-on-preview-header">
              <h2>Your Photo</h2>

              <button
                type="button"
                className="danger-text"
                onClick={handleRemoveImage}
              >
                Remove
              </button>
            </div>

            <div className="try-on-image-wrapper">
              <img
                src={preview}
                alt="Selected try-on"
                className="try-on-preview"
              />
            </div>

            <div className="try-on-file-info">
              <strong>{selectedFile?.name}</strong>

              <span>
                {selectedFile
                  ? (selectedFile.size / (1024 * 1024)).toFixed(2)
                  : "0.00"}{" "}
                MB
              </span>
            </div>

            <button
              type="button"
              className="primary-button try-on-analyze-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              Continue & Analyze
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="try-on-loading">
          <div className="loading-spinner" />

          <h3>Analyzing your image...</h3>

          <p>
            Please wait while our AI analyzes your pose and body measurements.
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="try-on-result">
          <span className="eyebrow">ANALYSIS COMPLETE</span>

          <h2>AI Body Analysis</h2>

          <div className="analysis-status">
            <div>
              <span>{result?.result?.person_detected ? "✓" : "✕"}</span>

              <strong>Person Detected</strong>
            </div>

            <div>
              <span>{result?.result?.pose_analysis?.valid ? "✓" : "✕"}</span>

              <strong>Pose Analysis</strong>
            </div>

            <div>
              <span>{result?.result?.body_measurements ? "✓" : "✕"}</span>

              <strong>Body Analysis</strong>
            </div>
          </div>

          {/* Measurements */}
          <div className="measurement-grid">
            <div className="measurement-card">
              <span>Shoulder Ratio</span>

              <strong>
                {result?.result?.body_measurements?.shoulder_ratio ?? "--"}
              </strong>
            </div>

            <div className="measurement-card">
              <span>Hip Ratio</span>

              <strong>
                {result?.result?.body_measurements?.hip_ratio ?? "--"}
              </strong>
            </div>

            <div className="measurement-card">
              <span>Arm Ratio</span>

              <strong>
                {result?.result?.body_measurements?.arm_ratio ?? "--"}
              </strong>
            </div>

            <div className="measurement-card">
              <span>Leg Ratio</span>

              <strong>
                {result?.result?.body_measurements?.leg_ratio ?? "--"}
              </strong>
            </div>
          </div>

          {/* AI Details */}
          <div className="try-on-analysis-details">
            <p>
              <strong>Person Detected:</strong>{" "}
              {result?.result?.person_detected ? "Yes" : "No"}
            </p>

            <p>
              <strong>Pose Confidence:</strong>{" "}
              {result?.result?.pose_analysis?.confidence ?? "--"}
            </p>

            <p>
              <strong>Pose Status:</strong>{" "}
              {result?.result?.pose_analysis?.message ?? "--"}
            </p>

            <p>
              <strong>Model:</strong> {result?.result?.model_version ?? "--"}
            </p>

            <p>
              <strong>Processing Time:</strong>{" "}
              {result?.result?.processing_time != null
                ? `${result.result.processing_time} seconds`
                : "--"}
            </p>
          </div>

          {/* Product selection */}
          <div className="try-on-product-selection">
            <div className="try-on-product-selection-header">
              <div>
                <span className="eyebrow">NEXT STEP</span>

                <h3>Select a Product</h3>
              </div>

              {selectedProduct && (
                <span className="try-on-selected-label">
                  Selected: {selectedProduct.name}
                </span>
              )}
            </div>

            {productsLoading ? (
              <p className="try-on-product-status">
                Loading Raritone products...
              </p>
            ) : products.length === 0 ? (
              <p className="try-on-product-status">
                No products are available yet.
              </p>
            ) : (
              <div className="try-on-product-grid">
                {products.map((product) => {
                  const selected = selectedProduct?._id === product._id;

                  return (
                    <button
                      key={product._id}
                      type="button"
                      className={`try-on-product-card ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img src={product.image} alt={product.name} />

                      <span>{product.name}</span>

                      <small>₹{product.price}</small>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedProduct && (
              <div className="try-on-selected-product">
                <strong>{selectedProduct.name}</strong>

                <span>Product selected.</span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleRemoveImage}
          >
            Try Another Image
          </button>
        </div>
      )}
    </section>
  );
}

export default TryOn;
