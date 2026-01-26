import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ClassroomPosts from "./components/teacher/ClassroomPosts";

function App() {
  return (
    <Router>
      <Routes>
        {/* TEMPORARY: bypass auth and show classroom messaging */}
        <Route path="*" element={<ClassroomPosts />} />
      </Routes>
    </Router>
  );
}

export default App;
