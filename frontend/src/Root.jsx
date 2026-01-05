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
    fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/me`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        // handle user
      })
      .catch(() => {
        // handle error / not logged in
      });
  }, []);
  

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Checking session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
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

        {/* HR only */}
        <Route path="/verify" element={<App />} />

      </Routes>
    </BrowserRouter>
  );
}

export default Root;
