import { useState } from "react";
import { motion } from "framer-motion";
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
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: BookOpen, label: "Courses", id: "courses" },
  { icon: MessageSquare, label: "AI Assistant", id: "assistant", badge: 3 },
  { icon: FileText, label: "Materials", id: "materials" },
  { icon: Calendar, label: "Schedule", id: "schedule" },
  { icon: Bell, label: "Announcements", id: "announcements", badge: 2 },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen bg-secondary sticky top-0 flex flex-col border-r border-border"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <span className="font-display font-semibold text-foreground">Weavora</span>
            <span className="text-xs text-muted-foreground">AI Classroom</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? "nav-active" : "nav-inactive"}
            className={cn(
              "w-full justify-start gap-3 relative",
              collapsed && "justify-center px-0"
            )}
            onClick={() => onTabChange(item.id)}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </>
            )}
            {collapsed && item.badge && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <UserMenu collapsed={collapsed} />
        
        <Button
          variant="nav-inactive"
          className={cn("w-full justify-start gap-3", collapsed && "justify-center px-0")}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-full mt-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
