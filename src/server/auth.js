/**
 * Authentication Module - Local JWT-based Authentication
 * 
 * This file handles user authentication without Firebase.
 * It uses:
 * - JWT (JSON Web Tokens) for session management
 * - bcryptjs for secure password hashing
 * - SQLite database for storing user data locally
 * 
 * Why we're doing this:
 * - Replace Firebase Auth with local authentication
 * - Store user data on your laptop instead of cloud
 * - Learn how JWT authentication works
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';

// Get current directory path (needed in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: we use Postgres via `src/server/db.js` (pool)

// JWT Secret Key - Used to sign and verify tokens
// In production, this should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key';

// Token expiration time (7 days)
const TOKEN_EXPIRY = '7d';

/**
 * Initialize Database Tables
 * 
 * Creates the Users table if it doesn't exist.
 * This table stores:
 * - id: Unique identifier (auto-increment)
 * - email: User's email (must be unique)
 * - password: Hashed password (never store plain text!)
 * - firstName: User's first name
 * - lastName: User's last name
 * - role: Either 'student' or 'teacher'
 * - photo: URL to profile photo (optional)
 * - createdAt: Timestamp when user registered
 */
export function initializeDatabase() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      role TEXT DEFAULT 'student',
      photo TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createFilesTable = `
    CREATE TABLE IF NOT EXISTS files (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      folder TEXT,
      filename TEXT,
      original_name TEXT,
      mime_type TEXT,
      size BIGINT,
      path TEXT,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  return pool
    .query(createUsersTable)
    .then(() => pool.query(createFilesTable))
    .then(() => console.log('Postgres database initialized'))
    .catch((err) => console.error('Error initializing database:', err));
}

/**
 * Register a New User
 * 
 * Steps:
 * 1. Check if email already exists
 * 2. Hash the password using bcrypt (makes it unreadable)
 * 3. Insert user into database
 * 4. Generate JWT token for automatic login
 * 
 * @param {Object} userData - User registration data
 * @returns {Object} User data and JWT token
 */
export async function registerUser(userData) {
  const { email, password, firstName, lastName, role = 'student' } = userData;

  const validRoles = ['student', 'teacher'];
  if (!validRoles.includes(role)) {
    throw new Error('Invalid role. Must be either "student" or "teacher"');
  }

  // Check if user already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertRes = await pool.query(
    `INSERT INTO users (email, password, "firstName", "lastName", role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [email, hashedPassword, firstName, lastName, role]
  );

  const newUser = insertRes.rows[0];

  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  const { password: _, ...userWithoutPassword } = newUser;
  return { user: userWithoutPassword, token };
}

/**
 * Login User
 * 
 * Steps:
 * 1. Find user by email
 * 2. Compare provided password with stored hashed password
 * 3. Generate JWT token if password matches
 * 
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object} User data and JWT token
 */
export async function loginUser(email, password) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = res.rows[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

/**
 * Verify JWT Token
 * 
 * This middleware function checks if a request has a valid JWT token.
 * It's used to protect routes that require authentication.
 * 
 * How it works:
 * 1. Extract token from Authorization header
 * 2. Verify token signature
 * 3. Attach user data to request object
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function authenticateToken(req, res, next) {
  // Get token from Authorization header
  // Format: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    // Verify token and decode user data
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user data to request object
    // Now other routes can access req.user
    req.user = decoded;
    
    // Continue to next middleware/route
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require Teacher Role Middleware
 * 
 * This middleware checks if the authenticated user is a teacher.
 * Use this AFTER authenticateToken middleware to protect teacher-only routes.
 * 
 * Example usage in server.js:
 * app.post('/api/teacher/create-class', authenticateToken, requireTeacher, (req, res) => {
 *   // Only teachers can access this
 * });
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function requireTeacher(req, res, next) {
  // Check if user exists (should be set by authenticateToken)
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user role is teacher
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ 
      error: 'Access denied. Teacher role required.' 
    });
  }
  
  // User is a teacher, continue
  next();
}

/**
 * Require Student Role Middleware
 * 
 * This middleware checks if the authenticated user is a student.
 * Use this AFTER authenticateToken middleware to protect student-only routes.
 * 
 * Example usage in server.js:
 * app.post('/api/student/submit-assignment', authenticateToken, requireStudent, (req, res) => {
 *   // Only students can access this
 * });
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export function requireStudent(req, res, next) {
  // Check if user exists (should be set by authenticateToken)
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check if user role is student
  if (req.user.role !== 'student') {
    return res.status(403).json({ 
      error: 'Access denied. Student role required.' 
    });
  }
  
  // User is a student, continue
  next();
}

/**
 * Get User by ID
 * 
 * Retrieves user information from database.
 * 
 * @param {number} userId - User ID
 * @returns {Object} User data (without password)
 */
export function getUserById(userId) {
  return pool.query('SELECT * FROM users WHERE id = $1', [userId])
    .then((res) => {
      const user = res.rows[0];
      if (!user) throw new Error('User not found');
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
}

/**
 * Update User Profile
 * 
 * Updates user information in database.
 * 
 * @param {number} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated user data
 */
export function updateUserProfile(userId, updates) {
  const allowedFields = ['firstName', 'lastName', 'photo'];
  const updateFields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      // handle camelCase column names quoted in Postgres
      const column = key === 'firstName' || key === 'lastName' ? `"${key}"` : key;
      updateFields.push(`${column} = $${updateFields.length + 1}`);
      values.push(value);
    }
  }

  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }

  // Add userId as last parameter
  values.push(userId);

  const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${values.length}`;
  return pool.query(sql, values).then(() => getUserById(userId));
}

// Export database instance for use in other modules
export { pool };
