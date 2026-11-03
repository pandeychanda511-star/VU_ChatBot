import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  onAuthStateChanged
} from '../firebase/firebaseConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync token and role metadata with backend
  const refreshUserProfile = async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const profile = await res.json();
        setUserProfile(profile);
        return profile;
      }
    } catch (err) {
      console.error('Error refreshing user profile:', err);
    }
    // Fallback: check if admin email
    const emailLower = (firebaseUser.email || '').toLowerCase().trim();
    const isAdminUser = emailLower === 'mausamjha63@gmail.com';
    const fallbackProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
      role: isAdminUser ? 'admin' : 'student',
      isAdmin: isAdminUser,
      isRegistered: true
    };
    setUserProfile(fallbackProfile);
    return fallbackProfile;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await refreshUserProfile(user);
        } catch (e) {
          console.error('Error in onAuthStateChanged:', e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Login with Email & Password
  const loginWithEmail = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const profile = await refreshUserProfile(cred.user);
    return { user: cred.user, profile };
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await refreshUserProfile(cred.user);
    return { user: cred.user, profile };
  };

  // Student Registration with UEN validation
  const registerStudent = async ({ fullName, email, password, uun }) => {
    // 1. First pre-verify UEN on backend before creating Firebase user
    const verifyRes = await fetch('/api/auth/verify-uun', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uun })
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.valid) {
      throw new Error(verifyData.error || 'Invalid or unregistered UEN number.');
    }

    // 2. Create user in Firebase
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();

    // 3. Link UEN to the newly registered Firebase account
    const linkRes = await fetch('/api/auth/register-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uun, fullName })
    });

    if (!linkRes.ok) {
      const linkErr = await linkRes.json().catch(() => ({}));
      throw new Error(linkErr.error || 'Failed to link student profile with UEN.');
    }

    const profile = await refreshUserProfile(cred.user);
    return { user: cred.user, profile };
  };

  // Link existing Google user with UEN
  const linkGoogleStudent = async (uun, fullName) => {
    if (!currentUser) throw new Error('No user is currently signed in.');
    const token = await currentUser.getIdToken();

    const linkRes = await fetch('/api/auth/register-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ uun, fullName: fullName || currentUser.displayName })
    });

    if (!linkRes.ok) {
      const linkErr = await linkRes.json().catch(() => ({}));
      throw new Error(linkErr.error || 'Failed to link UEN.');
    }

    return await refreshUserProfile(currentUser);
  };

  // Forgot password email
  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email);
  };

  // Change password for active session
  const changePassword = async (newPassword) => {
    if (!currentUser) throw new Error('User not logged in.');
    return await updatePassword(currentUser, newPassword);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  };

  // Helper to fetch valid Auth Token for API calls
  const getIdToken = async () => {
    if (!currentUser) return null;
    return await currentUser.getIdToken();
  };

  const value = {
    currentUser,
    userProfile,
    authLoading: loading,
    role: userProfile?.role || (userProfile?.isAdmin ? 'admin' : (currentUser?.email?.toLowerCase().trim() === 'mausamjha63@gmail.com' ? 'admin' : 'student')),
    isAdmin: userProfile?.role === 'admin' || userProfile?.isAdmin === true || currentUser?.email?.toLowerCase().trim() === 'mausamjha63@gmail.com',
    isStudent: userProfile?.role === 'student' || (currentUser && currentUser?.email?.toLowerCase().trim() !== 'mausamjha63@gmail.com'),
    loginWithEmail,
    loginWithGoogle,
    registerStudent,
    linkGoogleStudent,
    resetPassword,
    changePassword,
    logout,
    getIdToken,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
          <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-bold text-white tracking-wide">Vidyashilp Academic Advisor</h2>
          <p className="text-xs text-slate-400 mt-1">Initializing secure session...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

