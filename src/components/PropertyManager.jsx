
import { useState } from "react";

function PropertyManager({
  properties,
  selectedProperty,
  onAddProperty,
  onSelectProperty,
}) {
  const [newPropertyName, setNewPropertyName] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    const name = newPropertyName.trim();

    if (!name) return;

    onAddProperty(name);
    setNewPropertyName("");
  }

  return (
    <section className="panel">
      <h3>My Properties</h3>

      <form className="property-form" onSubmit={handleSubmit}>
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
            onChange={(event) =>
              onSelectProperty(event.target.value)
            }
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
  );
}

export default PropertyManager;
