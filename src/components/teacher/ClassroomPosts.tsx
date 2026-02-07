import { useEffect, useState } from "react";
import {
  createPost,
  deletePost,
  listenToPosts,
} from "../backend/classroomPosts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type PostType = "announcement" | "discussion";

type ClassroomPost = {
  id: string;
  title: string;
  content: string;
  author?: string;
  createdAt?: any;
};

export default function ClassroomPosts() {
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("discussion");

  // Data state
  const [announcements, setAnnouncements] = useState<ClassroomPost[]>([]);
  const [discussions, setDiscussions] = useState<ClassroomPost[]>([]);

  // 🔐 Firestore listeners (SAFE)
  useEffect(() => {
    let unsubAnnouncements: (() => void) | undefined;
    let unsubDiscussions: (() => void) | undefined;

    try {
      unsubAnnouncements = listenToPosts(
        "announcement",
        (data: ClassroomPost[]) => {
          setAnnouncements(data || []);
        }
      );

      unsubDiscussions = listenToPosts(
        "discussion",
        (data: ClassroomPost[]) => {
          setDiscussions(data || []);
        }
      );
    } catch (err) {
      console.error("Failed to listen to posts:", err);
    }

    return () => {
      unsubAnnouncements?.();
      unsubDiscussions?.();
    };
  }, []);

  // ➕ Create post
  const handleAddPost = async () => {
    if (!title.trim() || !content.trim()) return;

    try {
      await createPost(title, content, "Teacher", type);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Failed to create post:", err);
    }
  };

  return (
    <div className="p-6 space-y-8">

      {/* ================= CREATE POST ================= */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create Post</h2>

        <div className="space-y-3">
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Textarea
            placeholder="Write your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />

          <div className="flex items-center gap-3">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PostType)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="discussion">💬 Discussion</option>
              <option value="announcement">📌 Announcement</option>
            </select>

            <Button onClick={handleAddPost}>Publish</Button>
          </div>
        </div>
      </Card>

      {/* ================= ANNOUNCEMENTS ================= */}
      <Card className="p-6 border-l-4 border-yellow-500 bg-yellow-50">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold">Announcements</h2>
          <Badge variant="secondary">Important</Badge>
        </div>

        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No announcements yet.
          </p>
        )}

        <div className="space-y-4">
          {announcements.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded border shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.content}
                  </p>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePost(p.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ================= DISCUSSIONS ================= */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Discussions</h2>

        {discussions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No discussion posts yet.
          </p>
        )}

        <div className="space-y-4">
          {discussions.map((p) => (
            <div
              key={p.id}
              className="p-4 border rounded hover:bg-secondary/40 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {p.content}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => deletePost(p.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}
