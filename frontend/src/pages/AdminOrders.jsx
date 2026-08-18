import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllOrders, updateOrderStatus } from "../services/orderService";

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setOrders(await getAllOrders());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const changeStatus = async (id, status) => {
    try {
      const data = await updateOrderStatus(id, status);
      setOrders((current) => current.map((order) => order._id === id ? data.order : order));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update order.");
    }
  };

  return (
    <section className="admin-page app-page">
      <div className="admin-header">
        <div><span className="eyebrow">ADMIN ONLY</span><h1>Orders</h1><p>View and manage customer orders.</p></div>
        <Link className="secondary-button" to="/profile">Back to Profile</Link>
      </div>
      {error && <div className="error-message">{error}</div>}
      {loading ? <p>Loading orders...</p> : orders.length === 0 ? <div className="empty-panel"><p>No orders found.</p></div> : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-header">
                <div><strong>#{order._id.slice(-8).toUpperCase()}</strong><p>{order.user?.name} · {order.user?.email}</p></div>
                <select value={order.status} onChange={(e) => changeStatus(order._id, e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
              </div>
              {order.items.map((item) => <div className="order-item" key={`${order._id}-${item.product}`}><img src={item.image} alt={item.name} /><span>{item.name} × {item.quantity}</span><strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong></div>)}
              <div className="order-total"><strong>Total</strong><strong>₹{order.total.toLocaleString("en-IN")}</strong></div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default AdminOrders;
