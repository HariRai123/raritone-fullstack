import BottomNav from "../components/BottomNav";

function Placeholder({ title }) {
  return (
    <div className="placeholder-page app-page">
      <span className="eyebrow">RARITONE</span>
      <h1>{title}</h1>
      <BottomNav />
    </div>
  );
}

export default Placeholder;
