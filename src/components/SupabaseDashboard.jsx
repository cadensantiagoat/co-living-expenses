import ExpenseCategoryManager from "./ExpenseCategoryManager";
import { useEffect, useState } from "react";
import YearSelector from "./YearSelector";
import SummaryCards from "./SummaryCards";
import MonthlyChart from "./MonthlyChart";

import {
  MONTHS,
  formatMoney,
} from "../data/expenseConfig";

import {
  getProperties,
  createProperty,
  initializeCategories,
  createCategory,
  renameCategory,
  getExpenses,
  saveExpense,
} from "../services/expenseService";

import "../App.css";

// Display one editable expense amount.
// Saving happens when the user leaves the input.
function ExpenseCell({ amount, onSave, disabled }) {
  const [value, setValue] = useState(
    amount === null ? "" : String(amount)
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) {
      setValue(amount === null ? "" : String(amount));
    }
  }, [amount, saving]);

  async function handleBlur() {
    const nextValue = value.trim();
    const number = nextValue === "" ? 0 : Number(nextValue);

    if (
      !Number.isFinite(number) ||
      number < 0 ||
      number > 9999999999.99
    ) {
      alert("Enter a valid, non-negative amount.");
      return;
    }

    if (!/^\d*(\.\d{0,2})?$/.test(nextValue)) {
      alert("Enter an amount with at most two decimal places.");
      return;
    }

    if (number === (amount ?? 0)) return;

    setSaving(true);

    try {
        await onSave(number);
      } catch {
        // Keep the entered value visible so the user
        // can retry instead of losing their input.
      } finally {
        setSaving(false);
      }
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      disabled={disabled || saving}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      aria-label="Expense amount"
      title={saving ? "Saving..." : "Edit expense"}
    />
  );
}

function SupabaseDashboard({ user, onLogout }) {
  const [properties, setProperties] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [selectedId, setSelectedId] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  const [propertyName, setPropertyName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Load property and category data after login.
  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        const [propertyRows, categoryRows] = await Promise.all([
          getProperties(),
          initializeCategories(),
        ]);

        if (!active) return;

        setProperties(propertyRows);
        setCategories(categoryRows);

        if (propertyRows.length > 0) {
          setSelectedId(propertyRows[0].id);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [user.id]);

  // Load expenses whenever the selected year changes.
  useEffect(() => {
    let active = true;

    async function loadYear() {
      setLoading(true);

      try {
        const rows = await getExpenses(year);

        if (active) {
          setExpenses(rows);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadYear();

    return () => {
      active = false;
    };
  }, [user.id, year]);

  async function handleAddProperty(event) {
    event.preventDefault();

    const name = propertyName.trim();
    if (!name || working) return;

    setWorking(true);
    setError("");

    try {
      const property = await createProperty(name);

      setProperties((previous) => [...previous, property]);
      setSelectedId(property.id);
      setPropertyName("");
      setStatus("Property created.");
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleAddCategory(event) {
    event.preventDefault();

    const name = categoryName.trim();
    if (!name || working) return;

    setWorking(true);
    setError("");

    try {
      const category = await createCategory(name);

      setCategories((previous) => [...previous, category]);
      setCategoryName("");
      setStatus("Expense category created.");
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleRenameCategory(event) {
    event.preventDefault();

    if (!editingName.trim() || working) return;

    setWorking(true);
    setError("");

    try {
      const updated = await renameCategory(
        editingId,
        editingName
      );

      setCategories((previous) =>
        previous.map((category) =>
          category.id === updated.id ? updated : category
        )
      );

      setEditingId(null);
      setEditingName("");
      setStatus("Category renamed. Existing expenses preserved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function handleSaveExpense(categoryId, month, amount) {
    if (!selectedId) return;

    setWorking(true);
    setError("");
    setStatus("Saving expense...");

    try {
      const saved = await saveExpense({
        propertyId: selectedId,
        categoryId,
        year,
        month,
        amount,
      });

      setExpenses((previous) => {
        const withoutOld = previous.filter(
          (expense) =>
            !(
              expense.property_id === saved.property_id &&
              expense.category_id === saved.category_id &&
              expense.year === saved.year &&
              expense.month === saved.month
            )
        );

        return [...withoutOld, saved];
      });

      setStatus("Expense saved to PostgreSQL.");
    } catch (err) {
        setError(`Expense not saved: ${err.message}`);
        setStatus("Save failed");
        throw err;
      } finally {
      setWorking(false);
    }
  }

  // Calculate expenses for a property/category/month.
  function getAmount(propertyId, categoryId, month) {
    const row = expenses.find(
      (expense) =>
        expense.property_id === propertyId &&
        expense.category_id === categoryId &&
        expense.month === month
    );

    return row ? Number(row.amount) : 0;
  }

  function getMonthlyTotal(propertyId, month) {
    return categories.reduce(
      (total, category) =>
        total + getAmount(propertyId, category.id, month),
      0
    );
  }

  function getCategoryTotal(propertyId, categoryId) {
    return MONTHS.reduce(
      (total, _, index) =>
        total + getAmount(propertyId, categoryId, index + 1),
      0
    );
  }

  const selectedProperty = properties.find(
    (property) => property.id === selectedId
  );

  const monthlyTotals = MONTHS.map((_, index) =>
    selectedId ? getMonthlyTotal(selectedId, index + 1) : 0
  );

  const yearlyTotal = monthlyTotals.reduce(
    (sum, amount) => sum + amount,
    0
  );

  const portfolioTotal = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  if (loading) {
    return (
      <main className="container">
        <p>Loading your PostgreSQL data...</p>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1>Property Expense Tracker</h1>

          <div className="user-controls">
            <span className="user-email">{user.email}</span>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              disabled={working}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="intro">
          <h2>Property Dashboard</h2>
          <p>
            Manage your properties and expenses with PostgreSQL.
          </p>
        </section>

        {status && (
          <p className="save-status" role="status">
            {status}
          </p>
        )}

        {error && (
          <p className="category-error" role="alert">
            {error}
          </p>
        )}

        <SummaryCards
          propertyCount={properties.length}
          propertyTotal={yearlyTotal}
          portfolioTotal={portfolioTotal}
          year={year}
        />

        <section className="panel">
          <h3>My Properties</h3>

          <form
            className="property-form"
            onSubmit={handleAddProperty}
          >
            <input
              type="text"
              value={propertyName}
              maxLength={200}
              placeholder="Enter property name or address"
              onChange={(event) =>
                setPropertyName(event.target.value)
              }
              required
            />

            <button type="submit" disabled={working}>
              + Add Property
            </button>
          </form>

          {properties.length > 0 && (
            <div className="property-selection">
              <label htmlFor="property-select">
                Select Property
              </label>

              <select
                id="property-select"
                value={selectedId}
                disabled={working}
                onChange={(event) =>
                  setSelectedId(event.target.value)
                }
              >
                {properties.map((property) => (
                  <option
                    key={property.id}
                    value={property.id}
                  >
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        {selectedProperty ? (
          <>
            <MonthlyChart monthlyTotals={monthlyTotals} />

            <section className="panel">
              <div className="table-header">
                <div>
                  <h3>{selectedProperty.name}</h3>
                  <p>Annual Expense Breakdown</p>
                </div>

                <YearSelector
                    year={year}
                    onYearChange={setYear}
                    disabled={working}
                />
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
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td className="category-name">
                          {category.name}
                        </td>

                        {MONTHS.map((_, index) => {
                          const month = index + 1;

                          return (
                            <td key={month}>
                              <ExpenseCell
                                key={`${selectedId}-${year}-${category.id}-${month}`}
                                amount={getAmount(
                                  selectedId,
                                  category.id,
                                  month
                                )}
                                disabled={working}
                                onSave={(amount) =>
                                  handleSaveExpense(
                                    category.id,
                                    month,
                                    amount
                                  )
                                }
                              />
                            </td>
                          );
                        })}

                        <td className="total-cell">
                          {formatMoney(
                            getCategoryTotal(
                              selectedId,
                              category.id
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td>Monthly Total</td>

                      {MONTHS.map((_, index) => (
                        <td key={index}>
                          {formatMoney(monthlyTotals[index])}
                        </td>
                      ))}

                      <td>{formatMoney(yearlyTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="save-note">
                Expense entries are saved when you leave
                an edited input. Check the status message
                to confirm a successful save.
              </p>
            </section>
          </>
        ) : (
          <section className="panel empty-state">
            <h3>No properties yet</h3>
            <p>Add your first property to begin.</p>
          </section>
        )}

<ExpenseCategoryManager
  categories={categories}
  disabled={working}
  onAddCategory={async (name) => {
    const category = await createCategory(name);
    setCategories((previous) => [...previous, category]);
    setStatus("Expense category created.");
  }}
  onRenameCategory={async (id, name) => {
    const updated = await renameCategory(id, name);

    setCategories((previous) =>
      previous.map((category) =>
        category.id === updated.id ? updated : category
      )
    );

    setStatus("Category renamed.");
  }}
/>
      </main>
    </div>
  );
}

export default SupabaseDashboard;
