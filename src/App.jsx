
import { useEffect, useState } from "react";

import SummaryCards from "./components/SummaryCards";
import PropertyManager from "./components/PropertyManager";
import ExpenseTable from "./components/ExpenseTable";
import MonthlyChart from "./components/MonthlyChart";

import {
  CATEGORIES,
  MONTHS,
} from "./data/expenseConfig";

import "./App.css";

const STORAGE_KEY_PREFIX = "property-expense-tracker-v1";

function createProperty(name) {
  return {
    id: crypto.randomUUID(),
    name,
    expenses: {},
  };
}


function loadProperties(userId) {
  const storageKey = `${STORAGE_KEY_PREFIX}-${userId}`;

  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}


function App({ user, onLogout }) {
  const [properties, setProperties] = useState(
    () => loadProperties(user.uid)
  );
  const [selectedId, setSelectedId] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());

  // Automatically save when property data changes
  
useEffect(() => {
  const storageKey = `${STORAGE_KEY_PREFIX}-${user.uid}`;

  localStorage.setItem(
    storageKey,
    JSON.stringify(properties)
  );
}, [properties, user.uid]);


  const selectedProperty =
    properties.find(
      (property) => property.id === selectedId
    ) || properties[0];

  function addProperty(name) {
    const property = createProperty(name);

    setProperties((previous) => [
      ...previous,
      property,
    ]);

    setSelectedId(property.id);
  }

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

  // Totals for each month of the selected property
  const monthlyTotals = MONTHS.map((_, monthIndex) => {
    if (!selectedProperty) return 0;

    const expenses = selectedProperty.expenses[year] || {};

    return CATEGORIES.reduce(
      (total, category) =>
        total +
        (Number(expenses[category]?.[monthIndex]) || 0),
      0
    );
  });

  const yearlyTotal = monthlyTotals.reduce(
    (sum, amount) => sum + amount,
    0
  );

  // Sum all expenses across all properties
  const portfolioTotal = properties.reduce(
    (total, property) => {
      const expenses = property.expenses[year] || {};

      const propertyTotal = CATEGORIES.reduce(
        (categoryTotal, category) =>
          categoryTotal +
          MONTHS.reduce(
            (monthTotal, _, index) =>
              monthTotal +
              (Number(expenses[category]?.[index]) || 0),
            0
          ),
        0
      );

      return total + propertyTotal;
    },
    0
  );

  return (
    <div className="app">
      
<header className="header">
  <div className="header-inner">
    <h1>Property Expense Tracker</h1>

    <div className="user-controls">
      <span className="user-email">
        {user.email}
      </span>

      <button
        className="logout-button"
        onClick={onLogout}
        type="button"
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
            Manage property expenses and track
            your spending.
          </p>
        </section>

        <SummaryCards
          propertyCount={properties.length}
          propertyTotal={yearlyTotal}
          portfolioTotal={portfolioTotal}
          year={year}
        />

        <PropertyManager
          properties={properties}
          selectedProperty={selectedProperty}
          onAddProperty={addProperty}
          onSelectProperty={setSelectedId}
        />

        {selectedProperty ? (
          <>
            <MonthlyChart
              monthlyTotals={monthlyTotals}
            />

            <ExpenseTable
              property={selectedProperty}
              year={year}
              onYearChange={setYear}
              onExpenseChange={updateExpense}
            />
          </>
        ) : (
          <section className="panel empty-state">
            <h3>No properties added yet</h3>
            <p>
              Add your first property above
              to start tracking expenses.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
