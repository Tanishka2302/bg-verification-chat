import express from "express";
import passport from "passport";

const router = express.Router();

/* ===============================
   GOOGLE AUTHENTICATION
================================ */

// 1. Start Google login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// 2. Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login` 
  }),
  (req, res) => {
    // ✅ Saves session to Neon DB BEFORE redirecting to prevent 401 on /me
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error in callback:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }
      
      console.log("✅ Session successfully persisted. Redirecting to /verify.");
      res.redirect(`${process.env.FRONTEND_URL}/verify`);
    });
  }
);

/* ===============================
   SESSION MANAGEMENT
================================ */

// 3. Get logged-in user data
router.get("/me", (req, res) => {
  // Passport populates req.user upon successful deserialization
  if (req.isAuthenticated() && req.user) {
    return res.json(req.user);
  }
  
  // Return 401 to trigger the frontend ProtectedRoute redirect
  console.log("⚠️ /auth/me: User not authenticated");
  res.status(401).json(null);
});

// 4. Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    // Destroy session in Postgres
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("❌ Session destruction error:", destroyErr);
      }
      
      // Clear cookie with exact production settings
      const isProduction = process.env.NODE_ENV === "production";
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: true, // Required for HTTPS on Render
        sameSite: "none",
      });
      
      console.log("👋 Session cleared. User logged out.");
      res.status(200).json({ message: "Logged out" });
    });
  });
});

export default router;