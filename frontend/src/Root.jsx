import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";


/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(undefined); // 👈 important

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
        Restoring session…
      </div>
    );
  }

  // 🔥 KEY FIX: retry once instead of instant redirect
  if (user === null) {
    setTimeout(() => {
      window.location.reload();
    }, 300);

    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Syncing authentication…
      </div>
    );
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