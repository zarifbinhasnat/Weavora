import { motion } from "framer-motion";
import { Sparkles, FileCheck, MessageSquare, TrendingUp, GraduationCap, ClipboardList } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AIToolsSectionProps {
  onCheckCopy: () => void;
}

export function AIToolsSection({ onCheckCopy }: AIToolsSectionProps) {
  const aiTools = [
    {
      title: "AI Grading Assistant",
      description: "Automatic evaluation of assignments with smart marking suggestions and detailed feedback",
      icon: GraduationCap,
      color: "text-white",
      bgColor: "bg-[#3F3F46]",
      badge: "Smart Grading",
    },
    {
      title: "Verify Class Summary",
      description: "AI-powered class analytics, attendance patterns, and performance insights for better teaching",
      icon: ClipboardList,
      color: "text-white",
      bgColor: "bg-[#3F3F46]",
      badge: "Analytics",
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-[#A1A1AA]" />
        <h2 className="text-2xl font-bold">AI-Powered Tools</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiTools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${tool.bgColor} mb-4`}>
                      <Icon className={`w-8 h-8 ${tool.color}`} />
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#3F3F46] text-[#A1A1AA]">
                      {tool.badge}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="default">
                    Open Tool
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
