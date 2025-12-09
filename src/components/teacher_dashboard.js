// components/teacher_dashboard.js
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import "./teacher_dashboard.css"; // We'll create this CSS file

function TeacherDashboard() {
  // State variables for user data and classes
  const [userDetails, setUserDetails] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pendingGrading, setPendingGrading] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user details and classes when component mounts
  useEffect(() => {
    fetchUserData();
    fetchTeacherClasses();
  }, []);

  // Fetch current user's profile data from Firestore
  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Get user document from Firestore
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserDetails(userData);
          
          // Check if user is actually a teacher
          if (userData.role !== "teacher") {
            toast.error("Access Denied: Teachers only", {
              position: "top-center",
            });
            window.location.href = "/login";
          }
        } else {
          console.log("User document not found");
        }
      } else {
        // If not logged in, redirect to login page
        console.log("User is not logged in");
        window.location.href = "/login";
      }
    });
  };

  // Fetch all classes taught by this teacher
  const fetchTeacherClasses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Query Firestore for classes where teacherId matches current user
      const classesQuery = query(
        collection(db, "classes"),
        where("teacherId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(classesQuery);
      const classesData = [];
      
      // Loop through each class document
      querySnapshot.forEach((doc) => {
        classesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setClasses(classesData);
      
      // TODO: Calculate pending grading count
      // This will be implemented when we add the grading feature
      setPendingGrading(0);
      
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully", {
        position: "top-center",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Error logging out:", error.message);
      toast.error("Failed to logout", {
        position: "bottom-center",
      });
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      {/* Top Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-brand">
          <h2>Campus Hub - Teacher</h2>
        </div>
        <div className="navbar-user">
          {userDetails && (
            <>
              <span className="user-name">
                Welcome, {userDetails.firstName} {userDetails.lastName}
              </span>
              <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h3>Teacher Dashboard</h3>
          <button className="btn btn-primary">
            + Create New Class
          </button>
        </div>

        {/* Overview Cards */}
        <div className="overview-cards">
          {/* Total Classes Card */}
          <div className="overview-card">
            <div className="card-icon">
              <i className="bi bi-book"></i>
            </div>
            <div className="card-content">
              <h4>{classes.length}</h4>
              <p>Total Classes</p>
            </div>
          </div>

          {/* Pending Grading Card */}
          <div className="overview-card pending">
            <div className="card-icon">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div className="card-content">
              <h4>{pendingGrading}</h4>
              <p>Pending Grading</p>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="overview-card">
            <div className="card-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="card-content">
              <h4>
                {classes.reduce((total, cls) => total + (cls.students?.length || 0), 0)}
              </h4>
              <p>Total Students</p>
            </div>
          </div>

          {/* Announcements Card */}
          <div className="overview-card">
            <div className="card-icon">
              <i className="bi bi-megaphone"></i>
            </div>
            <div className="card-content">
              <h4>0</h4>
              <p>Recent Announcements</p>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="classes-section">
          <h4>My Classes</h4>
          
          {classes.length === 0 ? (
            // Show message if no classes exist
            <div className="no-classes">
              <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#ccc" }}></i>
              <p>No classes yet. Create your first class to get started!</p>
              <button className="btn btn-primary">Create Class</button>
            </div>
          ) : (
            // Display class cards in a grid
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div key={classItem.id} className="class-card">
                  {/* Class Thumbnail */}
                  <div className="class-thumbnail">
                    {classItem.thumbnail ? (
                      <img src={classItem.thumbnail} alt={classItem.name} />
                    ) : (
                      <div className="default-thumbnail">
                        {classItem.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Class Info */}
                  <div className="class-info">
                    <h5>{classItem.name}</h5>
                    <p className="class-description">{classItem.description}</p>
                    <p className="class-meta">
                      <span>
                        <i className="bi bi-people"></i> 
                        {classItem.students?.length || 0} students
                      </span>
                      <span>
                        <i className="bi bi-code-square"></i> 
                        {classItem.code}
                      </span>
                    </p>
                  </div>
                  
                  {/* Class Actions */}
                  <div className="class-actions">
                    <button className="btn btn-sm btn-primary">
                      Enter Class
                    </button>
                    <button className="btn btn-sm btn-outline-secondary">
                      <i className="bi bi-three-dots-vertical"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="quick-actions">
          <h4>Quick Actions</h4>
          <div className="actions-grid">
            <button className="action-btn">
              <i className="bi bi-file-earmark-plus"></i>
              <span>Create Assignment</span>
            </button>
            <button className="action-btn">
              <i className="bi bi-upload"></i>
              <span>Upload Materials</span>
            </button>
            <button className="action-btn">
              <i className="bi bi-check2-square"></i>
              <span>Grade Submissions</span>
            </button>
            <button className="action-btn">
              <i className="bi bi-graph-up"></i>
              <span>View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;