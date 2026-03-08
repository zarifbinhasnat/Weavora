import { useState } from "react";
import { motion } from "framer-motion";
import { getAuth } from "firebase/auth";

import {
  BookOpen,
  GraduationCap,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Bell,
  Bug
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { BugReportModal } from "@/components/BugReportModal";

/* ================= TYPES ================= */

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isTeacher?: boolean;
}

/* ================= NAV ITEMS ================= */

const studentNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: BookOpen, label: "Courses", id: "courses" },
  { icon: MessageSquare, label: "AI Assistant", id: "assistant" },
  { icon: FileText, label: "Materials", id: "materials" },
  { icon: Calendar, label: "Schedule", id: "schedule" },
  { icon: Bell, label: "Announcements", id: "announcements" }
];

const teacherNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: BookOpen, label: "My Classes", id: "classes" },
  { icon: Settings, label: "Copy Checker", id: "copy-checker" },
  { icon: Bell, label: "Notifications", id: "notifications" }
];

/* ================= COMPONENT ================= */

export function Sidebar({
  activeTab,
  onTabChange,
  isTeacher = false
}: SidebarProps) {

  const [collapsed, setCollapsed] = useState(false);
  const [bugModalOpen, setBugModalOpen] = useState(false);

  const auth = getAuth();
  const userId = auth.currentUser?.uid;

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const openBugModal = () => {

    console.log("Bug button clicked");
    console.log("User ID:", userId);

    if (!userId) {
      alert("User not logged in. Please login again.");
      return;
    }

    setBugModalOpen(true);
  };

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3 }}
        className="h-screen bg-secondary sticky top-0 flex flex-col border-r border-border"
      >

        {/* ================= LOGO ================= */}

        <div className="p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="font-semibold text-foreground">
                Weavora
              </span>

              <span className="text-xs text-muted-foreground">
                {isTeacher ? "Teacher Portal" : "AI Classroom"}
              </span>
            </motion.div>
          )}

        </div>

        {/* ================= NAVIGATION ================= */}

        <nav className="flex-1 px-3 py-4 space-y-1">

          {navItems.map((item) => {

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "nav-active" : "nav-inactive"}
                className={cn(
                  "w-full justify-start gap-3 relative",
                  collapsed && "justify-center px-0"
                )}
                onClick={() => onTabChange(item.id)}
              >

                <Icon className="w-5 h-5 flex-shrink-0" />

                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>

                    {item.badge !== undefined && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {collapsed && item.badge !== undefined && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}

              </Button>
            );
          })}

        </nav>

        {/* ================= FOOTER ================= */}

        <div className="p-3 border-t border-border space-y-1">

          {/* USER MENU */}

          <UserMenu collapsed={collapsed} />

          {/* BUG REPORT */}

          <Button
            variant="nav-inactive"
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
            onClick={openBugModal}
          >
            <Bug className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-red-500 font-medium">Report Bug</span>}
          </Button>

          {/* SETTINGS */}

          <Button
            variant="nav-inactive"
            className={cn(
              "w-full justify-start gap-3",
              collapsed && "justify-center px-0"
            )}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Button>

          {/* COLLAPSE */}

          <Button
            variant="ghost"
            size="icon"
            className="w-full mt-2"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>

        </div>

      </motion.aside>

      {/* ================= BUG MODAL ================= */}

      {bugModalOpen && userId && (
        <BugReportModal
          isOpen={bugModalOpen}
          onClose={() => setBugModalOpen(false)}
        />
      )}

    </>
  );
}