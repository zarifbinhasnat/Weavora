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

// Protected Route Component - BYPASSED FOR DEVELOPMENT
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // DEVELOPMENT MODE: Skip authentication checks
  return <>{children}</>;
  
  /* Original protected route logic (commented out for development)
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
  */
}

function AppRoutes() {
  // DEVELOPMENT MODE: Skip auth redirect logic
  // const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth route disabled for development */}
      <Route
        path="/auth"
        element={<Navigate to="/" replace />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
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
          <ProtectedRoute>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      {/* Teacher Course Management Route */}
      <Route
        path="/teacher/course/:courseCode"
        element={
          <ProtectedRoute>
            <TeacherCoursePage />
          </ProtectedRoute>
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
