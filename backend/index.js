import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pool from "./db.js";
import passport from "passport";
import session from "express-session";
import authRoutes from "./routes/auth.js";
import "./passport.js";
import pgSession from "connect-pg-simple";

const PgSession = pgSession(session);
dotenv.config();

const app = express();
const server = http.createServer(app);

/* ===============================
    MIDDLEWARE & SECURITY
================================ */

// Trusting the proxy is mandatory for Render/Vercel to handle HTTPS cookies
app.set("trust proxy", 1); 

const allowedOrigins = [
  "http://localhost:5173",
  "https://bg-verification-chat.vercel.app",
  "https://bg-verification-chat-frontend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true, // Required to allow cookies to be sent
  })
);

app.use(express.json());

const isProduction = process.env.NODE_ENV === "production";
app.use(
  session({
    store: new PgSession({ pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, 
    cookie: {
      secure: true, 
      sameSite: "none", // REQUIRED for cross-subdomain
      httpOnly: true,
      partitioned: true, // REQUIRED for modern Chrome
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

/* ===============================
    ROUTES
================================ */

app.use("/auth", authRoutes);

/* ===============================
    SOCKET.IO SETUP
================================ */

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

/* ===============================
    CONSTANTS & HELPERS
================================ */

const TOTAL_QUESTIONS = 5;
const VERIFICATION_QUESTIONS = [
  "Can you confirm the candidate’s job title?",
  "What was the employment duration (from – to)?",
  "Can you briefly describe their responsibilities?",
  "How would you rate their performance?",
  "Would you rehire this candidate? (Yes / No / Neutral)",
];

async function updateVerificationStatus(roomId) {
  const res = await pool.query(
    `SELECT COUNT(*) FROM messages WHERE room_id = $1 AND is_answer = true`,
    [roomId]
  );

  const answered = Number(res.rows[0].count);
  let status = "pending";

  if (answered >= TOTAL_QUESTIONS) {
    status = "completed";
    await pool.query(
      `UPDATE verification_rooms SET is_closed = true WHERE id = $1`,
      [roomId]
    );
  } else if (answered > 0) {
    status = "partial";
  }

  return { answered, status };
}

/* ===============================
    REST API
================================ */

app.get("/rooms/:roomId/messages", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sender_role AS sender, content AS text, is_answer
       FROM messages WHERE room_id = $1 ORDER BY created_at`,
      [req.params.roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.json([]);
  }
});

app.post("/invite", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "roomId is required" });

  try {
    const roomRes = await pool.query(
      `SELECT expires_at, is_closed FROM verification_rooms WHERE id = $1`,
      [roomId]
    );

    if (roomRes.rowCount === 0) return res.status(404).json({ error: "Room not found" });

    const { expires_at, is_closed } = roomRes.rows[0];
    if (is_closed) return res.status(400).json({ error: "Room is closed" });
    if (expires_at && new Date(expires_at) < new Date()) return res.status(400).json({ error: "Room expired" });

    const token = jwt.sign(
      { roomId, role: "REFEREE" },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      inviteLink: `${process.env.FRONTEND_URL}/verify?token=${token}`,
    });
  } catch (err) {
    console.error("Invite error:", err.message);
    res.status(500).json({ error: "Failed to generate invite" });
  }
});

/* ===============================
    SOCKET EVENTS
================================ */

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join_with_token", async (token) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const roomRes = await pool.query(
        `SELECT expires_at, is_closed FROM verification_rooms WHERE id = $1`,
        [payload.roomId]
      );

      if (roomRes.rowCount === 0) return socket.emit("error", "Room not found");
      const { expires_at, is_closed } = roomRes.rows[0];
      if (is_closed) return socket.emit("error", "Verification completed");
      if (expires_at && new Date(expires_at) < new Date()) return socket.emit("error", "Invite expired");

      socket.role = "REFEREE";
      socket.roomId = payload.roomId;
      socket.join(payload.roomId);
      socket.emit("joined_room", { roomId: payload.roomId, role: "REFEREE" });
    } catch {
      socket.emit("error", "Invalid or expired invite");
    }
  });

  socket.on("create_room", async ({ candidateId }) => {
    try {
      const result = await pool.query(
        `INSERT INTO verification_rooms (candidate_id, expires_at)
         VALUES ($1, NOW() + INTERVAL '3 hours') RETURNING id`,
        [candidateId]
      );
      const roomId = result.rows[0].id;
      socket.role = "HR";
      socket.roomId = roomId;
      socket.join(roomId);
      socket.emit("room_created", { roomId });

      for (const q of VERIFICATION_QUESTIONS) {
        await pool.query(
          `INSERT INTO messages (room_id, sender_role, content) VALUES ($1,'SYSTEM',$2)`,
          [roomId, q]
        );
      }
      io.to(roomId).emit("verification_progress", { answered: 0, status: "pending" });
    } catch (err) {
      console.error("Create room error:", err.message);
    }
  });

  socket.on("join_existing_room", async (roomId) => {
    const roomRes = await pool.query(
      `SELECT expires_at, is_closed FROM verification_rooms WHERE id = $1`,
      [roomId]
    );

    if (roomRes.rowCount === 0 || roomRes.rows[0].is_closed || 
       (roomRes.rows[0].expires_at && new Date(roomRes.rows[0].expires_at) < new Date())) {
      return socket.emit("force_create_room");
    }

    socket.role = "HR";
    socket.roomId = roomId;
    socket.join(roomId);
    socket.emit("joined_room", { roomId, role: "HR" });
  });

  socket.on("send_message", async ({ text, questionIndex }) => {
    if (!socket.roomId || !text) return;
    const isAnswer = socket.role === "REFEREE";

    await pool.query(
      `INSERT INTO messages (room_id, sender_role, content, is_answer, question_index)
       VALUES ($1,$2,$3,$4,$5)`,
      [socket.roomId, socket.role, text, isAnswer, questionIndex]
    );

    const progress = await updateVerificationStatus(socket.roomId);
    io.to(socket.roomId).emit("receive_message", {
      sender: socket.role,
      text,
      is_answer: isAnswer,
      question_index: questionIndex,
    });
    io.to(socket.roomId).emit("verification_progress", progress);
  });

  socket.on("disconnect", () => console.log("🔴 Socket disconnected:", socket.id));
});

/* ===============================
    SERVER START
================================ */
app.use(express.static("dist"));
 
app.use((req, res) => res.status(404).send("Not Found"));
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("🚀 Server running on port", PORT));