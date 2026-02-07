import { motion } from "framer-motion";
import { Plus, Upload, FileCheck, MessageSquare } from "lucide-react";

interface QuickActionsProps {
  onCreateClass: () => void;
  onUploadDocument: () => void;
  onCheckCopy: () => void;
}

export function QuickActions({ onCreateClass, onUploadDocument, onCheckCopy }: QuickActionsProps) {
  const actions = [
    {
      title: "Create Class",
      description: "Start a new course",
      icon: Plus,
      color: "bg-[#3F3F46]",
      onClick: onCreateClass,
    },
    {
      title: "Upload Documents",
      description: "Share materials",
      icon: Upload,
      color: "bg-[#3F3F46]",
      onClick: onUploadDocument,
    },
    {
      title: "Copy Checker",
      description: "AI plagiarism detection",
      icon: FileCheck,
      color: "bg-[#3F3F46]",
      onClick: onCheckCopy,
    },
    {
      title: "Post to Class",
      description: "Share announcements",
      icon: MessageSquare,
      color: "bg-[#3F3F46]",
      onClick: () => {},
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={action.onClick}
            className="group cursor-pointer bg-card rounded-xl border border-border p-5 shadow-card hover:shadow-card-hover transition-all"
          >
            <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display font-semibold text-foreground mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
