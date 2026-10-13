
import { useState } from "react";
import "./PropertyManagement.css";

function PropertyManagement({
  properties,
  selectedId,
  onSelectProperty,
  onAddProperty,
  onUpdateProperty,
  onArchiveProperty,
  onRestoreProperty,
  showArchived,
  onShowArchivedChange,
  disabled = false,
})  {
  const [newName, setNewName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeProperties = properties.filter(
    (property) => !property.archived_at
  );

  const archivedProperties = properties.filter(
    (property) => Boolean(property.archived_at)
  );

  const visibleProperties = showArchived
    ? archivedProperties
    : activeProperties;

  async function handleAdd(event) {
    event.preventDefault();

    const name = newName.trim();
    if (!name || busy) return;

    setBusy(true);
    setError("");

    try {
      await onAddProperty(name);
      setNewName("");
      onShowArchivedChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEditing(property) {
    setEditingId(property.id);
    setEditName(property.name);
    setEditAddress(property.address || "");
    setError("");
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!editName.trim() || busy) return;

    setBusy(true);
    setError("");

    try {
      await onUpdateProperty(editingId, {
        name: editName,
        address: editAddress,
      });

      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive(property) {
    const confirmed = window.confirm(
      `Archive "${property.name}"? Its expense history will be preserved.`
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      await onArchiveProperty(property.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(property) {
    setBusy(true);
    setError("");

    try {
      await onRestoreProperty(property.id);
      onShowArchivedChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel property-management">
      <div className="pm-heading">
        <div>
          <h3>My Properties</h3>
          <p>Add, edit, and manage your properties.</p>
        </div>
      </div>

      <form className="pm-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={newName}
          maxLength={200}
          placeholder="Enter a property name or address"
          disabled={disabled || busy}
          onChange={(event) => setNewName(event.target.value)}
          required
        />

        <button type="submit" disabled={disabled || busy}>
          + Add Property
        </button>
      </form>

      <div className="pm-tabs" role="group" aria-label="Property status">
        <button
          type="button"
          className={!showArchived ? "pm-tab active" : "pm-tab"}
          onClick={() => onShowArchivedChange(false)}
        >
          Active ({activeProperties.length})
        </button>

        <button
          type="button"
          className={showArchived ? "pm-tab active" : "pm-tab"}
          onClick={() => onShowArchivedChange(true)}
        >
          Archived ({archivedProperties.length})
        </button>
      </div>

      {error && (
        <p className="pm-error" role="alert">{error}</p>
      )}

      <div className="pm-list">
        {visibleProperties.length === 0 && (
          <p className="pm-empty">
            {showArchived
              ? "No archived properties."
              : "No active properties yet."}
          </p>
        )}

        {visibleProperties.map((property) => (
  <div
    className={`pm-card ${
      selectedId === property.id ? "pm-card-selected" : ""
    }`}
    key={property.id}
  >
    {editingId !== property.id && (
      <button
        type="button"
        className="pm-card-open"
        onClick={() => onSelectProperty(property.id)}
        aria-label={`View expenses for ${property.name}`}
        disabled={disabled || busy}
      />
    )}
            {editingId === property.id ? (
              <form className="pm-edit-form" onSubmit={handleUpdate}>
                <label>
                  Property Name
                  <input
                    type="text"
                    value={editName}
                    maxLength={200}
                    disabled={disabled || busy}
                    onChange={(event) => setEditName(event.target.value)}
                    required
                  />
                </label>

                <label>
                  Address (optional)
                  <input
                    type="text"
                    value={editAddress}
                    maxLength={500}
                    disabled={disabled || busy}
                    placeholder="Street, city, state"
                    onChange={(event) => setEditAddress(event.target.value)}
                  />
                </label>

                <div className="pm-actions">
                  <button type="submit" disabled={disabled || busy}>
                    Save Changes
                  </button>

                  <button
                    type="button"
                    className="pm-secondary"
                    disabled={busy}
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="pm-property-info">
                  <strong>{property.name}</strong>

                  <span>
                    {property.address || "No address added"}
                  </span>

                  {property.id === selectedId && (
                    <span className="pm-selected">
                      Currently Selected
                    </span>
                  )}
                </div>

                <div className="pm-actions">

                  <button
                    type="button"
                    className="pm-secondary"
                    disabled={disabled || busy}
                    onClick={() => startEditing(property)}
                  >
                    Edit
                  </button>

                  {property.archived_at ? (
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => handleRestore(property)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="pm-secondary"
                      disabled={disabled || busy}
                      onClick={() => handleArchive(property)}
                    >
                      Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default PropertyManagement; 
