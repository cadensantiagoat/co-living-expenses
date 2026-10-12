
import React from "react";
import ReactDOM from "react-dom/client";

import AuthGate from "./components/AuthGate";
import SupabaseAuthGate from "./components/SupabaseAuthGate";

import "./index.css";

// Use a temporary testing route for Supabase Authentication.
const params = new URLSearchParams(window.location.search);

const useSupabaseAuth =
  params.get("supabase-auth-test") === "1";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    {useSupabaseAuth ? (
      <SupabaseAuthGate />
    ) : (
      <AuthGate />
    )}
  </React.StrictMode>
);
