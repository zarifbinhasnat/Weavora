// App.js
import React, { useEffect, useState } from "react";
import ChatBox from "./components/ChatBox";
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./components/login";
import SignUp from "./components/register";
import TeacherDashboard from "./components/teacher_dashboard";
import Profile from "./components/profile"; // ← UNCOMMENT THIS

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth, db } from "./components/firebase";
import { doc, getDoc } from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // ← NEW: Store user role
  const [loading, setLoading] = useState(true); // ← NEW: Loading state

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // User is logged in, fetch their role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserRole(userData.role); // Set role (teacher/student)
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        // User is logged out
        setUserRole(null);
      }
      
      setLoading(false); // Done loading
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="App" style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <div className="auth-wrapper">
          <div className="auth-inner">
            <Routes>
              {/* Home Route - Redirect based on authentication and role */}
              <Route
                path="/"
                element={
                  user ? (
                    // User is logged in, check role
                    userRole === "teacher" ? (
                      <Navigate to="/teacher-dashboard" />
                    ) : (
                      <Navigate to="/profile" />
                    )
                  ) : (
                    // User not logged in, show login
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Login Route */}
              <Route 
                path="/login" 
                element={user ? <Navigate to="/" /> : <Login />} 
              />

              {/* Register Route */}
              <Route 
                path="/register" 
                element={user ? <Navigate to="/" /> : <SignUp />} 
              />

              {/* Teacher Dashboard - Only accessible by teachers */}
              <Route
                path="/teacher-dashboard"
                element={
                  user ? (
                    userRole === "teacher" ? (
                      <TeacherDashboard />
                    ) : (
                      // Not a teacher, redirect to profile
                      <Navigate to="/profile" />
                    )
                  ) : (
                    // Not logged in, redirect to login
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Student Profile - Only accessible by students */}
              <Route
                path="/profile"
                element={
                  user ? (
                    <Profile />
                  ) : (
                    // Not logged in, redirect to login
                    <Navigate to="/login" />
                  )
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            
            {/* Toast notifications */}
            <ToastContainer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;