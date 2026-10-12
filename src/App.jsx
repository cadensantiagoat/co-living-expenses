
import { useEffect, useState } from "react";
import "./App.css";

// Expense categories available for every property
const CATEGORIES = [
  "PITI",
  "Gas & Electric",
  "Sewer & Water",
  "Cleaning",
  "Lawn",
  "HVAC",
  "Pest Control",
  "Internet",
  "Maintenance",
  "Property Management",
  "Other",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const STORAGE_KEY = "property-expense-tracker-v1";

// Create a unique ID for each property
function createProperty(name) {
  return {
    id: crypto.randomUUID(),
    name: name,
    expenses: {},
  };
}

// Load saved data, or start with an empty property list
function loadProperties() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Display amounts as US dollars
function formatMoney(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function App() {
  const [properties, setProperties] = useState(loadProperties);
  const [selectedId, setSelectedId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [newPropertyName, setNewPropertyName] = useState("");

  // Save whenever the property data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }, [properties]);

  const selectedProperty =
    properties.find((property) => property.id === selectedId) ||
    properties[0];

  function addProperty(event) {
    event.preventDefault();

    const name = newPropertyName.trim();
    if (!name) return;

    const property = createProperty(name);

    setProperties((previous) => [...previous, property]);
    setSelectedId(property.id);
    setNewPropertyName("");
  }

  // Store expense amounts by year, category, and month
  function updateExpense(category, monthIndex, inputValue) {
    if (!selectedProperty) return;

    const number = Number(inputValue);

    if (
      inputValue !== "" &&
      (!Number.isFinite(number) || number < 0)
    ) {
      return;
    }

    setProperties((previous) =>
      previous.map((property) => {
        if (property.id !== selectedProperty.id) {
          return property;
        }

        const yearExpenses = property.expenses[year] || {};
        const categoryExpenses = yearExpenses[category] || {};

        return {
          ...property,
          expenses: {
            ...property.expenses,
            [year]: {
              ...yearExpenses,
              [category]: {
                ...categoryExpenses,
                [monthIndex]: inputValue,
              },
            },
          },
        };
      })
    );
  }

  const yearExpenses = selectedProperty?.expenses[year] || {};

  function getAmount(category, monthIndex) {
    return Number(yearExpenses[category]?.[monthIndex]) || 0;
  }

  function getMonthlyTotal(monthIndex) {
    return CATEGORIES.reduce(
      (total, category) => total + getAmount(category, monthIndex),
      0
    );
  }

  function getCategoryTotal(category) {
    return MONTHS.reduce(
      (total, _, index) => total + getAmount(category, index),
      0
    );
  }

  const yearlyTotal = MONTHS.reduce(
    (total, _, index) => total + getMonthlyTotal(index),
    0
  );

  const portfolioTotal = properties.reduce((total, property) => {
    const expenses = property.expenses[year] || {};

    return (
      total +
      CATEGORIES.reduce(
        (categoryTotal, category) =>
          categoryTotal +
          MONTHS.reduce(
            (monthTotal, _, index) =>
              monthTotal +
              (Number(expenses[category]?.[index]) || 0),
            0
          ),
        0
      )
    );
  }, 0);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>Property Expense Tracker</h1>
          <span className="version">Local Development</span>
        </div>
      </header>

      <main className="container">
        <section className="intro">
          <h2>Property Dashboard</h2>
          <p>Manage property expenses and track your spending.</p>
        </section>

        <div className="summary-grid">
          <div className="summary-card">
            <p>Total Properties</p>
            <h2>{properties.length}</h2>
          </div>

          <div className="summary-card">
            <p>Selected Property · {year}</p>
            <h2>{formatMoney(yearlyTotal)}</h2>
          </div>

          <div className="summary-card">
            <p>Portfolio Total · {year}</p>
            <h2>{formatMoney(portfolioTotal)}</h2>
          </div>
        </div>

        <section className="panel">
          <h3>My Properties</h3>

          <form className="property-form" onSubmit={addProperty}>
            <input
              type="text"
              placeholder="Enter property name or address"
              value={newPropertyName}
              onChange={(event) =>
                setNewPropertyName(event.target.value)
              }
              required
            />
            <button type="submit">+ Add Property</button>
          </form>

          {properties.length > 0 && (
            <div className="property-selection">
              <label htmlFor="property">Select Property</label>
              <select
                id="property"
                value={selectedProperty?.id || ""}
                onChange={(event) => setSelectedId(event.target.value)}
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {selectedProperty ? (
          <section className="panel">
            <div className="table-header">
              <div>
                <h3>{selectedProperty.name}</h3>
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
                    setYear(Number(event.target.value))
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
                      <td className="category-name">{category}</td>

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
                              updateExpense(
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
        ) : (
          <section className="panel empty-state">
            <h3>No properties added yet</h3>
            <p>Add your first property above to start tracking expenses.</p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
