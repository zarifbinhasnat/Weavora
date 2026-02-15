import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Loader2 } from "lucide-react";
import { joinCourseByCode } from "@/components/backend/courses";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface JoinClassProps {
    onJoinSuccess: () => void;
}

export function JoinClass({ onJoinSuccess }: JoinClassProps) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleJoin = async () => {
        if (!code || !user) return;

        setLoading(true);
        try {
            await joinCourseByCode({ joinCode: code, uid: user.uid });
            toast({
                title: "Successfully joined course!",
                description: "You can now access the course materials.",
            });
            setCode("");
            onJoinSuccess();
        } catch (error: any) {
            console.error("Failed to join course:", error);
            toast({
                title: "Failed to join course",
                description: error.message || "Please check the code and try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="font-display font-semibold text-foreground">Join a Class</h3>
                    <p className="text-xs text-muted-foreground">Enter the 6-character code</p>
                </div>
            </div>

            <div className="flex gap-2">
                <Input
                    placeholder="Code (e.g. A2C4F9)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="uppercase"
                    maxLength={6}
                />
                <Button onClick={handleJoin} disabled={loading || code.length < 6}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
                </Button>
            </div>
        </div>
    );
}
