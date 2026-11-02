import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterUunPage from './pages/RegisterUunPage';
import StudentDashboard from './pages/StudentDashboard';
import DashboardOverview from './pages/DashboardOverview';
import ChatbotPage from './pages/ChatbotPage';
import AgenticPage from './pages/AgenticPage';
import MultimodalPage from './pages/MultimodalPage';
import StudentsDirectoryPage from './pages/StudentsDirectoryPage';
import EvaluationPage from './pages/EvaluationPage';
import SecurityPage from './pages/SecurityPage';
import EthicsLegalPage from './pages/EthicsLegalPage';
import CurriculumPage from './pages/CurriculumPage';
import MinorCoursesPage from './pages/MinorCoursesPage';
import HandbookPage from './pages/HandbookPage';
import HelpPage from './pages/HelpPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Authentication Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register-uun" element={<RegisterUunPage />} />

          {/* Student Protected Dashboard */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student/dashboard/*" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin Protected Dashboard (Existing Features Preserved) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DashboardOverview />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/chatbot" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ChatbotPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/agentic" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AgenticPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/multimodal" 
            element={
              <ProtectedRoute requiredRole="admin">
                <MultimodalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/students" 
            element={
              <ProtectedRoute requiredRole="admin">
                <StudentsDirectoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/evaluation" 
            element={
              <ProtectedRoute requiredRole="admin">
                <EvaluationPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/security" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SecurityPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/ethics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <EthicsLegalPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/curriculum" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CurriculumPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/minors" 
            element={
              <ProtectedRoute requiredRole="admin">
                <MinorCoursesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/handbook" 
            element={
              <ProtectedRoute requiredRole="admin">
                <HandbookPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/help" 
            element={
              <ProtectedRoute requiredRole="admin">
                <HelpPage />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ErrorBoundary>
  );
}
