
import {
    MONTHS,
    formatMoney,
  } from "../data/expenseConfig";
  
  function MonthlyChart({ monthlyTotals }) {
    const maxAmount = Math.max(...monthlyTotals, 1);
    const yearlyTotal = monthlyTotals.reduce(
      (sum, amount) => sum + amount,
      0
    );
  
    return (
      <section className="panel chart-panel">
        <div className="chart-heading">
          <div>
            <h3>Monthly Expense Overview</h3>
            <p>Spending across the selected year</p>
          </div>
  
          <div className="chart-total">
            <span>Annual Total</span>
            <strong>{formatMoney(yearlyTotal)}</strong>
          </div>
        </div>
  
        <div className="monthly-chart">
          {MONTHS.map((month, index) => {
            const amount = monthlyTotals[index];
  
            const height =
              maxAmount > 0
                ? (amount / maxAmount) * 100
                : 0;
  
            return (
              <div className="chart-column" key={month}>
                <div
                  className="chart-bar-area"
                  title={`${month}: ${formatMoney(amount)}`}
                >
                  <div
                    className="chart-bar"
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>
  
                <span className="chart-month">{month}</span>
  
                <span className="chart-amount">
                  {amount > 0
                    ? formatMoney(amount)
                    : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
  
  export default MonthlyChart;
  