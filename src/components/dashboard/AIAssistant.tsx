import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, 
  FileText, 
  CheckCircle, 
  CalendarDays, 
  Send,
  Sparkles,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AIMode = "tutor" | "summarizer" | "evaluator" | "planner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: AIMode;
}

const modes: { id: AIMode; label: string; icon: React.ElementType; description: string }[] = [
  { id: "tutor", label: "Tutor", icon: MessageSquare, description: "Ask questions about course material" },
  { id: "summarizer", label: "Summarizer", icon: FileText, description: "Get concise summaries of lectures" },
  { id: "evaluator", label: "Evaluator", icon: CheckCircle, description: "Get feedback on your answers" },
  { id: "planner", label: "Planner", icon: CalendarDays, description: "Plan your study schedule" },
];

const sampleResponses: Record<AIMode, string> = {
  tutor: "Based on Chapter 5 of your course materials, the concept of machine learning involves algorithms that improve through experience. Would you like me to explain supervised vs unsupervised learning?",
  summarizer: "**Lecture 12 Summary:**\n\n• Neural networks consist of interconnected nodes organized in layers\n• Backpropagation adjusts weights to minimize error\n• Key takeaway: Deep learning excels at pattern recognition tasks",
  evaluator: "Your answer demonstrates good understanding of the core concepts. Consider adding:\n\n✓ A specific example to illustrate the point\n✓ Connection to the previous chapter's framework\n\n**Score: 7/10** - Strong foundation, needs more depth",
  planner: "📅 **This Week's Study Plan:**\n\n**Monday:** Review Chapter 5 (2 hrs)\n**Wednesday:** Practice problems (1.5 hrs)\n**Friday:** Quiz preparation (1 hr)\n\n⏰ Next deadline: Assignment 3 due Thursday",
};

export function AIAssistant() {
  const [activeMode, setActiveMode] = useState<AIMode>("tutor");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI learning assistant. I'm connected to your course materials and can help you understand concepts, summarize lectures, evaluate your work, or plan your studies. How can I help you today?",
      mode: "tutor"
    }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: sampleResponses[activeMode],
      mode: activeMode,
    };

    setMessages([...messages, userMessage, assistantMessage]);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-card to-secondary/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Powered by your course materials</p>
          </div>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all",
                activeMode === mode.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <mode.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {modes.find(m => m.id === activeMode)?.description}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.mode && message.role === "assistant" && (
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center gap-1 text-xs opacity-70">
                    {modes.find(m => m.id === message.mode)?.icon && (
                      <>
                        {(() => {
                          const Icon = modes.find(m => m.id === message.mode)?.icon;
                          return Icon ? <Icon className="w-3 h-3" /> : null;
                        })()}
                      </>
                    )}
                    <span>{modes.find(m => m.id === message.mode)?.label} mode</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask in ${activeMode} mode...`}
            className="flex-1 bg-secondary/50 border-0 rounded-lg px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={handleSend} className="px-4">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
