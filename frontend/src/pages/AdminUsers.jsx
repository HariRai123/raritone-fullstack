import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUsers } from "../services/adminService";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.response?.data?.message || "Unable to load users."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page app-page">
      <div className="admin-header">
        <div><span className="eyebrow">ADMIN ONLY</span><h1>Users</h1><p>View registered Raritone users.</p></div>
        <Link className="secondary-button" to="/profile">Back to Profile</Link>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? <p>Loading users...</p> : (
        <div className="admin-users-list">
          {users.map((user) => (
            <article className="admin-user-row" key={user._id}>
              {user.profileImage ? <img src={user.profileImage} alt={user.name} /> : <div className="profile-avatar profile-avatar-fallback">{user.name.charAt(0).toUpperCase()}</div>}
              <div><strong>{user.name}</strong><span>{user.email}</span></div>
              <span className="role-badge">{user.role}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminUsers;
