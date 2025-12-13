import { signInWithEmailAndPassword } from "firebase/auth";
import React, { useState } from "react";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import SignInwithGoogle from "./signInWIthGoogle";
import { doc, getDoc } from "firebase/firestore";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Login
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Fetch user profile from Firestore
      const userDoc = await getDoc(doc(db, "Users", user.uid));

      let role = null;

      if (userDoc.exists()) {
        const data = userDoc.data();
        role = data.role;       // REAL role from Firestore
      }

      // Redirect based on role
      if (role === "teacher") {
        window.location.href = "/teacher_dashboard";
      } else if (role === "student") {
        window.location.href = "/student_dashboard";
      } else if (role === "admin") {
        window.location.href = "/admin_dashboard";
      } else {
        // No role found → redirect to profile setup
        window.location.href = "/profile";
      }

      toast.success("Logged in successfully!", { position: "top-center" });

    } catch (error) {
      toast.error(error.message, { position: "bottom-center" });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Login</h3>

      {/* Email */}
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

      {/* Password */}
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

      {/* Submit */}
      <div className="d-grid">
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </div>

      <p className="forgot-password text-right">
        New user? <a href="/register">Register Here</a>
      </p>

      <SignInwithGoogle />
    </form>
  );
}

export default Login;
