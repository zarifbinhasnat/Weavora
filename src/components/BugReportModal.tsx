// BugReportModal.tsx
import { useState } from "react";
import { getAuth } from "firebase/auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { submitBugReport } from "./backend/bugs";
import { useToast } from "@/hooks/use-toast";

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const { toast } = useToast();
  const auth = getAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "UI/UX",
    priority: "Medium",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please login again",
        variant: "destructive"
      });
      console.warn("User not logged in! Cannot submit bug report.");
      return;
    }

    console.log("Submitting bug report for user:", user.uid);
    setLoading(true);

    const result = await submitBugReport({
      ...formData,
      userId: user.uid
    });

    if (result.success) {
      console.log("Bug report successfully saved!");

      toast({
        title: "Bug Report Received",
        description: "We have received your report. Our team will review it soon."
      });

      setFormData({
        title: "",
        category: "UI/UX",
        priority: "Medium",
        description: ""
      });

      onClose();

    } else {
      console.error("Bug submission failed!");
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[450px]">

        <DialogHeader>
          <DialogTitle className="text-xl">Report a Bug</DialogTitle>
          <DialogDescription>
            Found a problem? Help us improve Weavora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">

          <div>
            <Label>Summary</Label>
            <Input
              required
              value={formData.title}
              placeholder="Short description of the bug"
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UI/UX">UI / UX</SelectItem>
                  <SelectItem value="AI Assistant">AI Assistant</SelectItem>
                  <SelectItem value="Backend">Backend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(v) => setFormData({ ...formData, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              required
              placeholder="Explain the bug in detail..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Bug Report"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}