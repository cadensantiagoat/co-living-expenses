
import React from "react";
import ReactDOM from "react-dom/client";

import SupabaseAuthGate from "./components/SupabaseAuthGate";
import "./index.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <SupabaseAuthGate />
  </React.StrictMode>
);
