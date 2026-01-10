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
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const name = profile.displayName;

        const { rows } = await pool.query(
          "SELECT * FROM users WHERE google_id = $1",
          [googleId]
        );

        let user = rows[0];

        if (!user) {
          const res = await pool.query(
            `INSERT INTO users (google_id, email, name, role)
             VALUES ($1, $2, $3, 'HR')
             RETURNING *`,
            [googleId, email, name]
          );
          user = res.rows[0];
        }

        return done(null, user.id); // 👈 STORE ONLY ID
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((id, done) => {
  done(null, id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    done(null, rows[0] || null);
  } catch (err) {
    done(err);
  }
});
