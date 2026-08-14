import { Link } from "react-router-dom";

function Forbidden() {
  return (
    <section className="simple-page">
      <span className="eyebrow">403</span>
      <h1>Access denied</h1>
      <p>You don't have permission to view this page.</p>
      <Link to="/" className="primary-button">Go Home</Link>
    </section>
  );
}

export default Forbidden;
