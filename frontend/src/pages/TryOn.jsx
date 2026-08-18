import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { analyzeTryOn } from "../services/tryonService";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 4000;
const MAX_IMAGE_HEIGHT = 4000;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function formatMeasurement(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(6) : "--";
}

function formatProcessingTime(value) {
  if (value === null || value === undefined || value === "") return "--";
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(4)}s` : "--";
}

function TryOn() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: "/try-on" },
      });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const validateImage = (file) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);

        if (
          img.naturalWidth > MAX_IMAGE_WIDTH ||
          img.naturalHeight > MAX_IMAGE_HEIGHT
        ) {
          reject(
            `Image dimensions must not exceed ${MAX_IMAGE_WIDTH} × ${MAX_IMAGE_HEIGHT} pixels.`
          );
          return;
        }

        if (img.naturalWidth < 300 || img.naturalHeight < 400) {
          reject("Image must be at least 300 × 400 pixels.");
          return;
        }

        resolve(true);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject("Unable to read the selected image.");
      };

      img.src = url;
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");
    setResult(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPG, JPEG and PNG images are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      await validateImage(file);
    } catch (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    if (preview?.startsWith("blob:")) {
      URL.revokeObjectURL(preview);
    }

    setImage(null);
    setPreview("");
    setResult(null);
    setError("");
    setSuccess("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!image) {
      setError("Please upload an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setResult(null);

      const response = await analyzeTryOn(image);
      console.log("TRY-ON API RESPONSE:", response);

      if (!response?.result) {
        throw new Error("Invalid response received from server.");
      }

      setResult(response.result);
      setSuccess("Image analyzed successfully.");
    } catch (err) {
      console.error("Try-on analysis error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to analyze image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const measurements = result?.body_measurements || {};
  const pose = result?.pose_result || {};

  return (
    <section className="tryon-page app-page">
      <div className="tryon-header">
        <div>
          <span className="eyebrow">AI TRY-ON STUDIO</span>
          <h1>Try On Studio</h1>
          <p>
            Upload a clear full-body image and let our AI analyze your body proportions.
          </p>
        </div>

        <div className="tryon-history-header-actions">
          <Link to="/try-on/history" className="secondary-button">
            View History
          </Link>
          <Link to="/profile" className="secondary-button">
            Back to Profile
          </Link>
        </div>
      </div>

      <div className="tryon-layout">
        <div className="tryon-card">
          <div className="tryon-section-header">
            <div>
              <h2>Upload Your Photo</h2>
              <p>Use a clear full-body photo for better pose detection.</p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {preview ? (
            <div className="tryon-preview-container">
              <img
                src={preview}
                alt="Try-on preview"
                className="tryon-preview"
              />
              <button
                type="button"
                className="remove-image-button"
                onClick={handleRemoveImage}
                disabled={loading}
              >
                Remove Image
              </button>
            </div>
          ) : (
            <div className="tryon-upload-area">
              <div className="tryon-upload-icon">↑</div>
              <h3>Upload a full-body image</h3>
              <p>JPG or PNG · Maximum 10 MB · Maximum 4000 × 4000 px</p>

              <div className="tryon-upload-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Choose Image
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={loading}
                >
                  📷 Camera
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleImageChange}
                hidden
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handleImageChange}
                hidden
              />
            </div>
          )}

          {image && (
            <button
              type="button"
              className="primary-button tryon-analyze-button"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing Image..." : "Continue & Analyze"}
            </button>
          )}

          {loading && (
            <div className="tryon-loading">
              <div className="spinner" />
              <p>AI is analyzing your image...</p>
              <small>This may take a few seconds.</small>
            </div>
          )}
        </div>

        {result && (
          <div className="tryon-card tryon-result-card">
            <div className="tryon-section-header">
              <div>
                <span className="eyebrow">AI RESULT</span>
                <h2>Body Analysis</h2>
                <p>Your AI body-proportion analysis has completed.</p>
              </div>
            </div>

            <div className="analysis-status">
              <div className={result.person_detected ? "status-item status-success" : "status-item status-error"}>
                <span>{result.person_detected ? "✓" : "✕"}</span>
                <div>
                  <strong>Person Detected</strong>
                  <small>
                    {result.person_detected
                      ? "Person successfully detected."
                      : "No person detected. Please upload a clear full-body image."}
                  </small>
                </div>
              </div>

              <div className={pose.valid ? "status-item status-success" : "status-item status-error"}>
                <span>{pose.valid ? "✓" : "✕"}</span>
                <div>
                  <strong>Pose Analysis</strong>
                  <small>{pose.message || "Pose analysis completed."}</small>
                </div>
              </div>
            </div>

            <div className="measurement-section">
              <h3>Body Proportions</h3>
              <div className="measurement-grid">
                <div className="measurement-card">
                  <span>Shoulder Width Ratio</span>
                  <strong>{formatMeasurement(measurements.shoulder_width_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Hip Width Ratio</span>
                  <strong>{formatMeasurement(measurements.hip_width_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Left Arm Ratio</span>
                  <strong>{formatMeasurement(measurements.left_arm_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Right Arm Ratio</span>
                  <strong>{formatMeasurement(measurements.right_arm_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Left Leg Ratio</span>
                  <strong>{formatMeasurement(measurements.left_leg_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Right Leg Ratio</span>
                  <strong>{formatMeasurement(measurements.right_leg_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Torso Ratio</span>
                  <strong>{formatMeasurement(measurements.torso_ratio)}</strong>
                </div>
                <div className="measurement-card">
                  <span>Shoulder / Hip Ratio</span>
                  <strong>{formatMeasurement(measurements.shoulder_to_hip_ratio)}</strong>
                </div>
              </div>
            </div>

            <div className="analysis-meta">
              <div>
                <span>Processing Time</span>
                <strong>{formatProcessingTime(result.processing_time)}</strong>
              </div>
              <div>
                <span>Model Version</span>
                <strong>{result.model_version || "--"}</strong>
              </div>
            </div>

            {result.image_reference && (
              <div className="analysis-image-reference">
                <span>Analysis Image</span>
                <a
                  href={result.image_reference}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Image
                </a>
              </div>
            )}

            <div className="tryon-result-actions">
              <Link to="/products" className="primary-button">
                Select a Product
              </Link>
              <Link to="/try-on/history" className="secondary-button">
                View History
              </Link>
              <button
                type="button"
                className="secondary-button"
                onClick={handleRemoveImage}
              >
                Analyze Another Image
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default TryOn;
