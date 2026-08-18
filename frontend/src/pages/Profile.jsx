
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/authService";
import { getTryOnHistory } from "../services/tryonService";

function Profile() {
  const { user, updateUserProfile } = useAuth();

  // =========================================================
  // PROFILE STATES
  // =========================================================

  const [profile, setProfile] = useState(user);

  const [name, setName] = useState(
    user?.name || ""
  );

  const [image, setImage] = useState(null);

  const [preview, setPreview] = useState(
    user?.profileImage || ""
  );

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =========================================================
  // TRY-ON STATES
  // =========================================================

  const [tryOnResults, setTryOnResults] = useState([]);

  const [tryOnLoading, setTryOnLoading] = useState(true);

  const [tryOnError, setTryOnError] = useState("");

  const fileRef = useRef(null);

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await getProfile();

        console.log(
          "PROFILE DATA:",
          data
        );

        if (!mounted) return;

        setProfile(data?.user || null);

        setName(
          data?.user?.name || ""
        );

        setPreview(
          data?.user?.profileImage || ""
        );

      } catch (err) {
        console.error(
          "PROFILE ERROR:",
          err
        );

        if (mounted) {
          setError(
            err.response?.data?.message ||
              "Unable to load profile."
          );
        }

      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // LOAD TRY-ON HISTORY
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadTryOnResults = async () => {
      try {
        setTryOnLoading(true);
        setTryOnError("");

        const data =
          await getMyTryOnResults();

        console.log(
          "TRY-ON DATA FROM API:",
          data
        );

        if (!mounted) return;

        if (
          Array.isArray(
            data?.results
          )
        ) {
          setTryOnResults(
            data.results
          );
        } else {
          setTryOnResults([]);
        }

      } catch (err) {
        console.error(
          "TRY-ON HISTORY ERROR:",
          err
        );

        if (mounted) {
          setTryOnResults([]);

          setTryOnError(
            err.response?.data?.message ||
              "Unable to load Try-On history."
          );
        }

      } finally {
        if (mounted) {
          setTryOnLoading(false);
        }
      }
    };

    loadTryOnResults();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // CLEANUP PROFILE PREVIEW
  // =========================================================

  useEffect(() => {
    return () => {
      if (
        preview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          preview
        );
      }
    };
  }, [preview]);

  // =========================================================
  // PROFILE IMAGE CHANGE
  // =========================================================

  const handleImageChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image file."
      );

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Profile image must be 5MB or smaller."
      );

      return;
    }

    setError("");

    if (
      preview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    setImage(file);

    setPreview(
      URL.createObjectURL(file)
    );
  };

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError(
        "Name is required."
      );

      return;
    }

    try {
      setSaving(true);

      const formData =
        new FormData();

      formData.append(
        "name",
        name.trim()
      );

      if (image) {
        formData.append(
          "profileImage",
          image
        );
      }

      const data =
        await updateUserProfile(
          formData
        );

      console.log(
        "UPDATED PROFILE:",
        data
      );

      setProfile(
        data?.user || null
      );

      setPreview(
        data?.user?.profileImage ||
          ""
      );

      setImage(null);

      setMessage(
        "Profile updated successfully."
      );

      if (fileRef.current) {
        fileRef.current.value =
          "";
      }

    } catch (err) {
      console.error(
        "UPDATE PROFILE ERROR:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );

    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return "--";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "--";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================================
  // TIME FORMAT
  // =========================================================

  const formatProcessingTime = (
    time
  ) => {
    if (
      time === null ||
      time === undefined
    ) {
      return "--";
    }

    const number =
      Number(time);

    if (Number.isNaN(number)) {
      return "--";
    }

    return `${number.toFixed(4)}s`;
  };

  // =========================================================
  // MEASUREMENT FORMAT
  // =========================================================

  const formatMeasurement = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "--";
    }

    const number =
      Number(value);

    if (Number.isNaN(number)) {
      return "--";
    }

    return number.toFixed(4);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />

        <p>
          Loading profile...
        </p>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <section className="profile-page app-page">

      {/* =====================================================
          PROFILE HEADER
      ===================================================== */}

      <div className="profile-header">

        <div>

          <span className="eyebrow">
            YOUR ACCOUNT
          </span>

          <h1>
            My Profile
          </h1>

          <p>
            Manage your account details
            and profile picture.
          </p>

        </div>

        {/* ADMIN LINKS */}

        {profile?.role === "admin" && (

          <div className="profile-admin-links">

            <Link
              className="primary-button"
              to="/admin/products"
            >
              Admin Products
            </Link>

            <Link
              className="secondary-button"
              to="/admin/users"
            >
              Users
            </Link>

            <Link
              className="secondary-button"
              to="/admin/orders"
            >
              Orders
            </Link>

          </div>

        )}

      </div>

      {/* =====================================================
          PROFILE INFORMATION
      ===================================================== */}

      <div className="profile-layout">

        {/* ===================================================
            PROFILE SUMMARY
        =================================================== */}

        <aside className="profile-card profile-summary-card">

          <div className="profile-avatar-wrap">

            {preview ? (

              <img
                src={preview}
                alt={
                  profile?.name ||
                  "Profile"
                }
                className="profile-avatar"
              />

            ) : (

              <div className="profile-avatar profile-avatar-fallback">

                {(
                  profile?.name ||
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}

              </div>

            )}

          </div>

          <h2>
            {profile?.name ||
              "User"}
          </h2>

          <p>
            {profile?.email ||
              ""}
          </p>

          <span className="role-badge">
            {profile?.role ||
              "user"}
          </span>

        </aside>

        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}

        <div className="profile-card">

          <form
            onSubmit={handleSubmit}
            className="profile-form"
          >

            <div className="profile-section-title">

              <h2>
                Personal information
              </h2>

              <p>
                Keep your account
                information up to date.
              </p>

            </div>

            {/* SUCCESS */}

            {message && (
              <div className="success-message">
                {message}
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* NAME */}

            <div className="form-group">

              <label htmlFor="profile-name">
                Full Name
              </label>

              <input
                id="profile-name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                required
              />

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="profile-email">
                Email
              </label>

              <input
                id="profile-email"
                value={
                  profile?.email ||
                  ""
                }
                disabled
              />

            </div>

            {/* PROFILE IMAGE */}

            <div className="form-group">

              <label htmlFor="profile-image">
                Profile Picture
              </label>

              <input
                ref={fileRef}
                id="profile-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={
                  handleImageChange
                }
              />

              <small className="field-help">
                PNG, JPG or WebP ·
                max 5MB
              </small>

            </div>

            {/* SAVE */}

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </form>

        </div>

      </div>

      {/* =====================================================
          TRY-ON HISTORY
      ===================================================== */}

      <div className="profile-card try-on-history-card">

        <div className="profile-section-title">

          <span className="eyebrow">
            AI TRY-ON
          </span>

          <h2>
            Try-On History
          </h2>

          <p>
            Your previous AI body-proportion
            results.
          </p>

        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {tryOnLoading && (

          <div className="try-on-history-loading">

            <div className="spinner" />

            <p>
              Loading your Try-On
              history...
            </p>

          </div>

        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {!tryOnLoading &&
          tryOnError && (

            <div className="error-message">
              {tryOnError}
            </div>

          )}

        {/* ===================================================
            EMPTY
        =================================================== */}

        {!tryOnLoading &&
          !tryOnError &&
          tryOnResults.length === 0 && (

            <div className="empty-panel">

              <p>
                You haven't completed
                a Try-On analysis yet.
              </p>

              <Link
                className="primary-button"
                to="/try-on"
              >
                Open Try-On Studio
              </Link>

            </div>

          )}

        {/* ===================================================
            RESULTS
        =================================================== */}

        {!tryOnLoading &&
          tryOnResults.length > 0 && (

            <div className="try-on-history-grid">

              {tryOnResults.map(
                (item) => {

                  /*
                  |--------------------------------------------------
                  | ML TEAM BODY MEASUREMENTS
                  |--------------------------------------------------
                  */

                  const measurements =
                    item?.body_measurements ||
                    {};

                  return (

                    <article
                      className="try-on-history-item"
                      key={item._id}
                    >

                      {/* =========================================
                          IMAGE
                      ========================================= */}

                      <div className="try-on-history-image">

                        {item.image_reference ? (

                          <img
                            src={
                              item.image_reference
                            }
                            alt="Try-On analysis"
                            loading="lazy"
                          />

                        ) : (

                          <div className="try-on-no-image">
                            No Image
                          </div>

                        )}

                      </div>

                      {/* =========================================
                          CONTENT
                      ========================================= */}

                      <div className="try-on-history-content">

                        {/* TOP */}

                        <div className="try-on-history-top">

                          <div>

                            <span className="eyebrow">
                              ANALYSIS
                            </span>

                            <h3>
                              Body Analysis
                            </h3>

                          </div>

                          <span className="try-on-date">

                            {formatDate(
                              item.createdAt ||
                                item.created_at
                            )}

                          </span>

                        </div>

                        {/* =======================================
                            STATUS
                        ======================================= */}

                        <div className="analysis-status compact">

                          {/* PERSON */}

                          <div>

                            <span>
                              {item.person_detected
                                ? "✓"
                                : "✕"}
                            </span>

                            <strong>
                              Person
                            </strong>

                          </div>

                          {/* POSE */}

                          <div>

                            <span>
                              {item.pose_result
                                ?.valid
                                ? "✓"
                                : "✕"}
                            </span>

                            <strong>
                              Pose
                            </strong>

                          </div>

                        </div>

                        {/* =======================================
                            BODY MEASUREMENTS
                        ======================================= */}

                        <div className="measurement-section">

                          <h4>
                            Body Measurements
                          </h4>

                          <div className="measurement-grid compact">

                            {/* SHOULDER */}

                            <div className="measurement-card">

                              <span>
                                Shoulder
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .shoulder_width_ratio
                                )}
                              </strong>

                            </div>

                            {/* HIP */}

                            <div className="measurement-card">

                              <span>
                                Hip
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .hip_width_ratio
                                )}
                              </strong>

                            </div>

                            {/* LEFT ARM */}

                            <div className="measurement-card">

                              <span>
                                Left Arm
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .left_arm_ratio
                                )}
                              </strong>

                            </div>

                            {/* RIGHT ARM */}

                            <div className="measurement-card">

                              <span>
                                Right Arm
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .right_arm_ratio
                                )}
                              </strong>

                            </div>

                            {/* LEFT LEG */}

                            <div className="measurement-card">

                              <span>
                                Left Leg
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .left_leg_ratio
                                )}
                              </strong>

                            </div>

                            {/* RIGHT LEG */}

                            <div className="measurement-card">

                              <span>
                                Right Leg
                              </span>

                              <strong>
                                {formatMeasurement(
                                  measurements
                                    .right_leg_ratio
                                )}
                              </strong>

                            </div>

                          </div>

                        </div>

                        {/* =======================================
                            POSE MESSAGE
                        ======================================= */}

                        {item.pose_result
                          ?.message && (

                          <div className="try-on-pose-message">

                            <span>
                              Pose:
                            </span>

                            <strong>
                              {
                                item.pose_result
                                  .message
                              }
                            </strong>

                          </div>

                        )}

                        {/* =======================================
                            AI INFORMATION
                        ======================================= */}

                        <div className="try-on-history-meta">

                          <span>
                            Model:{" "}
                            {item.model_version ||
                              "--"}
                          </span>

                          <span>
                            Processing:{" "}
                            {formatProcessingTime(
                              item.processing_time
                            )}
                          </span>

                        </div>

                        {/* =======================================
                            IMAGE LINK
                        ======================================= */}

                        {item.image_reference && (

                          <div className="analysis-image-reference">

                            <a
                              href={
                                item.image_reference
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Analysis Image
                            </a>

                          </div>

                        )}

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        {/* ===================================================
            OPEN TRY-ON
        =================================================== */}

        {!tryOnLoading &&
          tryOnResults.length > 0 && (

            <div className="try-on-history-footer">

              <Link
                to="/try-on"
                className="primary-button"
              >
                New Try-On Analysis
              </Link>

            </div>

          )}

      </div>

    </section>
  );
}

export default Profile;
