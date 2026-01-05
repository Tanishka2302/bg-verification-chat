function Login() {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
  
        {/* ===== Background (same as Landing) ===== */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700" />
        <div className="absolute inset-0 bg-black/20" />
  
        {/* ===== Content ===== */}
        <div className="relative z-10 w-full max-w-lg px-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 text-center">
  
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              HR Login
            </h1>
  
            <p className="text-base sm:text-lg text-gray-600 mb-8">
              Sign in with Google to continue
            </p>
  
            <a
                href={`${import.meta.env.VITE_BACKEND_URL}/auth/google`}
                className="w-full inline-flex justify-center items-center gap-3
                    bg-blue-600 text-white text-lg font-medium
                    px-6 py-4 rounded-xl
                    hover:bg-blue-700 active:scale-[0.98]
                    transition-all duration-200 shadow-md"
                >
                {/* Google icon feel */}
                <span className="text-xl">🔐</span>
                Sign in with Google
             </a>

  
            {/* subtle footer */}
            <p className="mt-6 text-sm text-gray-400">
              Secure authentication powered by Google
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  export default Login;
  