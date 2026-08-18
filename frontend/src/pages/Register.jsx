import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

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
    setProfileImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name) return setError("Full name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Please enter a valid email address.");
    }
    if (formData.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }

    try {
      setLoading(true);

      const payload = new FormData();
      payload.append("name", name);
      payload.append("email", email);
      payload.append("password", formData.password);
      if (profileImage) payload.append("profileImage", profileImage);

      await registerUser(payload);
      setSuccess("Account created successfully. Redirecting to login...");

      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <span className="eyebrow">RARITONE</span>
          <h1>Create Account</h1>
          <p>Join Raritone and save your style preferences.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="profile-upload">
            {preview ? (
              <img src={preview} alt="Profile preview" />
            ) : (
              <div className="profile-upload-fallback">+</div>
            )}
            <label className="secondary-button" htmlFor="register-image">Choose photo</label>
            <input id="register-image" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} hidden />
          </div>

          <div className="form-group">
            <label htmlFor="register-name">Full Name</label>
            <input id="register-name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" autoComplete="name" required />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="register-password">Password</label>
              <input id="register-password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min. 6 characters" autoComplete="new-password" required />
            </div>

            <div className="form-group">
              <label htmlFor="register-confirm-password">Confirm Password</label>
              <input id="register-confirm-password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" autoComplete="new-password" required />
            </div>
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;
