
import {
    CATEGORIES,
    MONTHS,
    formatMoney,
  } from "../data/expenseConfig";
  
  function ExpenseTable({
    property,
    year,
    onYearChange,
    onExpenseChange,
  }) {
    const yearExpenses = property.expenses[year] || {};
  
    function getAmount(category, monthIndex) {
      return Number(yearExpenses[category]?.[monthIndex]) || 0;
    }
  
    function getMonthlyTotal(monthIndex) {
      return CATEGORIES.reduce(
        (total, category) =>
          total + getAmount(category, monthIndex),
        0
      );
    }
  
    function getCategoryTotal(category) {
      return MONTHS.reduce(
        (total, _, index) =>
          total + getAmount(category, index),
        0
      );
    }
  
    const yearlyTotal = MONTHS.reduce(
      (total, _, index) =>
        total + getMonthlyTotal(index),
      0
    );
  
    return (
      <section className="panel">
        <div className="table-header">
          <div>
            <h3>{property.name}</h3>
            <p>Annual Expense Breakdown</p>
          </div>
  
          <div className="year-control">
            <label htmlFor="year">Year</label>
  
            <input
              id="year"
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) =>
                onYearChange(Number(event.target.value))
              }
            />
          </div>
        </div>
  
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Category</th>
  
                {MONTHS.map((month) => (
                  <th key={month}>{month}</th>
                ))}
  
                <th>Year Total</th>
              </tr>
            </thead>
  
            <tbody>
              {CATEGORIES.map((category) => (
                <tr key={category}>
                  <td className="category-name">
                    {category}
                  </td>
  
                  {MONTHS.map((_, index) => (
                    <td key={index}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        aria-label={`${category} ${MONTHS[index]}`}
                        value={
                          yearExpenses[category]?.[index] ?? ""
                        }
                        placeholder="0"
                        onChange={(event) =>
                          onExpenseChange(
                            category,
                            index,
                            event.target.value
                          )
                        }
                      />
                    </td>
                  ))}
  
                  <td className="total-cell">
                    {formatMoney(getCategoryTotal(category))}
                  </td>
                </tr>
              ))}
            </tbody>
  
            <tfoot>
              <tr>
                <td>Monthly Total</td>
  
                {MONTHS.map((_, index) => (
                  <td key={index}>
                    {formatMoney(getMonthlyTotal(index))}
                  </td>
                ))}
  
                <td>{formatMoney(yearlyTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
  
        <p className="save-note">
          Changes are saved automatically in this browser.
        </p>
      </section>
    );
  }
  
  export default ExpenseTable;
  