
import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";

import { auth } from "../firebase";
import "./AuthPage.css";

const googleProvider = new GoogleAuthProvider();

function getErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already exists with this email.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Please choose a stronger password.";
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was canceled.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in popup.";
    case "auth/unauthorized-domain":
      return "This website domain is not authorized in Firebase.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled in Firebase.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return error.message || "Something went wrong.";
  }
}

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "register") {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Registration also signs the new user in.
        // Send a verification email for later account validation.
        try {
          await sendEmailVerification(result.user);
        } catch (verificationError) {
          console.warn(
            "Verification email could not be sent:",
            verificationError
          );
        }
      } else {
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "If an account is eligible, password reset instructions will be sent."
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setMessage("");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Property Expense Tracker</h1>
        <p className="auth-subtitle">
          Manage your properties and expenses.
        </p>

        <h2>
          {mode === "login"
            ? "Welcome Back"
            : "Create Your Account"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="auth-email">
            Email Address
          </label>

          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label htmlFor="auth-password">
            Password
          </label>

          <input
            id="auth-password"
            type="password"
            autoComplete={
              mode === "register"
                ? "new-password"
                : "current-password"
            }
            placeholder="Enter password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={6}
            required
          />

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
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {mode === "login" && (
          <button
            className="auth-link-button"
            type="button"
            disabled={loading}
            onClick={handlePasswordReset}
          >
            Forgot password?
          </button>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          className="google-button"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </button>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
          {" "}
          <button
            className="auth-link-button"
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {mode === "login"
              ? "Create an account"
              : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
