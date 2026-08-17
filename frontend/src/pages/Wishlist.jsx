import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

function Wishlist() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  return (
    <section className="simple-page app-page">
      <span className="eyebrow">SAVED ITEMS</span>
      <h1>Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="empty-panel"><p>No saved items yet.</p><Link className="primary-button" to="/products">Discover Products</Link></div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((product) => (
            <article className="wishlist-card" key={product._id}>
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>₹{Number(product.price).toLocaleString("en-IN")}</p>
              <div className="product-actions">
                <button className="add-cart-button" onClick={() => addToCart(product)}>Add to Cart</button>
                <button className="view-button" onClick={() => toggleWishlist(product)}>Remove</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default Wishlist;
