import ExpenseCategoryManager from "./ExpenseCategoryManager";
import PropertyManagement from "./PropertyManagement";
import { useEffect, useState } from "react";
import YearSelector from "./YearSelector";
import SummaryCards from "./SummaryCards";
import MonthlyChart from "./MonthlyChart";
import { exportExpenseWorkbook } from "../services/excelExportService";

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
  updateProperty,
  archiveProperty,
  restoreProperty,
} from "../services/expenseService";

import "../App.css";

// Display one editable expense amount.
// Saving happens when the user leaves the input.
function ExpenseCell({ amount, onSave, disabled, inputId }) {
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
      id={inputId}
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
  const [showArchived, setShowArchived] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [expenseView, setExpenseView] = useState("monthly");

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );

  const [showSpendingChart, setShowSpendingChart] =
    useState(false);


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

async function handleExportExcel() {
  if (exporting) return;

  setExporting(true);
  setError("");
  setStatus("Preparing Excel workbook...");

  try {
    await exportExpenseWorkbook();
    setStatus("Excel workbook downloaded successfully.");
  } catch (err) {
    setError(`Excel export failed: ${err.message}`);
    setStatus("Excel export failed.");
  } finally {
    setExporting(false);
  }
}

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

async function handleUpdateProperty(propertyId, updates) {
  setWorking(true);
  setError("");

  try {
    const updated = await updateProperty(propertyId, updates);

    setProperties((previous) =>
      previous.map((property) =>
        property.id === updated.id ? updated : property
      )
    );

    setStatus("Property updated successfully.");
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setWorking(false);
  }
}

async function handleArchiveProperty(propertyId) {
  setWorking(true);
  setError("");

  try {
    const updated = await archiveProperty(propertyId);

    const nextProperties = properties.map((property) =>
      property.id === updated.id ? updated : property
    );

    setProperties(nextProperties);

    // Switch to another active property when necessary.
    if (selectedId === propertyId) {
      const nextActive = nextProperties.find(
        (property) => !property.archived_at
      );

      setSelectedId(nextActive?.id || "");
    }

    setStatus("Property archived. Expense history preserved.");
  } catch (err) {
    setError(err.message);
    throw err;
  } finally {
    setWorking(false);
  }
}

async function handleRestoreProperty(propertyId) {
  setWorking(true);
  setError("");

  try {
    const restored = await restoreProperty(propertyId);

    setProperties((previous) =>
      previous.map((property) =>
        property.id === restored.id ? restored : property
      )
    );

    setSelectedId(restored.id);
    setStatus("Property restored successfully.");
  } catch (err) {
    setError(err.message);
    throw err;
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
    if (
      !selectedId ||
      !properties.some(
        (property) =>
          property.id === selectedId && !property.archived_at
      )
    ) {
      throw new Error("Select an active property before editing expenses.");
    }

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

const isArchived = Boolean(selectedProperty?.archived_at);

  const monthlyTotals = MONTHS.map((_, index) =>
    selectedId ? getMonthlyTotal(selectedId, index + 1) : 0
  );

  const selectedMonthTotal = monthlyTotals[selectedMonth] ?? 0;

function goToPreviousMonth() {
  setSelectedMonth((previous) => (previous + 11) % 12);
}

function goToNextMonth() {
  setSelectedMonth((previous) => (previous + 1) % 12);
}

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
          

<div className="dashboard-heading">
  <div className="dashboard-heading-text">
    <h1>Property Dashboard</h1>
    <p>
      Manage your properties and expenses with PostgreSQL.
    </p>
  </div>

  <button
    type="button"
    className="dashboard-export-button"
    onClick={handleExportExcel}
    disabled={exporting || loading}
  >
    {exporting
      ? "Generating Excel..."
      : "Download Excel Workbook"}
  </button>
</div>


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
  propertyCount={
    properties.filter((property) => !property.archived_at).length
  }
  propertyTotal={yearlyTotal}
  portfolioTotal={portfolioTotal}
  year={year}
/>

        
<PropertyManagement
  properties={properties}
  selectedId={selectedId}
  onSelectProperty={setSelectedId}
  onAddProperty={async (name, address) => {
  const property = await createProperty(name, address);

  setProperties((previous) => [...previous, property]);
  setSelectedId(property.id);
  setStatus("Property created successfully.");
}}
  onUpdateProperty={handleUpdateProperty}
  onArchiveProperty={handleArchiveProperty}
  onRestoreProperty={handleRestoreProperty}
  showArchived={showArchived}
  onShowArchivedChange={setShowArchived}
  disabled={working}
/>


        
{selectedProperty ? (
  <>
    {/* =====================================
        PROPERTY HEADER AND YEAR SELECTOR
    ===================================== */}
    <section className="panel">
      <div className="table-header">
        <div>
          <h3>{selectedProperty.name}</h3>

          <p>
            {isArchived
              ? "Archived Property — Read-Only Expense History"
              : "Manage and review property expenses"}
          </p>

          {selectedProperty.address && (
            <p>{selectedProperty.address}</p>
          )}
        </div>

        <YearSelector
          year={year}
          onYearChange={setYear}
          disabled={working}
        />
      </div>
    </section>

    {/* =====================================
        MONTHLY / ANNUAL VIEW SWITCH
    ===================================== */}
    <div className="expense-view-switch">
      <button
        type="button"
        className={
          expenseView === "monthly"
            ? "expense-view-button active"
            : "expense-view-button"
        }
        onClick={() => setExpenseView("monthly")}
        aria-pressed={expenseView === "monthly"}
      >
        Monthly View
      </button>

      <button
        type="button"
        className={
          expenseView === "annual"
            ? "expense-view-button active"
            : "expense-view-button"
        }
        onClick={() => setExpenseView("annual")}
        aria-pressed={expenseView === "annual"}
      >
        Annual View
      </button>
    </div>

    {/* =====================================
        MONTHLY EXPENSE VIEW
    ===================================== */}
    {expenseView === "monthly" && (
      <section className="panel monthly-expense-panel">
        <div className="monthly-expense-heading">
          <div>
            <h3>Monthly Expenses</h3>

            <p>
              {isArchived
                ? "Read-only expense history"
                : "Enter and review expenses for one month."}
            </p>
          </div>
        </div>

        {/* Month navigation */}
        <div className="month-navigation">
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            &larr;
          </button>

          <div className="month-navigation-label">
            <h3>
              {MONTHS[selectedMonth]} {year}
            </h3>

            <span>Selected expense period</span>
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            &rarr;
          </button>
        </div>

        {/* Monthly total */}
        <div className="monthly-total-card">
          <span>Total Monthly Expenses</span>

          <strong>
            {formatMoney(selectedMonthTotal)}
          </strong>
        </div>

        {/* Expense category inputs */}
        <div className="monthly-expense-list">
          <div className="monthly-expense-list-heading">
            <span>Expense Category</span>
            <span>Amount</span>
          </div>

          {categories.map((category) => (
            <div
              className="monthly-expense-row"
              key={category.id}
            >
              <label
                htmlFor={`monthly-${selectedId}-${year}-${selectedMonth}-${category.id}`}
              >
                {category.name}
              </label>

              <div className="monthly-expense-input">
                <ExpenseCell
                  key={`${selectedId}-${year}-${selectedMonth}-${category.id}`}
                  inputId={`monthly-${selectedId}-${year}-${selectedMonth}-${category.id}`}
                  amount={getAmount(
                    selectedId,
                    category.id,
                    selectedMonth + 1
                  )}
                  disabled={working || isArchived}
                  onSave={(amount) =>
                    handleSaveExpense(
                      category.id,
                      selectedMonth + 1,
                      amount
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {/* Monthly total footer */}
        <div className="monthly-expense-footer">
          <strong>Monthly Total</strong>

          <strong>
            {formatMoney(selectedMonthTotal)}
          </strong>
        </div>

        {/* Save message */}
        <p className="save-note">
          {isArchived
            ? "This property is archived. You can view its expense history, but you must restore it before making changes."
            : "Expense entries are saved when you leave an edited input. Check the status message to confirm a successful save."}
        </p>
      </section>
    )}

    {/* =====================================
        ANNUAL EXPENSE VIEW
    ===================================== */}
    {expenseView === "annual" && (
      <section className="panel">
        <div className="table-header">
          <div>
            <h3>Annual Expense Breakdown</h3>

            <p>
              {isArchived
                ? "Read-only annual expense history"
                : "Review and edit expenses across all 12 months."}
            </p>
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
                          disabled={working || isArchived}
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

                <td>
                  {formatMoney(yearlyTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="save-note">
          {isArchived
            ? "This property is archived. You can view its expense history, but you must restore it before making changes."
            : "Expense entries are saved when you leave an edited input. Check the status message to confirm a successful save."}
        </p>
      </section>
    )}

    {/* =====================================
        COLLAPSIBLE SPENDING CHART
    ===================================== */}
    <section className="chart-disclosure-section">
      <button
        type="button"
        className="chart-disclosure-button"
        onClick={() =>
          setShowSpendingChart((previous) => !previous)
        }
        aria-expanded={showSpendingChart}
      >
        <span>
          {showSpendingChart
            ? "Hide Spending Chart"
            : "Show Spending Chart"}
        </span>

        <span aria-hidden="true">
          {showSpendingChart ? "▲" : "▼"}
        </span>
      </button>

      {showSpendingChart && (
        <div className="chart-disclosure-content">
          <MonthlyChart
            monthlyTotals={monthlyTotals}
          />
        </div>
      )}
    </section>
  </>
) : (
  /* =====================================
      NO PROPERTY SELECTED
  ===================================== */
  <section className="panel empty-state">
    <h3>No property selected</h3>
    <p>
      Add or select a property to begin tracking expenses.
    </p>
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
