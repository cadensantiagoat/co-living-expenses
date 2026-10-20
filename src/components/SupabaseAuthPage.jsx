
import { useState } from "react";
import { supabase } from "../lib/supabase";
import PasswordInput from "./PasswordInput";
import "./AuthPage.css";

function SupabaseAuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Return users to our authentication testing page.
  const redirectUrl = window.location.origin;

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function changeMode() {
    setMode(mode === "login" ? "register" : "login");
    setPassword("");
    setConfirmPassword("");
    clearMessages();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    clearMessages();

    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const { data, error: authError } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

        if (authError) throw authError;

        if (!data.session) {
          setMessage(
            "Check your email for a confirmation link. " +
            "After confirming your account, you can sign in."
          );
        }
      } else {
        const { error: authError } =
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });

        if (authError) throw authError;
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    clearMessages();
    setLoading(true);

    const { error: authError } =
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
    // On success, the browser redirects to Google.
  }

  async function handlePasswordReset() {
    clearMessages();

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setLoading(true);

    try {
      const { error: authError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: redirectUrl,
          }
        );

      if (authError) throw authError;

      setMessage(
        "If the account is eligible, you'll receive " +
        "an email with password reset instructions."
      );
    } catch (err) {
      setError(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="Property Expense Tracker">
        <div className="auth-wordmark"><span className="brand-mark" aria-hidden="true">⌂</span> Property Expense Tracker</div>
        <div className="auth-story-content">
          <p className="eyebrow">A little clarity for every home</p>
          <h1>Good homes.<br />Clear finances.<br /><em>Less to worry about.</em></h1>
          <p>Bring your property expenses together, so you can focus on the places people call home.</p>
          <div className="home-illustration" aria-hidden="true"><div className="home-roof" /><div className="home-body"><span /><span /><span /><span /><span /><span /></div><div className="home-tree" /></div>
        </div>
        <p className="auth-story-footer">Every property. Every expense. All in one place.</p>
      </section>
      <div className="auth-form-region">
      <div className="auth-card">
        <p className="eyebrow">Your property workspace</p>

        <p className="auth-subtitle">
          A simpler way to keep track of home.
        </p>

        <h2>
          {mode === "register"
            ? "Create Your Account"
            : "Welcome Back"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">
            Email Address
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">
            Password
          </label>

          <PasswordInput
            id="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Enter your password"
            autoComplete={
              mode === "register"
                ? "new-password"
                : "current-password"
            }
            minLength={6}
            required
          />

          {mode === "register" && (
            <>
              <label htmlFor="confirm-password">
                Confirm Password
              </label>

              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Re-enter your password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="auth-message" role="status">
              {message}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "register"
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            className="auth-link-button"
            disabled={loading}
            onClick={handlePasswordReset}
          >
            Forgot Password?
          </button>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="google-button"
          disabled={loading}
          onClick={handleGoogleSignIn}
        >
          Continue with Google
        </button>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
          {" "}
          <button
            type="button"
            className="auth-link-button"
            disabled={loading}
            onClick={changeMode}
          >
            {mode === "login"
              ? "Create an account"
              : "Sign in"}
          </button>
        </p>
      </div>
      </div>
    </main>
  );
}

export default SupabaseAuthPage;
