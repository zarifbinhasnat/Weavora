
// components/CreateClassModal.js
import React, { useState } from "react";
import { db, auth } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import "./CreateClassModal.css";

function CreateClassModal({ isOpen, onClose, onClassCreated }) {
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Generate random 6-character class code
  const generateClassCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const classCode = generateClassCode();

      await addDoc(collection(db, "classes"), {
        name: className,
        description: description,
        subject: subject,
        section: section,
        teacherId: user.uid,
        code: classCode,
        students: [],
        createdAt: new Date(),
      });

      toast.success("Class created successfully!", {
        position: "top-center",
      });

      onClassCreated();
      onClose();
      
      // Reset form
      setClassName("");
      setDescription("");
      setSubject("");
      setSection("");

    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to create class", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="create-class-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="bi bi-plus-circle"></i> Create New Class
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Class Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Introduction to Computer Science"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Brief description of the class..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Computer Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Section A"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Create Class
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateClassModal;