
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import SupabaseAuthPage from "./SupabaseAuthPage";
import "./AuthPage.css";

function SupabaseAuthGate() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;

      setSession(newSession);

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      if (event === "SIGNED_OUT") {
        setRecoveryMode(false);
      }

      setLoading(false);
    });

    // Restore an existing session after page refresh.
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        setSession(data.session);
      }

      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    setError("");

    const { error: signOutError } =
      await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
    }
  }

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNewPassword("");
    setMessage("Password updated successfully.");
    setRecoveryMode(false);
  }

  if (loading) {
    return (
      <div className="auth-page">
        <p>Checking Supabase authentication...</p>
      </div>
    );
  }

  if (recoveryMode) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2>Create New Password</h2>

          <form onSubmit={handlePasswordUpdate}>
            <label htmlFor="new-password">
              New Password
            </label>

            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              required
            />

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="auth-submit"
              type="submit"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return <SupabaseAuthPage />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Property Expense Tracker</h1>

        <p className="auth-subtitle">
          Supabase Authentication Test
        </p>

        <h2>Authentication Successful!</h2>

        <p>
          You are signed in using Supabase.
        </p>

        <p>
          <strong>Email:</strong>{" "}
          {session.user.email}
        </p>

        <p>
          <strong>User ID:</strong>
        </p>

        <p className="auth-user-id">
          {session.user.id}
        </p>

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="auth-submit"
          type="button"
          onClick={handleLogout}
        >
          Sign Out
        </button>

        <p className="auth-subtitle auth-test-note">
          Your PostgreSQL tables are ready.
          We'll connect the expense dashboard to
          these tables in the next development step.
        </p>
      </div>
    </div>
  );
}

export default SupabaseAuthGate;
