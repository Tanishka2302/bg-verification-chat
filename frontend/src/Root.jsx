import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

/* ================= PROTECTED ROUTE ================= */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("token");

  useEffect(() => {
    let isMounted = true;
  
    fetch("https://bg-verification-chat.onrender.com/auth/me", {
      credentials: "include", //
    })
      .then((res) => {
        if (res.status === 401) return null; // Normal state: Not logged in
        if (!res.ok) throw new Error("Server error");
        return res.json(); //
      })
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
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

  // Allow entry if logged in OR if using a valid invite link
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