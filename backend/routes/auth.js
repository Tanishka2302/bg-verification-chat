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
    // ✅ redirect to frontend dynamically
    res.redirect(`${process.env.FRONTEND_URL}/verify`);
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
    // ✅ redirect to frontend root dynamically
    res.redirect(process.env.FRONTEND_URL);
  });
});

export default router;
