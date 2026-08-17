function CategoryFilter({ categories, value, onChange }) {
  return (
    <div className="category-filter" aria-label="Product categories">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`category-chip ${value === category ? "active" : ""}`}
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
