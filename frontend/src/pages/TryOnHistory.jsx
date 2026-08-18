import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTryOnHistory } from "../services/tryonService";

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

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--" : date.toLocaleString("en-IN");
}

function TryOnHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadHistory = async () => {
      try {
        const data = await getTryOnHistory();
        console.log("TRY-ON HISTORY:", data);

        if (mounted) {
          setResults(Array.isArray(data?.results) ? data.results : []);
        }
      } catch (err) {
        console.error("TRY-ON HISTORY ERROR:", err);
        if (mounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load try-on history."
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadHistory();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="tryon-history-page app-page">
        <div className="tryon-card tryon-loading">
          <div className="spinner" />
          <p>Loading analysis history...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tryon-history-page app-page">
        <div className="tryon-history-header">
          <div>
            <span className="eyebrow">AI TRY-ON</span>
            <h1>Try-On History</h1>
            <p>View your previous AI body-proportion analyses.</p>
          </div>
          <Link to="/try-on" className="primary-button">New Analysis</Link>
        </div>
        <div className="error-message">{error}</div>
      </section>
    );
  }

  return (
    <section className="tryon-history-page app-page">
      <div className="tryon-history-header">
        <div>
          <span className="eyebrow">AI TRY-ON</span>
          <h1>Try-On History</h1>
          <p>View your previous AI body-proportion analyses.</p>
        </div>
        <div className="tryon-history-header-actions">
          <Link to="/try-on" className="primary-button">New Analysis</Link>
          <Link to="/profile" className="secondary-button">Profile</Link>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="tryon-card tryon-empty-state">
          <div className="tryon-upload-icon">↑</div>
          <h2>No Analysis Yet</h2>
          <p>Upload a full-body image to get your first AI body analysis.</p>
          <Link to="/try-on" className="primary-button">Start Try-On</Link>
        </div>
      ) : (
        <div className="tryon-history-list">
          {results.map((item, index) => {
            const measurements = item.body_measurements || {};
            const pose = item.pose_result || {};

            return (
              <article key={item._id || index} className="tryon-history-card">
                <div className="tryon-history-card-header">
                  <div>
                    <span className="eyebrow">ANALYSIS #{results.length - index}</span>
                    <h2>Body Analysis</h2>
                    <p>{formatDate(item.createdAt)}</p>
                  </div>
                  <div className={item.person_detected ? "history-status success" : "history-status error"}>
                    {item.person_detected ? "✓ Person Detected" : "✕ No Person Detected"}
                  </div>
                </div>

                <div className="tryon-history-content">
                  <div className="tryon-history-image-wrapper">
                    {item.image_reference ? (
                      <img
                        src={item.image_reference}
                        alt="Try-on analysis"
                        className="tryon-history-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="tryon-history-image-placeholder">No image</div>
                    )}
                  </div>

                  <div className="tryon-history-analysis">
                    <div className="analysis-status">
                      <div className={item.person_detected ? "status-item status-success" : "status-item status-error"}>
                        <span>{item.person_detected ? "✓" : "✕"}</span>
                        <div>
                          <strong>Person Detected</strong>
                          <small>
                            {item.person_detected
                              ? "Person successfully detected."
                              : "No person detected."}
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
                        <div className="measurement-card"><span>Shoulder Width</span><strong>{formatMeasurement(measurements.shoulder_width_ratio)}</strong></div>
                        <div className="measurement-card"><span>Hip Width</span><strong>{formatMeasurement(measurements.hip_width_ratio)}</strong></div>
                        <div className="measurement-card"><span>Left Arm</span><strong>{formatMeasurement(measurements.left_arm_ratio)}</strong></div>
                        <div className="measurement-card"><span>Right Arm</span><strong>{formatMeasurement(measurements.right_arm_ratio)}</strong></div>
                        <div className="measurement-card"><span>Left Leg</span><strong>{formatMeasurement(measurements.left_leg_ratio)}</strong></div>
                        <div className="measurement-card"><span>Right Leg</span><strong>{formatMeasurement(measurements.right_leg_ratio)}</strong></div>
                        <div className="measurement-card"><span>Torso</span><strong>{formatMeasurement(measurements.torso_ratio)}</strong></div>
                        <div className="measurement-card"><span>Shoulder / Hip</span><strong>{formatMeasurement(measurements.shoulder_to_hip_ratio)}</strong></div>
                      </div>
                    </div>

                    <div className="analysis-meta">
                      <div>
                        <span>Processing Time</span>
                        <strong>{formatProcessingTime(item.processing_time)}</strong>
                      </div>
                      <div>
                        <span>Model Version</span>
                        <strong>{item.model_version || "--"}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {item.image_reference && (
                  <div className="analysis-image-reference">
                    <span>Analysis Image</span>
                    <a href={item.image_reference} target="_blank" rel="noopener noreferrer">
                      Open Image
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default TryOnHistory;
