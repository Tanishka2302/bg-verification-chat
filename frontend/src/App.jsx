import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const socketRef = useRef(null);

  // --- Core States ---
  const [roomId, setRoomId] = useState(null);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("HR");
  const [connected, setConnected] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const [progress, setProgress] = useState({
    answered: 0,
    status: "pending",
  });

  // --- URL & Auth States ---
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("token");
  const candidateId = "c819ebdf-9f1e-4229-bd47-481015e361e8";
  
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);

  /* ================= 1. AUTH CHECK (First Priority) ================= */
  useEffect(() => {
    fetch(`${BACKEND_URL}/auth/me`, {
      credentials: "include", 
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data);
        setAuthChecked(true);
      })
      .catch(() => {
        setUser(null);
        setAuthChecked(true);
      });
  }, []);

  /* ================= 2. SOCKET SETUP ================= */
  useEffect(() => {
    if (!authChecked) return;
    if (!user && !inviteToken) return;
    if (socketRef.current) return;

    const socket = io(BACKEND_URL, { 
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (inviteToken) {
        socket.emit("join_with_token", inviteToken);
      } else {
        const savedRoom = localStorage.getItem("roomId");
        savedRoom
          ? socket.emit("join_existing_room", savedRoom)
          : socket.emit("create_room", { candidateId });
      }
    });

    socket.on("joined_room", ({ roomId, role }) => {
      setRoomId(roomId);
      setRole(role);
      if (role === "HR") localStorage.setItem("roomId", roomId);
    });

    socket.on("room_created", ({ roomId }) => {
      setRoomId(roomId);
      setRole("HR");
      localStorage.setItem("roomId", roomId);
    });

    socket.on("receive_message", (msg) => {
      setChat((prev) => [
        ...prev,
        { ...msg, sender: msg.sender || msg.sender_role },
      ]);
    });

    socket.on("verification_progress", setProgress);
    socket.on("disconnect", () => setConnected(false));

    return () => {
      if (socketRef.current) {
        socketRef.current.off();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authChecked, user, inviteToken]);

  /* ================= 3. LOAD CHAT HISTORY ================= */
  useEffect(() => {
    if (!roomId) return;

    fetch(`${BACKEND_URL}/rooms/${roomId}/messages`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setChat(Array.isArray(data) ? data : []))
      .catch(() => setChat([]));
  }, [roomId]);

  /* ================= 4. CORE CHAT LOGIC ================= */
  const systemQuestions = chat.filter((m) => m.sender === "SYSTEM");
  const refereeAnswers = chat.filter((m) => m.sender === "REFEREE" && m.is_answer);

  const answeredCount = Math.min(refereeAnswers.length, systemQuestions.length);
  const currentQuestion = systemQuestions[answeredCount] || null;

  const getRelatedQuestion = (msg) => {
    const index = refereeAnswers.indexOf(msg);
    return systemQuestions[index] || null;
  };

  const sendMessage = (text) => {
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      text,
      questionIndex: role === "REFEREE" ? answeredCount : null,
    });
    setMessage("");
  };

  const createInvite = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.inviteLink) {
        setInviteLink(data.inviteLink);
        navigator.clipboard.writeText(data.inviteLink);
        alert("Invite link copied!");
      }
    } catch (err) {
      console.error("Invite failed", err);
    }
  };

  /* ================= 5. FINAL PRODUCTION GUARDS ================= */

  // Phase 1: Authentication in progress
  if (!authChecked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Verifying Session...</p>
      </div>
    );
  }

  // Phase 2: Not Logged In & No Token -> Proceed to Login
  if (!user && !inviteToken) {
    window.location.href = "/login";
    return null;
  }

  // Phase 3: Waiting for WebSocket Connection
  if (!connected) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 italic">Connecting to secure server...</p>
      </div>
    );
  }
  /* ================= 6. MAIN UI ================= */
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen w-full flex justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row shadow-2xl overflow-hidden">
        
        {/* LEFT PANEL */}
        <div className="hidden lg:flex w-[320px] bg-white border-r px-8 py-10 flex-col">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Verification Portal
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Logged in as <span className="font-semibold text-blue-600">{user?.name || "Referee"}</span>
          </p>

          <div className="mt-12">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-4">
              Current Progress
            </p>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{
                  width: `${(answeredCount / systemQuestions.length) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-3 font-medium">
              {answeredCount} of {systemQuestions.length} requirements met
            </p>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">
              Status
            </p>
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold uppercase ${
              progress.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {progress.status}
            </span>
          </div>

          {role === "HR" && (
            <div className="mt-12 space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem("roomId");
                  socketRef.current.emit("create_room", { candidateId });
                }}
                className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black transition-colors"
              >
                New Session
              </button>
              {roomId && (
                <button
                  onClick={createInvite}
                  className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  Copy Invite Link
                </button>
              )}
            </div>
          )}

          <div className="mt-auto pt-6 border-t text-xs font-medium text-gray-400 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {connected ? "LIVE SERVER" : "OFFLINE"} | {role} ACCESS
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col bg-white/50 backdrop-blur-sm">
          <div className="h-16 bg-white/80 border-b flex items-center px-10 text-sm font-medium text-gray-500 italic">
            End-to-end encrypted communication session for candidate {candidateId.split('-')[0]}...
          </div>

          <div className="flex-1 px-4 sm:px-10 py-6 flex justify-center overflow-hidden">
            <div className="w-full max-w-[900px] bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
              
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
                {role === "HR" && (
                  <div className="text-center pb-6 border-b border-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Review Stream</h3>
                    <p className="text-sm text-gray-400">Incoming referee verification data</p>
                  </div>
                )}
                
                {role === "REFEREE" && currentQuestion && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] px-6 py-5 rounded-2xl bg-blue-600 text-white text-lg shadow-lg shadow-blue-100 font-medium">
                      {currentQuestion.text}
                    </div>
                  </motion.div>
                )}

                {chat.filter((m) => m.sender !== "SYSTEM").map((m, i) => {
                  const isOwn = m.sender === role;
                  const isRefereeAnswer = m.sender === "REFEREE" && m.is_answer;
                  const relatedQuestion = isRefereeAnswer ? getRelatedQuestion(m) : null;

                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                      {role === "HR" ? (
                        isRefereeAnswer ? (
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6">
                            <p className="text-[10px] uppercase font-black text-slate-400 mb-4 tracking-tighter">Verified Entry</p>
                            {relatedQuestion && <p className="text-sm italic text-slate-500 mb-2 font-medium">" {relatedQuestion.text} "</p>}
                            <p className="text-lg text-slate-900 font-semibold">{m.text}</p>
                          </div>
                        ) : (
                          <div className="max-w-[70%] px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium border border-gray-200">{m.text}</div>
                        )
                      ) : (
                        <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-lg shadow-sm ${isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                          {isOwn && isRefereeAnswer && relatedQuestion && (
                            <div className="mb-2 text-xs text-blue-100 border-l-2 border-blue-200 pl-3 opacity-80 italic">Context: {relatedQuestion.text}</div>
                          )}
                          {m.text}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={role === "REFEREE" && currentQuestion ? "Please provide your detailed response..." : "Send a message..."}
                    rows={2}
                    className="flex-1 resize-none border border-gray-200 rounded-xl px-5 py-4 text-base focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                  />
                  <button
                    onClick={() => sendMessage(message)}
                    disabled={!roomId || !message.trim()}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-30 transition-all shadow-md active:scale-95"
                  >
                    SENT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default App;