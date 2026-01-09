import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./Landing";
import Login from "./pages/Login";
import App from "./App";

function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Root;
