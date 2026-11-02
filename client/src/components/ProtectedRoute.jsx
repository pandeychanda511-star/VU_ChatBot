import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route protection guard enforcing:
 * 1. User must be authenticated
 * 2. Role must match requirement ('admin' or 'student')
 */
export function ProtectedRoute({ children, requiredRole = null }) {
  const { currentUser, userProfile, isAdmin, isStudent, authLoading } = useAuth();
  const location = useLocation();

  // 1. If auth is still checking, render professional loading screen
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-white tracking-wide">Vidyashilp Academic Advisor</h2>
        <p className="text-xs text-slate-400 mt-1">Verifying authentication...</p>
      </div>
    );
  }

  // 2. If not authenticated after Firebase initializes, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Determine admin status
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const isAdminUser = isAdmin || userEmail === 'mausamjha63@gmail.com';

  // 4. If a student signed in via Google but hasn't registered their UUN yet
  if (userProfile && userProfile.role === 'student' && userProfile.isRegistered === false && !isAdminUser) {
    return <Navigate to="/register-uun" replace />;
  }

  // 5. Admin route access guard:
  // If route is admin and user is NOT admin, redirect to student dashboard
  if (requiredRole === 'admin' && !isAdminUser) {
    return <Navigate to="/student/dashboard" replace />;
  }

  // 6. Student route access guard:
  // Admins can also inspect student dashboard or students themselves
  if (requiredRole === 'student' && !isAdminUser && !isStudent) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;

