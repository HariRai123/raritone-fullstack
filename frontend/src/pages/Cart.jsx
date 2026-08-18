import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../services/orderService";

function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createOrder(cart.map((item) => ({ productId: item.productId, quantity: item.quantity })));
      clearCart();
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="simple-page app-page">
      <span className="eyebrow">YOUR BAG</span>
      <h1>Shopping Bag</h1>

      {error && <div className="error-message">{error}</div>}

      {cart.length === 0 ? (
        <div className="empty-panel">
          <p>Your bag is empty.</p>
          <Link className="primary-button" to="/products">Shop Products</Link>
        </div>
      ) : (
        <div className="cart-list">
          {cart.map((item) => (
            <article className="cart-row" key={item.productId}>
              <img src={item.image} alt={item.name} />
              <div className="cart-row-info">
                <h3>{item.name}</h3>
                <p>₹{item.price.toLocaleString("en-IN")}</p>
                <div className="cart-controls">
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock}>+</button>
                  <button className="danger-text" onClick={() => removeFromCart(item.productId)}>Remove</button>
                </div>
              </div>
            </article>
          ))}

          <div className="cart-summary">
            <strong>Total</strong>
            <strong>₹{cartTotal.toLocaleString("en-IN")}</strong>
          </div>

          <button className="primary-button" onClick={handleCheckout} disabled={loading}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      )}
    </section>
  );
}

export default Cart;
