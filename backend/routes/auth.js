import express from "express";
import passport from "passport";

const router = express.Router();

// start google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // 🔥 FORCE session save
    req.login(req.user, (err) => {
      if (err) {
        console.error("Login error:", err);
        return res.redirect(`${process.env.FRONTEND_URL}/login`);
      }

      console.log("✅ User logged in & session stored:", req.user);
      res.redirect(`${process.env.FRONTEND_URL}/verify`);
    });
  }
);

// get logged-in user
router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json(null);
  res.json(req.user);
});

// logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL);
  });
});

export default router;
