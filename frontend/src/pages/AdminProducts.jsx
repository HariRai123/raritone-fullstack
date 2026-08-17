import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../services/productService";

const emptyForm = {
  productId: "",
  name: "",
  category: "",
  price: "",
  description: "",
  brand: "",
  stock: "",
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isEditing = Boolean(editingId);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isEditing && !image) {
      setError("Product image is required.");
      return;
    }

    try {
      setSaving(true);
      const payload = new FormData();

      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (image) payload.append("image", image);

      if (isEditing) {
        await updateProduct(editingId, payload);
        setMessage("Product updated successfully.");
      } else {
        await createProduct(payload);
        setMessage("Product created successfully.");
      }

      setForm(emptyForm);
      setImage(null);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      productId: product.productId || "",
      name: product.name || "",
      category: product.category || "",
      price: product.price ?? "",
      description: product.description || "",
      brand: product.brand || "",
      stock: product.stock ?? "",
    });
    setImage(null);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;

    try {
      setError("");
      setMessage("");
      await deleteProduct(id);
      setProducts((previous) => previous.filter((product) => product._id !== id));
      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete product.");
    }
  };

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  );

  return (
    <section className="admin-page app-page">
      <div className="admin-header">
        <div>
          <span className="eyebrow">ADMIN ONLY</span>
          <h1>Product Management</h1>
          <p>Create, edit and remove products. Images are stored in ImageKit.</p>
        </div>
        <Link to="/profile" className="secondary-button">Back to Profile</Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <div className="admin-layout">
        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="profile-section-title">
            <h2>{isEditing ? "Edit Product" : "Add Product"}</h2>
            <p>{isEditing ? "Update product information or replace its image." : "Add a new product to the catalog."}</p>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Product ID</label>
              <input name="productId" value={form.productId} onChange={handleChange} disabled={isEditing} required />
            </div>
            <div className="form-group">
              <label>Product Name</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Category</label>
              <input name="category" value={form.category} onChange={handleChange} list="category-list" required />
              <datalist id="category-list">
                {categories.map((category) => <option key={category} value={category} />)}
              </datalist>
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Price (₹)</label>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="5" required />
          </div>

          <div className="form-group">
            <label>Product Image {isEditing && <span className="muted-inline">(optional when editing)</span>}</label>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} required={!isEditing} />
          </div>

          <div className="admin-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </button>
            {isEditing && (
              <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setForm(emptyForm); setImage(null); }}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="admin-products-card">
          <div className="profile-section-title">
            <h2>Catalog</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>

          {loading ? (
            <div className="route-loading compact"><div className="spinner" /><p>Loading products...</p></div>
          ) : products.length === 0 ? (
            <div className="empty-panel">No products found.</div>
          ) : (
            <div className="admin-product-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product._id}>
                  <img src={product.image} alt={product.name} />
                  <div className="admin-product-info">
                    <strong>{product.name}</strong>
                    <span>{product.brand} · {product.category}</span>
                    <span>₹{Number(product.price).toLocaleString("en-IN")} · Stock {product.stock}</span>
                  </div>
                  <div className="admin-product-actions">
                    <button className="secondary-button small" onClick={() => handleEdit(product)}>Edit</button>
                    <button className="danger-button" onClick={() => handleDelete(product._id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default AdminProducts;
