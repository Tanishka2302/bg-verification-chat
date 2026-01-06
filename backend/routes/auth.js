import express from "express";
import passport from "passport";

const router = express.Router();

// Start Google login
router.get(
  "/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"] // ✅ Added required scope
  })
);
// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // 🔥 CRITICAL FIX: Ensure session is written to PostgreSQL BEFORE redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }
      
      console.log("✅ Session persisted to DB. Redirecting to frontend.");
      // Use /verify here as we discussed to trigger the App.jsx check
      res.redirect(`${process.env.FRONTEND_URL}/verify`);
    });
  }
);

// Get logged-in user
router.get("/me", (req, res) => {
  // Check both isAuthenticated() and req.user for maximum safety
  if (req.isAuthenticated() && req.user) {
    return res.json(req.user);
  }
  res.status(401).json(null);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.status(200).json({ message: "Logged out" });
    });
  });
});

export default router;