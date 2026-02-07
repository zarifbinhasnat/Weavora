// components/teacher_dashboard.js
import React, { useEffect, useState, useRef } from "react";
import { auth, db, storage } from "./firebase";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import CreateClassModal from "./CreateClassModal";
import AIToolsModal from "./AIToolsModal";
import "./teacher_dashboard.css";

function TeacherDashboard() {
  // State variables for user data and classes
  const [userDetails, setUserDetails] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pendingGrading, setPendingGrading] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showAIToolsModal, setShowAIToolsModal] = useState(false);
  const [selectedAITool, setSelectedAITool] = useState(null);
  
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: ""
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const dropdownRef = useRef(null);

  // Fetch user details and classes when component mounts
  useEffect(() => {
    fetchUserData();
    fetchTeacherClasses();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch current user's profile data from Firestore
  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserDetails(userData);
          setEditForm({
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            email: userData.email || ""
          });
          
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
      const classesQuery = query(
        collection(db, "classes"),
        where("teacherId", "==", user.uid)
      );
      
      const querySnapshot = await getDocs(classesQuery);
      const classesData = [];
      
      querySnapshot.forEach((doc) => {
        classesData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setClasses(classesData);
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

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const user = auth.currentUser;
      const photoRef = ref(storage, `profile-photos/${user.uid}`);
      
      await uploadBytes(photoRef, file);
      const photoURL = await getDownloadURL(photoRef);
      
      // Update Firestore
      await updateDoc(doc(db, "Users", user.uid), {
        photo: photoURL
      });
      
      setUserDetails({ ...userDetails, photo: photoURL });
      toast.success("Profile photo updated!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "Users", user.uid), {
        firstName: editForm.firstName,
        lastName: editForm.lastName
      });
      
      setUserDetails({
        ...userDetails,
        firstName: editForm.firstName,
        lastName: editForm.lastName
      });
      
      setShowEditProfile(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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

  // Handle opening AI tool
  const handleOpenAITool = (toolName) => {
    setSelectedAITool(toolName);
    setShowAIToolsModal(true);
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
          <h2>🎓 Campus Hub - Teacher</h2>
        </div>
        <div className="navbar-user">
          {userDetails && (
            <>
              <span className="user-name">
                Welcome, {userDetails.firstName} {userDetails.lastName}
              </span>
              
              {/* Profile Dropdown */}
              <div className="profile-dropdown-container" ref={dropdownRef}>
                <button 
                  className="profile-btn"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  {userDetails.photo ? (
                    <img 
                      src={userDetails.photo} 
                      alt="Profile" 
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      {userDetails.firstName?.charAt(0)}{userDetails.lastName?.charAt(0)}
                    </div>
                  )}
                  <i className="bi bi-chevron-down ms-1"></i>
                </button>

                {/* Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="profile-dropdown-menu">
                    <div className="dropdown-header">
                      <div className="dropdown-user-info">
                        {userDetails.photo ? (
                          <img 
                            src={userDetails.photo} 
                            alt="Profile" 
                            className="dropdown-avatar"
                          />
                        ) : (
                          <div className="dropdown-avatar-placeholder">
                            {userDetails.firstName?.charAt(0)}{userDetails.lastName?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4>{userDetails.firstName} {userDetails.lastName}</h4>
                          <p>{userDetails.email}</p>
                          <span className="role-badge">Teacher</span>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowEditProfile(true);
                        setShowProfileDropdown(false);
                      }}
                    >
                      <i className="bi bi-person-circle"></i>
                      Edit Profile
                    </button>

                    <button className="dropdown-item">
                      <i className="bi bi-gear"></i>
                      Settings
                    </button>

                    <button className="dropdown-item">
                      <i className="bi bi-question-circle"></i>
                      Help & Support
                    </button>

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-item danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <div className="dashboard-container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h3>Teacher Dashboard</h3>
          <div className="header-actions">
            <button 
             className="btn ai-btn me-2"
              onClick={() => handleOpenAITool('chatbot')}
            >
              <i className="bi bi-robot"></i> AI Assistant
              </button>

            <button 
              className="btn ai-btn me-2"
              onClick={() => setShowCreateClassModal(true)}
            >
              <i className="bi bi-robot"></i> Create New Class
            </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon">
              <i className="bi bi-book"></i>
            </div>
            <div className="card-content">
              <h4>{classes.length}</h4>
              <p>Total Classes</p>
            </div>
          </div>

          <div className="overview-card pending">
            <div className="card-icon">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div className="card-content">
              <h4>{pendingGrading}</h4>
              <p>Pending Grading</p>
            </div>
          </div>

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

          <div className="overview-card ai-card">
            <div className="card-icon">
              <i className="bi bi-stars"></i>
            </div>
            <div className="card-content">
              <h4>AI Powered</h4>
              <p>Smart Features Active</p>
            </div>
          </div>
        </div>

        {/* AI Tools Section */}
        <div className="ai-tools-section">
          <h4>
            <i className="bi bi-magic"></i> AI-Powered Tools
          </h4>
          <div className="ai-tools-grid">
            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('grading')}
            >
              <div className="tool-icon grading">
                <i className="bi bi-clipboard-check"></i>
              </div>
              <h5>AI Auto-Grading</h5>
              <p>Automatic evaluation of assignments with smart marking suggestions</p>
              <span className="tool-badge">Advanced</span>
            </div>

            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('tutor')}
            >
              <div className="tool-icon tutor">
                <i className="bi bi-chat-dots"></i>
              </div>
              <h5>Course AI Tutor</h5>
              <p>RAG-based AI assistant trained on your course materials</p>
              <span className="tool-badge">Popular</span>
            </div>

            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('explainer')}
            >
              <div className="tool-icon explainer">
                <i className="bi bi-lightbulb"></i>
              </div>
              <h5>AI Lecture Explainer</h5>
              <p>Generate simplified summaries and explanations of lectures</p>
              <span className="tool-badge">New</span>
            </div>

            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('analyzer')}
            >
              <div className="tool-icon analyzer">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h5>Pass-Paper Analyzer</h5>
              <p>Analyze exam patterns and generate study recommendations</p>
              <span className="tool-badge">Insight</span>
            </div>

            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('summarizer')}
            >
              <div className="tool-icon summarizer">
                <i className="bi bi-mic"></i>
              </div>
              <h5>Meeting Summarizer</h5>
              <p>Transcribe and summarize lecture recordings automatically</p>
              <span className="tool-badge">Voice AI</span>
            </div>

            <div 
              className="ai-tool-card"
              onClick={() => handleOpenAITool('chatbot')}
            >
              <div className="tool-icon chatbot">
                <i className="bi bi-robot"></i>
              </div>
              <h5>AI Teaching Assistant</h5>
              <p>24/7 AI assistant for course queries and help</p>
              <span className="tool-badge">24/7</span>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className="classes-section">
          <h4>My Classes</h4>
          
          {classes.length === 0 ? (
            <div className="no-classes">
              <i className="bi bi-inbox" style={{ fontSize: "48px", color: "#ccc" }}></i>
              <p>No classes yet. Create your first class to get started!</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateClassModal(true)}
              >
                <i className="bi bi-plus-circle"></i> Create Class
              </button>
            </div>
          ) : (
            <div className="classes-grid">
              {classes.map((classItem) => (
                <div key={classItem.id} className="class-card">
                  <div className="class-thumbnail">
                    {classItem.thumbnail ? (
                      <img src={classItem.thumbnail} alt={classItem.name} />
                    ) : (
                      <div className="default-thumbnail">
                        {classItem.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
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
                  
                  <div className="class-actions">
                    <button className="btn btn-sm btn-primary">
                      <i className="bi bi-box-arrow-in-right"></i> Enter Class
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
            <button className="action-btn">
              <i className="bi bi-megaphone"></i>
              <span>Post Announcement</span>
            </button>
            <button className="action-btn">
              <i className="bi bi-calendar-event"></i>
              <span>Schedule Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className="bi bi-person-circle"></i> Edit Profile
              </h3>
              <button className="close-btn" onClick={() => setShowEditProfile(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body">
                {/* Profile Photo Section */}
                <div className="profile-photo-section">
                  <div className="current-photo">
                    {userDetails.photo ? (
                      <img src={userDetails.photo} alt="Profile" />
                    ) : (
                      <div className="photo-placeholder">
                        {userDetails.firstName?.charAt(0)}{userDetails.lastName?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="photo-upload">
                    <label htmlFor="photo-upload" className="upload-label">
                      {uploadingPhoto ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-camera"></i> Change Photo
                        </>
                      )}
                    </label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      style={{ display: "none" }}
                    />
                    <small className="text-muted">Max size: 5MB</small>
                  </div>
                </div>

                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Email (Read-only)</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.email}
                    disabled
                  />
                  <small className="text-muted">Email cannot be changed</small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditProfile(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-custom">
                <i className="bi bi-check-circle"></i> Save Changes
             </button>

              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateClassModal && (
        <CreateClassModal
          isOpen={showCreateClassModal}
          onClose={() => setShowCreateClassModal(false)}
          onClassCreated={fetchTeacherClasses}
        />
      )}

      {showAIToolsModal && (
        <AIToolsModal
          isOpen={showAIToolsModal}
          onClose={() => setShowAIToolsModal(false)}
          toolType={selectedAITool}
          userDetails={userDetails}
        />
      )}
    </div>
  );
}

export default TeacherDashboard;