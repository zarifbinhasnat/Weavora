/**
 * Main Server File - Local Backend Server
 * 
 * This file sets up the Express server with:
 * - Authentication endpoints (register, login)
 * - RAG (Retrieval Augmented Generation) endpoints for AI
 * - Middleware for CORS and JSON parsing
 * 
 * Why we're doing this:
 * - Replace Firebase backend with local server
 * - Handle authentication, file uploads, and messaging locally
 * - Keep your data on your laptop instead of cloud
 */

import express from "express";
import cors from "cors";
import { runRAG } from "./rag.js";
import { 
  initializeDatabase, 
  registerUser, 
  loginUser, 
  authenticateToken,
  requireTeacher,
  requireStudent,
  getUserById,
  updateUserProfile 
} from "./server/auth.js";
import {
  profilePhotoUpload,
  documentUpload,
  multipleDocumentsUpload,
  getFileUrl,
  deleteFile,
  saveEmbeddingsJSON,
  loadEmbeddingsJSON,
  UPLOAD_DIR
} from "./server/fileUpload.js";

const app = express();

// Enable CORS - allows frontend to communicate with backend
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Serve uploaded files statically
// This allows accessing files via: http://localhost:3001/uploads/folder/filename
app.use('/uploads', express.static(UPLOAD_DIR));

// Initialize database on server start
initializeDatabase();

// ============================================
// AUTHENTICATION ROUTES
// ============================================

/**
 * POST /api/auth/register
 * 
 * Register a new user
 * Request body: { email, password, firstName, lastName, role }
 * Response: { user, token }
 */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, password, firstName, lastName, role } = req.body;
        
        // Validate required fields
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: "Email, password, firstName, and lastName are required" 
            });
        }
        
        // Validate password length (minimum 6 characters)
        if (password.length < 6) {
            return res.status(400).json({ 
                error: "Password must be at least 6 characters" 
            });
        }
        
        // Register user and get token
        const result = await registerUser({ email, password, firstName, lastName, role });
        
        res.status(201).json(result);
    } catch (err) {
        console.error("Registration error:", err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * POST /api/auth/login
 * 
 * Login existing user
 * Request body: { email, password }
 * Response: { user, token }
 */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ 
                error: "Email and password are required" 
            });
        }
        
        // Login user and get token
        const result = await loginUser(email, password);
        
        res.json(result);
    } catch (err) {
        console.error("Login error:", err.message);
        res.status(401).json({ error: err.message });
    }
});

/**
 * GET /api/auth/me
 * 
 * Get current user's information
 * Requires: Authorization header with JWT token
 * Response: { user }
 */
app.get("/api/auth/me", authenticateToken, (req, res) => {
    try {
        // req.user is set by authenticateToken middleware
        const user = getUserById(req.user.id);
        res.json({ user });
    } catch (err) {
        console.error("Get user error:", err.message);
        res.status(404).json({ error: err.message });
    }
});

/**
 * PUT /api/auth/profile
 * 
 * Update user profile
 * Requires: Authorization header with JWT token
 * Request body: { firstName?, lastName?, photo? }
 * Response: { user }
 */
app.put("/api/auth/profile", authenticateToken, (req, res) => {
    try {
        const updates = req.body;
        const user = updateUserProfile(req.user.id, updates);
        res.json({ user });
    } catch (err) {
        console.error("Update profile error:", err.message);
        res.status(400).json({ error: err.message });
    }
});

// ============================================
// ROLE-BASED ROUTES (Examples)
// ============================================

/**
 * GET /api/teacher/dashboard
 * 
 * Example teacher-only route
 * Requires: Authorization header with JWT token AND teacher role
 * Response: Teacher dashboard data
 */
app.get("/api/teacher/dashboard", authenticateToken, requireTeacher, (req, res) => {
    // Only teachers can access this route
    res.json({ 
        message: "Welcome to teacher dashboard",
        teacherId: req.user.id,
        teacherEmail: req.user.email
    });
});

/**
 * GET /api/student/dashboard
 * 
 * Example student-only route
 * Requires: Authorization header with JWT token AND student role
 * Response: Student dashboard data
 */
app.get("/api/student/dashboard", authenticateToken, requireStudent, (req, res) => {
    // Only students can access this route
    res.json({ 
        message: "Welcome to student dashboard",
        studentId: req.user.id,
        studentEmail: req.user.email
    });
});

// ============================================
// FILE UPLOAD ROUTES
// ============================================

/**
 * POST /api/upload/profile-photo
 * 
 * Upload profile photo
 * Requires: Authorization header with JWT token
 * Form data: profilePhoto (file)
 * Response: { photoUrl }
 */
app.post("/api/upload/profile-photo", authenticateToken, (req, res) => {
    // Multer middleware handles the file upload
    profilePhotoUpload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        try {
            // Generate URL for the uploaded file
            const photoUrl = getFileUrl('profile-photos', req.file.filename);
            
            // Update user profile with new photo URL
            const user = updateUserProfile(req.user.id, { photo: photoUrl });
            
            res.json({ 
                photoUrl,
                message: 'Profile photo uploaded successfully',
                user
            });
        } catch (error) {
            // If database update fails, delete the uploaded file
            if (req.file) {
                deleteFile(req.file.path);
            }
            res.status(500).json({ error: error.message });
        }
    });
});

/**
 * POST /api/upload/document
 * 
 * Upload a single document (PDF, DOC, DOCX, TXT)
 * Requires: Authorization header with JWT token AND teacher role
 * Form data: document (file), courseId (string), title (string)
 * Response: { documentUrl, filename }
 */
app.post("/api/upload/document", authenticateToken, requireTeacher, (req, res) => {
    documentUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Get course ID and title from request body
        const { courseId, title } = req.body;
        
        if (!courseId || !title) {
            // Delete uploaded file if missing required fields
            deleteFile(req.file.path);
            return res.status(400).json({ 
                error: 'courseId and title are required' 
            });
        }
        
        // Generate URL for the uploaded document
        const documentUrl = getFileUrl('documents', req.file.filename);
        
        res.json({ 
            documentUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            courseId,
            title,
            uploadedBy: req.user.id,
            message: 'Document uploaded successfully'
        });
    });
});

/**
 * POST /api/upload/documents
 * 
 * Upload multiple documents at once
 * Requires: Authorization header with JWT token AND teacher role
 * Form data: documents (files), courseId (string)
 * Response: { files: [...] }
 */
app.post("/api/upload/documents", authenticateToken, requireTeacher, (req, res) => {
    multipleDocumentsUpload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const { courseId } = req.body;
        
        if (!courseId) {
            // Delete all uploaded files if courseId is missing
            req.files.forEach(file => deleteFile(file.path));
            return res.status(400).json({ error: 'courseId is required' });
        }
        
        // Generate URLs for all uploaded documents
        const uploadedFiles = req.files.map(file => ({
            documentUrl: getFileUrl('documents', file.filename),
            filename: file.filename,
            originalName: file.originalname,
            size: file.size
        }));
        
        res.json({ 
            files: uploadedFiles,
            count: uploadedFiles.length,
            courseId,
            uploadedBy: req.user.id,
            message: `${uploadedFiles.length} document(s) uploaded successfully`
        });
    });
});

/**
 * DELETE /api/upload/:folder/:filename
 * 
 * Delete an uploaded file
 * Requires: Authorization header with JWT token
 * Response: { message }
 */
app.delete("/api/upload/:folder/:filename", authenticateToken, (req, res) => {
    try {
        const { folder, filename } = req.params;
        const filePath = `${folder}/${filename}`;
        
        const deleted = deleteFile(filePath);
        
        if (deleted) {
            res.json({ message: 'File deleted successfully' });
        } else {
            res.status(404).json({ error: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// RAG (AI) ROUTES
// ============================================

/**
 * POST /api/ask
 * 
 * Ask a question using RAG (Retrieval Augmented Generation)
 * This uses your local embeddings stored in the embeddings/ folder
 * Request body: { question, course }
 * Response: { answer }
 */
app.post("/api/ask", async (req, res) => {
    try {
        const { question, course } = req.body;

        if (!question || !course) {
            return res.status(400).json({ error: "question and course required" });
        }

        const answer = await runRAG(question, course);
        res.json({ answer });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// SERVER START
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`✅ Local server running on http://localhost:${PORT}`);
    console.log(`\n📝 Authentication endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   GET  http://localhost:${PORT}/api/auth/me (requires token)`);
    console.log(`   PUT  http://localhost:${PORT}/api/auth/profile (requires token)`);
    console.log(`\n� File upload endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/upload/profile-photo (requires token)`);
    console.log(`   POST http://localhost:${PORT}/api/upload/document (requires teacher token)`);
    console.log(`   POST http://localhost:${PORT}/api/upload/documents (requires teacher token)`);
    console.log(`   DELETE http://localhost:${PORT}/api/upload/:folder/:filename (requires token)`);
    console.log(`\n👨‍🏫 Teacher-only endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/teacher/dashboard (requires teacher token)`);
    console.log(`\n👨‍🎓 Student-only endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/student/dashboard (requires student token)`);
    console.log(`\n🤖 RAG endpoint:`);
    console.log(`   POST http://localhost:${PORT}/api/ask`);
    console.log(`\n📁 Uploaded files accessible at:`);
    console.log(`   http://localhost:${PORT}/uploads/`);
});
