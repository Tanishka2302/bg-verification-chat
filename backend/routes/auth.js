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
    res.redirect("http://localhost:5173/verify");
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
    res.redirect("http://localhost:5173/");
  });
});

export default router;
