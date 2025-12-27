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

const modes: {
  id: AIMode;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { id: "tutor", label: "Tutor", icon: MessageSquare, description: "Ask questions from uploaded course materials" },
  { id: "summarizer", label: "Summarizer", icon: FileText, description: "Summarize uploaded notes or PDFs" },
  { id: "evaluator", label: "Evaluator", icon: CheckCircle, description: "Evaluate answers using course content" },
  { id: "planner", label: "Planner", icon: CalendarDays, description: "Plan studies based on syllabus" },
];

export function AIAssistant() {
  const [activeMode, setActiveMode] = useState<AIMode>("tutor");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I'm your AI learning assistant. I answer strictly from your uploaded course materials. Ask me anything.",
      mode: "tutor",
    },
  ]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          course: "statistics", // 🔴 change dynamically later
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "No answer found.",
        mode: activeMode,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "error",
          role: "assistant",
          content: "❌ Failed to connect to the RAG server.",
        },
      ]);
    } finally {
      setLoading(false);
    }
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
            <h2 className="font-display font-semibold text-foreground">
              AI Assistant
            </h2>
            <p className="text-xs text-muted-foreground">
              Powered by your uploaded PDFs (RAG)
            </p>
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
          {modes.find((m) => m.id === activeMode)?.description}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
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
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Ask in ${activeMode} mode...`}
            className="flex-1 bg-secondary/50 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
          />
          <Button onClick={handleSend} disabled={loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
