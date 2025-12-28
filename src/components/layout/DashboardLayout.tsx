import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout() {
  // Sidebar still expects activeTab + onTabChange,
  // but we can keep simple compatibility:
  const location = useLocation();

  const activeTab =
    location.pathname.startsWith("/courses") ? "courses" :
    location.pathname === "/" ? "dashboard" :
    "dashboard";

  return (
    <div className="flex min-h-screen">
      <Sidebar
        activeTab={activeTab}
        onTabChange={() => {}} // sidebar will navigate via NavLink for Dashboard/Courses
      />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
