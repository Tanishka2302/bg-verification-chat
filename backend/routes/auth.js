import express from "express";
import passport from "passport";

const router = express.Router();

/* ===============================
   GOOGLE AUTHENTICATION
================================ */

// 1. Start Google login
// We pass the scope here explicitly to satisfy Google's requirements
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
// 2. Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL}/login` 
  }),
  (req, res) => {
    // 🔥 CRITICAL: Save the session to the Database (Neon) BEFORE redirecting.
    // Without this, the frontend might hit /me before the DB is updated.
    req.session.save((err) => {
      if (err) {
        console.error("❌ Session save error in callback:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }
      
      console.log("✅ Session successfully persisted to Neon. Redirecting to /verify.");
      res.redirect(`${process.env.FRONTEND_URL}/verify`);
    });
  }
);

/* ===============================
   SESSION MANAGEMENT
================================ */

// 3. Get logged-in user data
router.get("/me", (req, res) => {
  // Check if Passport has deserialized the user correctly
  if (req.isAuthenticated() && req.user) {
    return res.json(req.user);
  }
  
  // If not authenticated, return 401 and null to trigger the frontend guard
  console.log("⚠️ /auth/me requested but user not authenticated");
  res.status(401).json(null);
});

// 4. Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("❌ Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    
    // Destroy the session in the database
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("❌ Session destruction error:", destroyErr);
      }
      
      // Clear the browser cookie
      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      
      console.log("👋 User logged out and session cleared.");
      res.status(200).json({ message: "Logged out" });
    });
  });
});

export default router;