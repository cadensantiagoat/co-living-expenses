
import { useEffect, useState } from "react";

function YearSelector({ year, onYearChange, disabled = false }) {
  const [draftYear, setDraftYear] = useState(String(year));
  const [error, setError] = useState("");

  useEffect(() => {
    setDraftYear(String(year));
    setError("");
  }, [year]);

  function applyYear() {
    const parsed = Number(draftYear);

    if (
      !/^\d{4}$/.test(draftYear) ||
      !Number.isInteger(parsed) ||
      parsed < 2000 ||
      parsed > 2100
    ) {
      setError("Enter a year between 2000 and 2100.");
      return;
    }

    setError("");
    onYearChange(parsed);
  }

  function changeBy(amount) {
    const next = year + amount;

    if (next < 2000 || next > 2100) return;

    setDraftYear(String(next));
    setError("");
    onYearChange(next);
  }

  return (
    <div className="year-selector">
      <label htmlFor="expense-year">Year</label>

      <div className="year-selector-controls">
        <button
          type="button"
          className="year-arrow"
          onClick={() => changeBy(-1)}
          disabled={disabled || year <= 2000}
          aria-label="Previous year"
        >
          &lt;
        </button>

        <input
          id="expense-year"
          type="text"
          inputMode="numeric"
          maxLength={4}
          value={draftYear}
          disabled={disabled}
          onChange={(event) => {
            setDraftYear(event.target.value);
            setError("");
          }}
          onBlur={applyYear}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          aria-invalid={Boolean(error)}
        />

        <button
          type="button"
          className="year-arrow"
          onClick={() => changeBy(1)}
          disabled={disabled || year >= 2100}
          aria-label="Next year"
        >
          &gt;
        </button>
      </div>

      {error && (
        <span className="year-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export default YearSelector;
