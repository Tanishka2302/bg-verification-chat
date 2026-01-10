import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://bg-verification-chat.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const name = profile.displayName;

        let res = await pool.query(
          "SELECT * FROM users WHERE google_id = $1",
          [googleId]
        );

        if (res.rows.length === 0) {
          res = await pool.query(
            `INSERT INTO users (google_id, email, name, role)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [googleId, email, name, "HR"]
          );
        }

        return done(null, res.rows[0]);
      } catch (err) {
        console.error("❌ Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// ✅ store ONLY user id in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// ✅ fetch user fresh from DB on each request
passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );

    if (res.rows.length === 0) {
      return done(null, false);
    }

    done(null, res.rows[0]);
  } catch (err) {
    console.error("❌ Deserialize error:", err);
    done(err);
  }
});
