function Loading() {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <span>Loading products...</span>
    </div>
  );
}

export default Loading;
