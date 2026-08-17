function SearchBar({ value, onChange, placeholder = "Browse" }) {
  return (
    <label className="search-bar">
      <span className="search-icon" aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
      />
      {value && (
        <button type="button" className="search-clear" onClick={() => onChange("")} aria-label="Clear search">
          ×
        </button>
      )}
    </label>
  );
}

export default SearchBar;
