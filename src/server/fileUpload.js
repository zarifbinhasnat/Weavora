/**
 * File Upload Module - Local File Storage with Multer
 * 
 * This file handles file uploads without Firebase Storage.
 * It uses:
 * - Multer for handling multipart/form-data file uploads
 * - Local file system to store files on your laptop
 * - Organized folder structure for different file types
 * 
 * Why we're doing this:
 * - Replace Firebase Storage with local file storage
 * - Store files on your laptop instead of cloud
 * - Learn how file uploads work with Multer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from './db.js';

// Get current directory path (needed in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base upload directory - all files stored here
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'profile-photos'),
    path.join(UPLOAD_DIR, 'documents'),
    path.join(UPLOAD_DIR, 'embeddings'),
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Initialize directories on module load
createUploadDirs();

/**
 * Configure Multer Storage
 * 
 * This tells Multer:
 * 1. Where to save files (destination)
 * 2. What to name the files (filename)
 * 
 * File naming format: timestamp-randomstring-originalname.ext
 * Example: 1704067200000-abc123-document.pdf
 */
const storage = multer.diskStorage({
  // Determine destination folder based on file type
  destination: (req, file, cb) => {
    let folder = 'documents'; // default folder
    
    // Check file field name to determine folder
    if (file.fieldname === 'profilePhoto') {
      folder = 'profile-photos';
    } else if (file.fieldname === 'document') {
      folder = 'documents';
    }
    
    const uploadPath = path.join(UPLOAD_DIR, folder);
    cb(null, uploadPath);
  },
  
  // Generate unique filename
  filename: (req, file, cb) => {
    // Create unique filename: timestamp-randomid-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  }
});

/**
 * File Filter - Validate file types
 * 
 * This function checks if uploaded files are allowed.
 * Only accepts:
 * - Images (jpg, jpeg, png, gif) for profile photos
 * - Documents (pdf, doc, docx, txt) for course materials
 */
const fileFilter = (req, file, cb) => {
  // Allowed file extensions
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowedDocTypes = /pdf|doc|docx|txt/;
  
  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  // Check if it's a profile photo upload
  if (file.fieldname === 'profilePhoto') {
    if (allowedImageTypes.test(ext) && mimetype.startsWith('image/')) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed for profile photos'));
    }
  }
  
  // Check if it's a document upload
  if (file.fieldname === 'document') {
    if (allowedDocTypes.test(ext)) {
      return cb(null, true);
    } else {
      return cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed for documents'));
    }
  }
  
  // Default: accept file
  cb(null, true);
};

/**
 * Create Multer Upload Instances
 * 
 * Different upload configurations for different purposes:
 * - profilePhotoUpload: Single image, max 5MB
 * - documentUpload: Single document, max 10MB
 * - multipleDocumentsUpload: Multiple documents, max 10MB each
 */

// Profile photo upload (single file, max 5MB)
export const profilePhotoUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter
}).single('profilePhoto'); // Field name in form: 'profilePhoto'

// Single document upload (max 10MB)
export const documentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter
}).single('document'); // Field name in form: 'document'

// Multiple documents upload (max 10MB each, max 10 files)
export const multipleDocumentsUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // Max 10 files at once
  },
  fileFilter: fileFilter
}).array('documents', 10); // Field name in form: 'documents'

/**
 * Get File URL
 * 
 * Generates a URL to access uploaded file.
 * Format: http://localhost:3001/uploads/folder/filename.ext
 * 
 * @param {string} folder - Folder name (profile-photos, documents, etc.)
 * @param {string} filename - File name
 * @returns {string} Full URL to file
 */
export function getFileUrl(folder, filename) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  return `${baseUrl}/uploads/${folder}/${filename}`;
}

/**
 * Save file metadata to Postgres `files` table.
 * @param {Object} data - { ownerId, folder, filename, originalName, mimeType, size, relativePath }
 * @returns {Object} inserted row
 */
export async function saveFileMetadata(data) {
  const { ownerId = null, folder, filename, originalName, mimeType, size, relativePath } = data;
  const res = await pool.query(
    `INSERT INTO files (owner_id, folder, filename, original_name, mime_type, size, path)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [ownerId, folder, filename, originalName, mimeType, size, relativePath]
  );
  return res.rows[0];
}

/**
 * Delete File
 * 
 * Removes a file from the file system.
 * 
 * @param {string} filePath - Full path to file or just filename
 * @returns {boolean} True if deleted successfully
 */
export function deleteFile(filePath) {
  try {
    // If it's just a filename, construct full path
    let fullPath = filePath;
    if (!path.isAbsolute(filePath)) {
      fullPath = path.join(UPLOAD_DIR, filePath);
    }
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Deleted file: ${fullPath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Save Embeddings JSON
 * 
 * Saves embedding data as JSON file to local storage.
 * This replaces Firebase Storage for embeddings.
 * 
 * @param {string} courseId - Course identifier
 * @param {string} documentId - Document identifier
 * @param {Object} embeddingsData - Embedding data to save
 * @returns {string} File path to saved embeddings
 */
export function saveEmbeddingsJSON(courseId, documentId, embeddingsData) {
  // Create course-specific embeddings directory
  const courseEmbeddingsDir = path.join(UPLOAD_DIR, 'embeddings', courseId);
  if (!fs.existsSync(courseEmbeddingsDir)) {
    fs.mkdirSync(courseEmbeddingsDir, { recursive: true });
  }
  
  // Save embeddings as JSON file
  const filePath = path.join(courseEmbeddingsDir, `${documentId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(embeddingsData, null, 2));
  
  console.log(`✅ Saved embeddings: ${filePath}`);
  
  // Return relative path for database storage
  return `embeddings/${courseId}/${documentId}.json`;
}

/**
 * Load Embeddings JSON
 * 
 * Loads embedding data from local storage.
 * 
 * @param {string} relativePath - Relative path to embeddings file
 * @returns {Object} Parsed embedding data
 */
export function loadEmbeddingsJSON(relativePath) {
  const fullPath = path.join(UPLOAD_DIR, relativePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Embeddings file not found: ${relativePath}`);
  }
  
  const data = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(data);
}

// Export upload directory for use in server.js
export { UPLOAD_DIR };
