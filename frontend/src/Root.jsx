import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

/* ================= ROOT ================= */
function Root() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Login */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* The /verify route renders App.jsx. 
          App.jsx now handles its own internal loading states and 
          redirects, which is more stable for OAuth flows.
        */}
        <Route path="/verify" element={<App />} />

        {/* Optional: Catch-all redirect to Landing */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Root;