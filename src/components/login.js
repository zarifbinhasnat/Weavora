// components/login.js
import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";
import { doc, getDoc } from "firebase/firestore";

function Login() {
  // State variables for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sign in user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("User logged in Successfully");

      // Fetch user profile from Firestore to check role
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userData.role = "teacher "; // For testing purpose only
        // Check user role and redirect accordingly
        if (userData.role === "teacher") {
          // Redirect to teacher dashboard
          window.location.href = "/teacher-dashboard";
        } else {
          // Redirect to student profile/dashboard
          window.location.href = "/teacher-dashboard";
        }
      } else {
        // If no user data found in Firestore, redirect to profile by default
        window.location.href = "/teacher-dashboard";
      }

      // Show success message
      toast.success("User logged in Successfully", {
        position: "top-center",
      });
      
    } catch (error) {
      console.log(error.message);

      // Show error message
      toast.error(error.message, {
        position: "bottom-center",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>

      {/* Email Input */}
      <div className="mb-3">
        <label>Email address</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* Password Input */}
      <div className="mb-3">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {/* Submit Button */}
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>

      {/* Link to Registration */}
      <p className="forgot-password text-right">
        New user <a href="/register">Register Here</a>
      </p>

      {/* Google Sign In Component */}
      <SignInwithGoogle />
    </form>
  );
}

export default Login;