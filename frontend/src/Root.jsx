import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/auth/me`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("unauthorized");

        const data = await res.json();
        setUser(data);
      } catch {
        // ⏳ allow hydration delay
        setTimeout(async () => {
          try {
            const res = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/auth/me`,
              { credentials: "include" }
            );
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUser(data);
          } catch {
            setUser(null);
          }
        }, 300);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ================= ROOT ================= */
function Root() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected */}
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
