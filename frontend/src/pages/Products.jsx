import { useEffect, useState } from "react";

import ProductGrid from "../components/ProductGrid";

import { getProducts } from "../services/productService";

function Products() {
  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [category, setCategory] = useState("all");

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

  const categories = [
    "all",
    ...new Set(products.map((product) => product.category)),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory = category === "all" || product.category === category;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <div className="status">Loading products...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <section className="products-page">
      <div className="products-header">
        <div>
          <p className="section-label">OUR COLLECTION</p>

          <h1>All Products</h1>
        </div>

        <p>{filteredProducts.length} products</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search clothing..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
        >
          {categories.map((item) => (
            <option key={item} value={item}>
              {item === "all" ? "All Categories" : item}
            </option>
          ))}
        </select>
      </div>

      <div className="products-scroll-container">
        <ProductGrid products={filteredProducts} />
      </div>
    </section>
  );
}

export default Products;
