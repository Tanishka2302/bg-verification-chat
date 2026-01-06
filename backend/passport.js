import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js"; // Import your DB pool

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://bg-verification-chat.onrender.com/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // 1. Check if user exists in DB, if not, create them
        let res = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
        
        if (res.rows.length === 0) {
          res = await pool.query(
            "INSERT INTO users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [googleId, email, name, "HR"]
          );
        }

        const user = res.rows[0];
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// 2. Only store the user ID in the session
passport.serializeUser((user, done) => {
  done(null, user.id); 
});

// 3. Use the ID to get the full user object from the DB on every request
passport.deserializeUser(async (id, done) => {
  try {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    const user = res.rows[0];
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});