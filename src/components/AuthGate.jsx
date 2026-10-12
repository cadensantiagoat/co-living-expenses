
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "../firebase";
import AuthPage from "./AuthPage";
import App from "../App";

function AuthGate() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setCheckingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
      alert("Unable to sign out. Please try again.");
    }
  }

  if (checkingAuth) {
    return (
      <div className="auth-page">
        <p>Checking your account...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <App
      key={user.uid}
      user={user}
      onLogout={handleLogout}
    />
  );
}

export default AuthGate;
