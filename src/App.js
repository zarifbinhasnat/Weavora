import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChatAndDiscussion from "./components/teacher/ChatAndDiscussion";

function App() {
  return (
    <Router>
      <Routes>
        {/* FORCE ONLY ChatAndDiscussion */}
        <Route path="*" element={<ChatAndDiscussion />} />
      </Routes>
    </Router>
  );
}

export default App;

