import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mausamjha63@gmail.com').toLowerCase().trim();

let firebaseInitialized = false;

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
    firebaseInitialized = true;
    console.log('[Firebase Admin] Successfully initialized with service account.');
  } else {
    console.warn('[Firebase Admin] firebase-service-account.json not found. Token verification fallback mode enabled.');
  }
} catch (err) {
  console.error('[Firebase Admin] Initialization error:', err.message);
}

/**
 * Express middleware to verify Firebase ID token and determine User Role (admin vs student).
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. No Bearer token provided.',
      status: 'unauthorized'
    });
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  try {
    let decodedToken = null;

    if (firebaseInitialized) {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      // In dev fallback, parse basic payload if admin SDK uninitialized
      const parts = idToken.split('.');
      if (parts.length === 3) {
        decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      }
    }

    if (!decodedToken) {
      return res.status(401).json({
        error: 'Invalid authentication token.',
        status: 'unauthorized'
      });
    }

    const email = (decodedToken.email || '').toLowerCase().trim();
    const isAdmin = (email === ADMIN_EMAIL);
    const role = isAdmin ? 'admin' : 'student';

    req.user = {
      uid: decodedToken.uid || decodedToken.sub,
      email: email,
      name: decodedToken.name || email.split('@')[0],
      role: role,
      isAdmin: isAdmin
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return res.status(401).json({
      error: 'Authentication token is invalid or expired.',
      status: 'unauthorized'
    });
  }
}

/**
 * Optional token authentication (allows anonymous if not supplied, but attaches req.user if supplied)
 */
export async function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const idToken = authHeader.split('Bearer ')[1].trim();
  try {
    let decodedToken = null;
    if (firebaseInitialized) {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } else {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        decodedToken = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      }
    }

    if (decodedToken) {
      const email = (decodedToken.email || '').toLowerCase().trim();
      const isAdmin = (email === ADMIN_EMAIL);
      req.user = {
        uid: decodedToken.uid || decodedToken.sub,
        email: email,
        name: decodedToken.name || email.split('@')[0],
        role: isAdmin ? 'admin' : 'student',
        isAdmin: isAdmin
      };
    }
  } catch (err) {
    req.user = null;
  }
  next();
}

/**
 * Middleware strictly requiring Administrator role
 */
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied. Administrator privileges required.',
      status: 'forbidden'
    });
  }
  next();
}

