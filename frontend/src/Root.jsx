import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

/* ================= PROTECTED ROUTE ================= */
/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  // 1. ALWAYS declare your states at the very top
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(undefined);

  // 2. Get the token
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("token");

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // 3. FIRST: Check if we are still loading. 
  // This prevents the 'user' check from running too early.
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Checking session...</div>;
  }

  // 4. SECOND: Check if they are allowed in (logged in OR has invite token)
  if (user || inviteToken) {
    return children;
  }

  // 5. FINALLY: Redirect if none of the above are true
  return <Navigate to="/login" replace />;
}
/* ================= ROOT ================= */
function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/verify" 
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default Root;