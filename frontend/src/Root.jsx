import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* ✅ NO PROTECTED ROUTE */}
        {/* Google OAuth already controls access */}
        <Route path="/verify" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Root;
