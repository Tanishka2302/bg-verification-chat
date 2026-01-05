import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function App() {
  const socketRef = useRef(null);

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

  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get("token");
  const candidateId = "c819ebdf-9f1e-4229-bd47-481015e361e8";

  /* ================= SOCKET SETUP ================= */
  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(BACKEND_URL, { withCredentials: true });
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
    socket.on("room_created", ({ roomId }) => {
      console.log("ROOM CREATED:", roomId);
      setRoomId(roomId);
    });
    socket.on("joined_room", ({ roomId, role }) => {
      console.log("JOINED ROOM:", roomId, role);
      setRoomId(roomId);
      setRole(role);
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
      socket.off();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [inviteToken]);

  /* ================= LOAD CHAT HISTORY ================= */
  useEffect(() => {
    if (!roomId) return;

    fetch(`${BACKEND_URL}/rooms/${roomId}/messages`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setChat(Array.isArray(data) ? data : []))
      .catch(() => setChat([]));
  }, [roomId]);

  /* ================= QUESTION LOGIC ================= */
  const systemQuestions = chat.filter((m) => m.sender === "SYSTEM");
  const refereeAnswers = chat.filter(
    (m) => m.sender === "REFEREE" && m.is_answer
  );

  const answeredCount = Math.min(
    refereeAnswers.length,
    systemQuestions.length
  );

  /* ================= SEND MESSAGE ================= */
  const sendMessage = (text) => {
    if (!text.trim() || !socketRef.current) return;

    socketRef.current.emit("send_message", {
      text,
      questionIndex: role === "REFEREE" ? answeredCount : null,
    });

    setMessage("");
  };

  /* ================= CREATE INVITE ================= */
  const createInvite = async () => {
    if (!roomId) return;

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
  };

  /* ================= LOADING ================= */
  if (!connected) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Connecting…
      </div>
    );
  }

 

  /* ================= UI ================= */
return (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="h-screen w-screen flex justify-center 
    bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
  >
<div className="w-full max-w-[1400px] flex flex-col lg:flex-row">



      {/* ================= LEFT PANEL ================= */}
      <div className="hidden lg:flex w-[300px] bg-[#f8fafc] border-r px-6 py-8 flex-col">


        <h1 className="text-2xl font-semibold text-gray-900">
          Background Verification
        </h1>
        <p className="text-base text-gray-500 mt-1">
          Internal HR workflow
        </p>

        {/* Progress */}
        <div className="mt-10">
          <p className="text-base font-medium text-gray-700 mb-2">
            Progress
          </p>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${(answeredCount / systemQuestions.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-base text-gray-600 mt-3">
            {answeredCount} of {systemQuestions.length} answered
          </p>
        </div>

        {/* Status */}
        <div className="mt-8">
          <p className="text-base font-medium text-gray-700 mb-2">
            Status
          </p>
          <span className="inline-block px-5 py-2 rounded-full text-base font-medium bg-blue-100 text-blue-700">
            {progress.status}
          </span>
        </div>

        {/* HR Actions */}
        {role === "HR" && (
          <div className="mt-10 space-y-4">
            <button
              onClick={() => {
                localStorage.removeItem("roomId");
                socketRef.current.emit("create_room", { candidateId });
              }}
              className="w-full py-3 rounded-md bg-gray-900 text-white text-base hover:bg-gray-800"
            >
              Start New Verification
            </button>

            {roomId && (
              <button
                onClick={createInvite}
                className="w-full py-3 rounded-md border border-gray-300 bg-white text-base hover:bg-gray-50"
              >
                Invite Referee
              </button>
            )}
          </div>
        )}

        <div className="mt-auto text-base text-gray-500">
          {connected ? "🟢 Connected" : "🔴 Disconnected"} · {role}
        </div>
      </div>

      {/* ================= RIGHT CONTENT ================= */}
      <div className="flex-1 flex flex-col">

        {/* Top Bar */}
        <div className="h-16 bg-white border-b flex items-center px-10 text-base text-gray-600">
          Secure referee communication — all responses are logged
        </div>

        {/* ================= CHAT WINDOW ================= */}
        <div className="flex-1 px-3 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 flex justify-center">

        <div className="w-full max-w-full sm:max-w-[720px] lg:max-w-[900px] 
  bg-white border rounded-xl shadow-sm flex flex-col">

            {/* ================= MESSAGES ================= */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

              {/* ===== HR HEADER (ONLY FOR HR) ===== */}
              {role === "HR" && (
                <div className="text-center mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Referee Responses
                  </h3>
                  <p className="text-base text-gray-500 mt-1">
                    Answers submitted by the referee will appear below
                  </p>
                  <div className="mt-4 border-b border-gray-200" />
                </div>
              )}
              
  

              {/* ===== SYSTEM QUESTION (REFEREE ONLY) ===== */}
              {role === "REFEREE" && currentQuestion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[90%] sm:max-w-[75%] lg:max-w-[70%]px-6 py-4 rounded-2xl 
                    bg-gray-200 text-gray-900 text-lg 
                    border-l-4 border-blue-500 shadow-sm">
                    {currentQuestion.text}
                  </div>
                </motion.div>
              )}

{/* ================= CHAT HISTORY ================= */}
{chat
  .filter((m) => m.sender !== "SYSTEM")
  .map((m, i) => {
    const isOwn = m.sender === role;
    const isRefereeAnswer = m.sender === "REFEREE" && m.is_answer === true;
    const relatedQuestion = isRefereeAnswer ? getRelatedQuestion(m) : null;

    return (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      >
        {/* ================= HR VIEW ================= */}
        {role === "HR" ? (
          isRefereeAnswer ? (
            /* ✅ Referee answer card (HR view) */
            <div className="w-full bg-blue-50 border border-blue-100 rounded-xl p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-blue-600 font-semibold mb-3">
                Referee Answer
              </p>

              {relatedQuestion && (
                <p className="text-base text-gray-600 mb-4 border-l-4 border-blue-400 pl-4">
                  {relatedQuestion.text}
                </p>
              )}

              <p className="text-lg text-gray-900 leading-relaxed">
                {m.text}
              </p>
            </div>
          ) : (
            /* ✅ HR normal chat bubble */
            <div className="max-w-[60%] px-5 py-3 rounded-2xl bg-gray-200 text-gray-900 text-lg shadow">
              {m.text}
            </div>
          )
        ) : (
          /* ================= REFEREE VIEW ================= */
          <div
            className={`max-w-[70%] px-6 py-4 rounded-2xl text-lg shadow
              ${
                isOwn
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-gray-200 text-gray-900 rounded-bl-md"
              }`}
          >
            {/* ✅ Reply-to-question restored */}
            {isOwn && isRefereeAnswer && relatedQuestion && (
              <div className="mb-3 text-base text-blue-100 border-l-4 border-blue-300 pl-4 opacity-90">
                Replying to: {relatedQuestion.text}
              </div>
            )}
            {m.text}
          </div>
        )}
      </motion.div>
    );
  })}
</div>
            {/* ================= INPUT ================= */}
            <div className="border-t bg-[#f8fafc] px-3 sm:px-6 py-4 sm:py-6 sticky bottom-0">

              <div className="flex gap-4 items-end">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    role === "REFEREE" && currentQuestion
                      ? "Type your answer here…"
                      : "Type a message…"
                  }
                  rows={4}
                  className="flex-1 resize-none border-2 border-gray-300 rounded-lg 
                    px-5 py-4 text-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    sendMessage(message);
                    setMessage("");
                  }}
                  disabled={!roomId || !message.trim()}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg 
                    hover:bg-blue-700 disabled:opacity-40"
                >
                  Send
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