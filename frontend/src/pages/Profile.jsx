import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/authService";

function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(user?.profileImage || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await getProfile();

        if (!mounted) return;

        setProfile(data.user);
        setName(data.user.name || "");
        setPreview(data.user.profileImage || "");
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Unable to load profile.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be 5MB or smaller.");
      return;
    }

    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

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
      formData.append("name", name.trim());
      if (image) formData.append("profileImage", image);

      const data = await updateUserProfile(formData);

      setProfile(data.user);
      setPreview(data.user.profileImage || "");
      setImage(null);
      setMessage("Profile updated successfully.");

      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="route-loading">
        <div className="spinner" />
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <section className="profile-page app-page">
      <div className="profile-header">
        <div>
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>My Profile</h1>
          <p>Manage your account details and profile picture.</p>
        </div>

        {profile?.role === "admin" && (
          <div className="profile-admin-links">
            <Link className="primary-button" to="/admin/products">Admin Products</Link>
            <Link className="secondary-button" to="/admin/users">Users</Link>
            <Link className="secondary-button" to="/admin/orders">Orders</Link>
          </div>
        )}
      </div>

      <div className="profile-layout">
        <aside className="profile-card profile-summary-card">
          <div className="profile-avatar-wrap">
            {preview ? (
              <img
                src={preview}
                alt={profile?.name || "Profile"}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {(profile?.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2>{profile?.name}</h2>
          <p>{profile?.email}</p>
          <span className="role-badge">{profile?.role}</span>
        </aside>

        <div className="profile-card">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-section-title">
              <h2>Personal information</h2>
              <p>Keep your account information up to date.</p>
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                value={profile?.email || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-image">Profile Picture</label>
              <input
                ref={fileRef}
                id="profile-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
              />
              <small className="field-help">PNG, JPG or WebP · max 5MB</small>
            </div>

            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Profile;
