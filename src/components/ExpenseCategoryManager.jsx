
import { useState } from "react";
import "./ExpenseCategoryManager.css";

function ExpenseCategoryManager({
  categories,
  disabled,
  onAddCategory,
  onRenameCategory,
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  function nameExists(name, excludeId = null) {
    return categories.some(
      (category) =>
        category.id !== excludeId &&
        category.name.trim().toLowerCase() ===
          name.trim().toLowerCase()
    );
  }

  async function addCategory(event) {
    event.preventDefault();

    const name = newName.trim();
    setError("");

    if (!name || nameExists(name)) {
      setError("Enter a unique category name.");
      return;
    }

    try {
      await onAddCategory(name);
      setNewName("");
    } catch {
      setError("Unable to add the category.");
    }
  }

  async function saveRename(event) {
    event.preventDefault();

    const name = editingName.trim();
    setError("");

    if (!name || nameExists(name, editingId)) {
      setError("Enter a unique category name.");
      return;
    }

    try {
      await onRenameCategory(editingId, name);
      setEditingId(null);
      setEditingName("");
    } catch {
      setError("Unable to rename the category.");
    }
  }

  return (
    <section className="panel expense-category-panel">
      <div className="expense-category-heading">
        <div>
          <h3>Expense Categories</h3>
          <p>Customize the expenses you track.</p>
        </div>

        <span className="category-count">
          {categories.length} Categories
        </span>
      </div>

      <form
        className="category-create"
        onSubmit={addCategory}
      >
        <input
          type="text"
          maxLength={60}
          placeholder="Add a new expense category..."
          aria-label="New expense category"
          value={newName}
          disabled={disabled}
          onChange={(event) =>
            setNewName(event.target.value)
          }
          required
        />

        <button type="submit" disabled={disabled}>
          + Add Category
        </button>
      </form>

      {error && (
        <p className="category-error" role="alert">
          {error}
        </p>
      )}

      <div className="expense-category-grid">
        {categories.map((category) => (
          <div
            className="expense-category-item"
            key={category.id}
          >
            {editingId === category.id ? (
              <form onSubmit={saveRename}>
                <input
                  type="text"
                  maxLength={60}
                  aria-label="Category name"
                  value={editingName}
                  disabled={disabled}
                  onChange={(event) =>
                    setEditingName(event.target.value)
                  }
                  required
                />

                <div className="category-edit-actions">
                  <button
                    type="submit"
                    disabled={disabled}
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <span className="expense-category-name">
                  {category.name}
                </span>

                <button
                  type="button"
                  className="category-icon-button"
                  disabled={disabled}
                  aria-label={`Rename ${category.name}`}
                  title={`Rename ${category.name}`}
                  onClick={() => {
                    setEditingId(category.id);
                    setEditingName(category.name);
                    setError("");
                  }}
                >
                  ✎
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <p className="category-footer">
        Renaming a category preserves its existing expenses.
      </p>
    </section>
  );
}

export default ExpenseCategoryManager;
