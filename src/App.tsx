import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import MaterialsPage from "./pages/MaterialsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import TeacherCoursePage from "./pages/TeacherCoursePage"; // New import
import NotFound from "./pages/NotFound";
import ClassroomPosts from "./components/teacher/ClassroomPosts";
import ChatPage from "./components/teacher/ChatPage";
import ChatDiscussion from "./components/teacher/ChatDiscussion";

const queryClient = new QueryClient();

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
}

// Role-Based Protected Route
function RoleProtectedRoute({ children, role }: { children: React.ReactNode; role: "student" | "teacher" }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;

  // Redirect to correct dashboard if wrong role
  if (role === "teacher" && user?.role !== "teacher") {
    return <Navigate to="/" replace />;
  }
  if (role === "student" && user?.role === "teacher") {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Auth />}
      />

      <Route
        path="/"
        element={
          <RoleProtectedRoute role="student">
            <Index />
          </RoleProtectedRoute>
        }
      />

      <Route
        path="/course/:courseCode"
        element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course/:courseCode/materials"
        element={
          <ProtectedRoute>
            <MaterialsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course/:courseCode/announcements"
        element={
          <ProtectedRoute>
            <AnnouncementsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course/:courseCode/chat"
        element={
          <ProtectedRoute>
            <ChatDiscussion />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course/:courseCode/posts"
        element={
          <ProtectedRoute>
            <ClassroomPosts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher-dashboard"
        element={
          <RoleProtectedRoute role="teacher">
            <TeacherDashboard />
          </RoleProtectedRoute>
        }
      />

      {/* Teacher Course Management Route */}
      <Route
        path="/teacher/course/:courseCode"
        element={
          <RoleProtectedRoute role="teacher">
            <TeacherCoursePage />
          </RoleProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <Toaster />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
 
 
 
