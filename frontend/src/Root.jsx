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
    let isMounted = true;
  
    fetch("https://bg-verification-chat.onrender.com/auth/me", {
      credentials: "include", // Required to send the session cookie
    })
      .then((res) => {
        // If 401, just return null (not an app crash, just not logged in)
        if (res.status === 401) return null;
        if (!res.ok) throw new Error("Server Error");
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setUser(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("User not authenticated:", err.message);
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      });
  
    return () => { isMounted = false; };
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