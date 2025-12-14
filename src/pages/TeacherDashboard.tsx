import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Search, User, Bell } from "lucide-react";

// Import components properly
import { TeacherClasses as TeacherClassesComponent } from "@/components/teacher/TeacherClasses";
import { QuickActions as QuickActionsComponent } from "@/components/teacher/QuickActions";
import { AIToolsSection as AIToolsSectionComponent } from "@/components/teacher/AIToolsSection";
import { PendingVerifications as PendingVerificationsComponent } from "@/components/teacher/PendingVerifications";
import { TeacherStats as TeacherStatsComponent } from "@/components/teacher/TeacherStats";
import { DocumentUpload } from "@/components/teacher/DocumentUpload";
import { CreateClassModal } from "@/components/teacher/CreateClassModal";
import { CopyChecker } from "@/components/teacher/CopyChecker";
import { ClassroomPosts } from "@/components/teacher/ClassroomPosts";

// Wrapper components with error handling
const TeacherClasses = ({ limit, onCreateClass }: { limit?: number; onCreateClass: () => void }) => {
  try {
    return <TeacherClassesComponent limit={limit} onCreateClass={onCreateClass} />;
  } catch (e) {
    console.error("Error loading TeacherClasses:", e);
    return <div>Error loading classes</div>;
  }
};

const QuickActions = ({ onCreateClass, onUploadDocument, onCheckCopy }: { onCreateClass: () => void; onUploadDocument: () => void; onCheckCopy: () => void }) => {
  try {
    return <QuickActionsComponent onCreateClass={onCreateClass} onUploadDocument={onUploadDocument} onCheckCopy={onCheckCopy} />;
  } catch (e) {
    console.error("Error loading QuickActions:", e);
    return <div>Error loading quick actions</div>;
  }
};

const AIToolsSection = ({ onCheckCopy }: { onCheckCopy: () => void }) => {
  try {
    return <AIToolsSectionComponent onCheckCopy={onCheckCopy} />;
  } catch (e) {
    console.error("Error loading AIToolsSection:", e);
    return <div>Error loading AI tools</div>;
  }
};

const PendingVerifications = ({ onClearNotification }: { onClearNotification: () => void }) => {
  try {
    return <PendingVerificationsComponent onClearNotification={onClearNotification} />;
  } catch (e) {
    console.error("Error loading PendingVerifications:", e);
    return <div>Error loading notifications</div>;
  }
};

const TeacherStats = () => {
  try {
    return <TeacherStatsComponent />;
  } catch (e) {
    console.error("Error loading TeacherStats:", e);
    return <div>Error loading stats</div>;
  }
};

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [showCopyChecker, setShowCopyChecker] = useState(false);
  const [pendingNotifications, setPendingNotifications] = useState(3);

  const renderContent = () => {
    switch (activeTab) {
      case "classes":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">My Classes</h2>
            <TeacherClasses onCreateClass={() => setShowCreateClass(true)} />
          </div>
        );
      
      case "documents":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">Document Management</h2>
            <div>Documents section coming soon...</div>
          </div>
        );
      
      case "copy-checker":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">AI Copy Checker</h2>
            <div>Copy checker coming soon...</div>
          </div>
        );
      
      case "posts":
        return (
          <div className="p-6">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-6">Classroom Posts</h2>
            <div>Posts section coming soon...</div>
          </div>
        );

      default:
        return (
          <>
            {/* Header */}
            <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <motion.h1 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-display font-semibold text-foreground"
                  >
                    Teacher Dashboard
                  </motion.h1>
                  <p className="text-sm text-muted-foreground">Manage your classes, verify AI summaries, and engage with students.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search classes, documents..."
                      className="w-64 pl-10 pr-4 py-2 bg-secondary/50 border-0 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <button 
                    onClick={() => setActiveTab("notifications")}
                    className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                  >
                    <Bell className="w-5 h-5 text-foreground" />
                    {pendingNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {pendingNotifications}
                      </span>
                    )}
                  </button>
                  <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                    <User className="w-5 h-5 text-primary-foreground" />
                  </button>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="p-6">
              {/* Stats */}
              <section className="mb-8">
                <TeacherStats />
              </section>

              {/* Quick Actions */}
              <section className="mb-8">
                <QuickActions />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Conte
                  onCreateClass={() => setShowCreateClass(true)}
                  onUploadDocument={() => setShowUploadDoc(true)}
                  onCheckCopy={() => setShowCopyChecker(true)}
                />
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="xl:col-span-2 space-y-6">
                  {/* Classes */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-display font-semibold text-foreground">Your Classes</h2>
                      <button 
                        onClick={() => setActiveTab("classes")}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        View All →
                      </button>
                    </div>
                    <TeacherClasses limit={3} onCreateClass={() => setShowCreateClass(true)} />
                  </section>

                  {/* AI Tools */}
                  <section>
                    <h2 className="text-lg font-display font-semibold text-foreground mb-4">AI-Powered Tools</h2>
                    <AIToolsSection onCheckCopy={() => setShowCopyChecker(true)} />
                  </section>
                </div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                  <PendingVerifications onClearNotification={() => setPendingNotifications(prev => Math.max(0, prev - 1))} />
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isTeacher={true} />
      
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Modals */}
      {showCreateClass && (
        <CreateClassModal onClose={() => setShowCreateClass(false)} />
      )}
    </div>
  );
}