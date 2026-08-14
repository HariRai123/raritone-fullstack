import { NavLink } from "react-router-dom";

const items = [
  { to: "/", icon: "⌂", label: "Home" },
  { to: "/products", icon: "☷", label: "Browse" },
  { to: "/wishlist", icon: "♡", label: "Wishlist" },
  { to: "/profile", icon: "♙", label: "Profile" },
];

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
