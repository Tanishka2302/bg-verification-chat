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
      credentials: "include", // Essential to send the connect.sid cookie
    })
      .then((res) => {
        if (res.status === 401) return null; // 401 is normal if logged out
        if (!res.ok) throw new Error("Server error");
        return res.json(); // CRITICAL: Convert response to JSON
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
    return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Verifying Session...</div>;
  }

  // Bypass if invite token is present or user is logged in
  if (user || inviteToken) {
    return children;
  }

  //return <Navigate to="/login" replace />;
  return <Navigate to="/verify" replace />;
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