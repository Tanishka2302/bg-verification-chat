import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://bg-verification-chat.onrender.com/auth/google/callback",
      scope: ["profile", "email"], // Added correctly here
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // 1. Check if user exists in DB
        let res = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
        
        if (res.rows.length === 0) {
          // 2. Create user if they don't exist
          res = await pool.query(
            "INSERT INTO users (google_id, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [googleId, email, name, "HR"]
          );
        }

        const user = res.rows[0];
        return done(null, user);
      } catch (err) {
        console.error("Error in Google Strategy Callback:", err);
        return done(err, null);
      }
    }
  )
);

// Store only the ID in the session cookie
passport.serializeUser((user, done) => {
  done(null, user.id); 
});

// Use that ID to fetch the full user from DB on every request
passport.deserializeUser(async (id, done) => {
  try {
    // If 'id' is accidentally an object (from an old session), handle it
    const actualId = (typeof id === 'object' && id !== null) ? id.id : id;

    const res = await pool.query('SELECT * FROM "users" WHERE id = $1', [actualId]);
    const user = res.rows[0];
    done(null, user);
  } catch (err) {
    console.error("Error in deserializeUser:", err);
    done(err, null);
  }
});