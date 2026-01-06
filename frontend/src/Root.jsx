import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

/* ================= PROTECTED ROUTE ================= */
/* ================= PROTECTED ROUTE ================= */
/* ================= PROTECTED ROUTE ================= */
/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("token");

  useEffect(() => {
    let isMounted = true;
  
    fetch("https://bg-verification-chat.onrender.com/auth/me", {
      credentials: "include", // Essential for cookies
    })
      .then((res) => {
        if (res.status === 401) return null; // Expected if not logged in
        if (!res.ok) throw new Error("Server Error");
        return res.json(); // YOU MUST CALL .json() HERE
      })
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Auth check failed:", err.message);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });
  
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Checking session...</div>;
  }

  // If we have a user OR a token, let them in
  if (user || inviteToken) {
    return children;
  }

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