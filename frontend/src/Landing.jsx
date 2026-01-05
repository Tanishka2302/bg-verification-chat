import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      navigate(`/verify?token=${token}`, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* ===== Background ===== */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
      <div className="absolute inset-0 bg-black/20" />

      {/* ===== Content ===== */}
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 text-center">

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Background Verification
          </h1>

          <p className="text-base sm:text-lg text-gray-600 mb-8">
            Secure, real-time verification between HR and referees
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 text-white text-lg font-medium
              px-6 py-4 rounded-xl
              hover:bg-blue-700 active:scale-[0.98]
              transition-all duration-200 shadow-md"
          >
            I am HR — Start Verification
          </button>

          {/* subtle footer */}
          <p className="mt-6 text-sm text-gray-400">
            Trusted • Secure • Real-time
          </p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
