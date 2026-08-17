import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

function ProductCard({ product }) {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const wishlisted = isWishlisted(product._id);

  const isAddedToCart = cart.some(
    (item) => item.productId === product._id
  );

  const stock = Number(product.stock || 0);
  const price = Number(product.price || 0);

  const handleAddToCart = () => {
    if (stock <= 0 || isAddedToCart) {
      return;
    }

    addToCart(product);
  };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <button
          className={`wishlist-button ${
            wishlisted ? "wishlisted" : ""
          }`}
          type="button"
          aria-label={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          onClick={() => toggleWishlist(product)}
        >
          {wishlisted ? "♥" : "♡"}
        </button>

        <Link to={`/products/${product._id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="product-image"
            loading="lazy"
          />
        </Link>

        <button type="button" className="try-on-pill">
          ◎&nbsp; Try On
        </button>
      </div>

      <div className="product-info">
        <div className="product-name-row">
          <div>
            <h3 className="product-title">
              {product.name}
            </h3>

            <p className="product-brand">
              {product.category}
            </p>
          </div>

          <strong className="product-price">
            ₹{price.toLocaleString("en-IN")}
          </strong>
        </div>

        <div className="product-actions">
          <Link
            to={`/products/${product._id}`}
            className="view-button"
          >
            View Product
          </Link>

          <button
            type="button"
            className={`add-cart-button ${
              isAddedToCart ? "added-to-cart" : ""
            }`}
            disabled={stock <= 0 || isAddedToCart}
            onClick={handleAddToCart}
          >
            {stock <= 0
              ? "Out of Stock"
              : isAddedToCart
              ? "Added to Cart ✓"
              : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;