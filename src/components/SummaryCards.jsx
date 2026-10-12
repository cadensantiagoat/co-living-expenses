
import { formatMoney } from "../data/expenseConfig";

function SummaryCards({
  propertyCount,
  propertyTotal,
  portfolioTotal,
  year,
}) {
  return (
    <div className="summary-grid">
      <div className="summary-card">
        <p>Total Properties</p>
        <h2>{propertyCount}</h2>
      </div>

      <div className="summary-card">
        <p>Selected Property · {year}</p>
        <h2>{formatMoney(propertyTotal)}</h2>
      </div>

      <div className="summary-card">
        <p>Portfolio Total · {year}</p>
        <h2>{formatMoney(portfolioTotal)}</h2>
      </div>
    </div>
  );
}

export default SummaryCards;
