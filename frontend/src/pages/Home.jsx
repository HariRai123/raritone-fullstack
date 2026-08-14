import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ProductGrid from "../components/ProductGrid";
import BottomNav from "../components/BottomNav";

import { getProducts } from "../services/productService";

import homeImage from "../assets/home.jpg";

const categories = ["All", "Men", "Women", "Outerwear"];

function Home() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);

        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const featured = products.slice(0, 6);

  return (
    <div className="home-page app-page">
      <section className="home-hero">
        <div className="hero-image-card">
          <img src={homeImage} alt="Golden Hour Collection" />

          <div className="hero-overlay" />

          <div className="hero-copy">
            <span>SUMMER 2026</span>

            <h1>
              Golden Hour
              <br />
              Collection
            </h1>

            <Link to="/products">SHOP THE EDIT&nbsp; →</Link>
          </div>
        </div>
      </section>

      <section className="promo-banner">
        <div>
          <span>LIMITED TIME</span>

          <strong>Winter Sale -30% Off</strong>

          <small>SHOP NOW</small>
        </div>

        <div className="promo-avatar">R</div>
      </section>

      <section className="home-section">
        <div className="section-heading-row">
          <h2>Discover</h2>

          <Link to="/products">See all</Link>
        </div>

        <div className="home-category-row">
          {categories.map((category, index) => (
            <Link
              key={category}
              to="/products"
              className={`home-category ${index === 0 ? "active" : ""}`}
            >
              <span className="category-avatar">
                {index === 0 ? "✦" : category.charAt(0)}
              </span>

              <span>{category}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="section-heading-row">
          <div>
            <span className="eyebrow">CURATED FOR YOU</span>

            <h2>Trending Now</h2>
          </div>

          <Link to="/products">See all</Link>
        </div>

        {/* Loading */}

        {loading && <div className="status">Loading products...</div>}

        {error && <div className="error">{error}</div>}

        {!loading && !error && <ProductGrid products={featured} />}
      </section>

      <section className="promo-banner promo-banner-secondary">
        <div>
          <span>LIMITED TIME</span>

          <strong>Sale -30% Off</strong>

          <small>SHOP NOW&nbsp; →</small>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

export default Home;
