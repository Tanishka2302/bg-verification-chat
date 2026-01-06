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
      credentials: "include", // Required to send that connect.sid cookie
    })
      .then((res) => {
        // 401 is NOT an error here; it just means no one is logged in
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Server Error");
        return res.json(); // CRITICAL: You must convert response to JSON
      })
      .then((data) => {
        if (isMounted) {
          setUser(data); // 'data' is now the actual user object or null
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
    return <div className="h-screen flex items-center justify-center font-medium">Verifying Session...</div>;
  }

  // Allow entry if user is logged in OR if there's a valid invite token
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