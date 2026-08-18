import { Link, NavLink, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar({ search, onSearch }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-top">

        <Link to="/" className="navbar-logo">
          Raritone
        </Link>

        <nav
          className="desktop-nav"
          aria-label="Primary navigation"
        >
          <NavLink to="/">Home</NavLink>

          <NavLink to="/products">
            Shop
          </NavLink>

          {isAuthenticated && (
            <NavLink to="/wishlist">
              Wishlist
            </NavLink>
          )}

          {isAuthenticated && (
            <NavLink to="/orders">
              Orders
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/admin/products">
              Admin
            </NavLink>
          )}
        </nav>

        <div className="navbar-actions">

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="nav-user-chip"
                title="Profile"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt=""
                  />
                ) : (
                  <span>
                    {user?.name
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </span>
                )}

                <span className="nav-user-name">
                  {user?.name?.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                className="nav-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="nav-login"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="nav-register"
              >
                Register
              </Link>
            </>
          )}

          <Link
            to="/cart"
            className="icon-button bag-button"
            aria-label={`Shopping bag with ${cartCount} items`}
          >
            Bag

            {cartCount > 0 && (
              <span className="bag-count">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {typeof search === "string" && onSearch ? (
        <div className="navbar-search-row">

          <SearchBar
            value={search}
            onChange={onSearch}
          />

          <NavLink
            to="/products"
            className="filter-icon"
            aria-label="Open products filters"
          >
            ☷
          </NavLink>

        </div>
      ) : null}
    </header>
  );
}

export default Navbar;