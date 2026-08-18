import { useEffect, useState } from "react";
import { getMyOrders } from "../services/orderService";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((err) => setError(err.response?.data?.message || "Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="simple-page app-page">
      <span className="eyebrow">PURCHASE HISTORY</span>
      <h1>Orders</h1>
      {loading && <p>Loading orders...</p>}
      {error && <div className="error-message">{error}</div>}
      {!loading && !error && orders.length === 0 && <div className="empty-panel"><p>You haven't placed any orders yet.</p></div>}
      <div className="orders-list">
        {orders.map((order) => (
          <article className="order-card" key={order._id}>
            <div className="order-header">
              <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
              <span className="role-badge">{order.status}</span>
            </div>
            <p>{new Date(order.createdAt).toLocaleString("en-IN")}</p>
            {order.items.map((item) => (
              <div className="order-item" key={`${order._id}-${item.product}`}>
                <img src={item.image} alt={item.name} />
                <span>{item.name} × {item.quantity}</span>
                <strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
              </div>
            ))}
            <div className="order-total"><strong>Total</strong><strong>₹{order.total.toLocaleString("en-IN")}</strong></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Orders;
