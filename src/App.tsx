import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

import CoursesPage from "./components/dashboard/student_dashboard/CoursesPage";
import CourseDetails from "./components/dashboard/student_dashboard/CourseDetails";
import DashboardLayout from "./components/layout/DashboardLayout";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />

            {/* ✅ Layout wraps all dashboard pages */}
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:code" element={<CourseDetails />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
