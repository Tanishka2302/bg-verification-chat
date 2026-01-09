import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useRef  } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";


/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(undefined);
  const retriedRef = useRef(false); // 👈 guard

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session…
      </div>
    );
  }

  // 🔥 retry ONLY ONCE
  if (user === null && !retriedRef.current) {
    retriedRef.current = true;
    setTimeout(() => window.location.reload(), 300);

    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Restoring authentication…
      </div>
    );
  }

  // ❌ after retry → real redirect
  if (user === null) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ================= ROOT ================= */
function Root() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      {/* ✅ NO PROTECTED ROUTE */}
      <Route path="/verify" element={<App />} />
    </Routes>
  </BrowserRouter>
  );
}

export default Root;