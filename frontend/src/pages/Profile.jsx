import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/authService";
import { getMyTryOnResults } from "../services/tryonService";

function Profile() {
  const { user, updateUserProfile } = useAuth();

  // Profile states
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(
    user?.profileImage || ""
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Try-On states
  const [tryOnResults, setTryOnResults] = useState([]);
  const [tryOnLoading, setTryOnLoading] = useState(true);
  const [tryOnError, setTryOnError] = useState("");

  const fileRef = useRef(null);

  // ================================
  // LOAD USER PROFILE
  // ================================
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await getProfile();

        console.log("PROFILE DATA:", data);

        if (!mounted) return;

        setProfile(data.user);
        setName(data.user?.name || "");
        setPreview(data.user?.profileImage || "");
      } catch (err) {
        console.error("PROFILE ERROR:", err);

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

  // ================================
  // LOAD TRY-ON HISTORY
  // ================================
  useEffect(() => {
    let mounted = true;

    const loadTryOnResults = async () => {
      try {
        setTryOnLoading(true);
        setTryOnError("");

        const data = await getMyTryOnResults();

        console.log("TRY-ON DATA FROM API:", data);

        if (!mounted) return;

        // Backend response:
        // {
        //   message: "...",
        //   results: [...]
        // }

        if (Array.isArray(data?.results)) {
          setTryOnResults(data.results);
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

  // ================================
  // CLEANUP PROFILE IMAGE PREVIEW
  // ================================
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // ================================
  // PROFILE IMAGE CHANGE
  // ================================
  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile image must be 5MB or smaller."
      );
      return;
    }

    setError("");

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ================================
  // UPDATE PROFILE
  // ================================
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

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
        await updateUserProfile(formData);

      console.log(
        "UPDATED PROFILE:",
        data
      );

      setProfile(data.user);

      setPreview(
        data.user?.profileImage || ""
      );

      setImage(null);

      setMessage(
        "Profile updated successfully."
      );

      if (fileRef.current) {
        fileRef.current.value = "";
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

  // ================================
  // DATE FORMAT
  // ================================
  const formatDate = (date) => {
    if (!date) {
      return "--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
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

  // ================================
  // PROCESSING TIME
  // ================================
  const formatProcessingTime = (time) => {
    if (
      time === null ||
      time === undefined
    ) {
      return "--";
    }

    return `${time}s`;
  };

  // ================================
  // LOADING PROFILE
  // ================================
  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  // ================================
  // PAGE
  // ================================
  return (
    <section className="profile-page app-page">

      {/* ============================
          PROFILE HEADER
      ============================ */}
      <div className="profile-header">

        <div>
          <span className="eyebrow">
            YOUR ACCOUNT
          </span>

          <h1>My Profile</h1>

          <p>
            Manage your account details
            and profile picture.
          </p>
        </div>

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

      {/* ============================
          PROFILE INFORMATION
      ============================ */}
      <div className="profile-layout">

        {/* PROFILE SUMMARY */}
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
                {(profile?.name || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

          </div>

          <h2>
            {profile?.name}
          </h2>

          <p>
            {profile?.email}
          </p>

          <span className="role-badge">
            {profile?.role}
          </span>

        </aside>

        {/* PERSONAL INFORMATION */}
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
                Keep your account information
                up to date.
              </p>

            </div>

            {message && (
              <div className="success-message">
                {message}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-group">

              <label htmlFor="profile-name">
                Full Name
              </label>

              <input
                id="profile-name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="profile-email">
                Email
              </label>

              <input
                id="profile-email"
                value={
                  profile?.email || ""
                }
                disabled
              />

            </div>

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
                PNG, JPG or WebP · max 5MB
              </small>

            </div>

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

      {/* ============================
          TRY-ON HISTORY
      ============================ */}
      <div className="profile-card try-on-history-card">

        <div className="profile-section-title">

          <span className="eyebrow">
            AI TRY-ON
          </span>

          <h2>
            Try-On History
          </h2>

          <p>
            Your previous AI body-analysis
            results.
          </p>

        </div>

        {/* LOADING */}
        {tryOnLoading && (
          <div className="try-on-history-loading">

            <div className="spinner" />

            <p>
              Loading your Try-On
              history...
            </p>

          </div>
        )}

        {/* ERROR */}
        {!tryOnLoading &&
          tryOnError && (
            <div className="error-message">
              {tryOnError}
            </div>
          )}

        {/* EMPTY */}
        {!tryOnLoading &&
          !tryOnError &&
          tryOnResults.length === 0 && (
            <div className="empty-panel">

              <p>
                You haven't completed a
                Try-On analysis yet.
              </p>

              <Link
                className="primary-button"
                to="/try-on"
              >
                Open Try-On Studio
              </Link>

            </div>
          )}

        {/* RESULTS */}
        {!tryOnLoading &&
          tryOnResults.length > 0 && (
            <div className="try-on-history-grid">

              {tryOnResults.map(
                (item) => (
                  <article
                    className="try-on-history-item"
                    key={item._id}
                  >

                    {/* IMAGE */}
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

                    {/* CONTENT */}
                    <div className="try-on-history-content">

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

                      {/* STATUS */}
                      <div className="analysis-status compact">

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

                      {/* MEASUREMENTS */}
                      <div className="measurement-grid compact">

                        <div className="measurement-card">

                          <span>
                            Shoulder
                          </span>

                          <strong>
                            {item
                              .body_measurements
                              ?.shoulder_ratio ??
                              "--"}
                          </strong>

                        </div>

                        <div className="measurement-card">

                          <span>
                            Hip
                          </span>

                          <strong>
                            {item
                              .body_measurements
                              ?.hip_ratio ??
                              "--"}
                          </strong>

                        </div>

                        <div className="measurement-card">

                          <span>
                            Arm
                          </span>

                          <strong>
                            {item
                              .body_measurements
                              ?.arm_ratio ??
                              "--"}
                          </strong>

                        </div>

                        <div className="measurement-card">

                          <span>
                            Leg
                          </span>

                          <strong>
                            {item
                              .body_measurements
                              ?.leg_ratio ??
                              "--"}
                          </strong>

                        </div>

                      </div>

                      {/* AI INFORMATION */}
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

                    </div>

                  </article>
                )
              )}

            </div>
          )}

      </div>

    </section>
  );
}

export default Profile;
