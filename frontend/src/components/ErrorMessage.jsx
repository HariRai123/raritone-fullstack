function ErrorMessage({ message = "Unable to load products.", onRetry }) {
  return (
    <div className="error-state" role="alert">
      <span className="error-icon">!</span>
      <strong>{message}</strong>
      {onRetry && (
        <button type="button" onClick={onRetry}>Try Again</button>
      )}
    </div>
  );
}

export default ErrorMessage;
