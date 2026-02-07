import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  sendChatMessage,
  listenToChatMessages,
  createDiscussionPost,
  listenToDiscussionPosts,
  addCommentToPost,
  listenToComments,
  ChatMessage,
  DiscussionPost,
  Comment,
} from "@/components/backend/chat";

/* =======================
   Error Boundary
======================= */
class SafeBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ChatDiscussion crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="border rounded-lg p-4 bg-red-50 text-red-700">
            <div className="font-semibold mb-2">Chat page crashed</div>
            <div className="text-sm">
              Open DevTools → Console to see the full error.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}

/* =======================
   Main Component
======================= */
function InnerChatDiscussion() {
  const { courseCode: rawCourseCode } = useParams<{ courseCode?: string }>();
  const { user } = useAuth();

  // ✅ MUST ALWAYS BE A STRING
  const courseCode = rawCourseCode || "default-course";

  /* ---------- Chat ---------- */
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---------- Posts ---------- */
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>(
    {}
  );

  /* ---------- Listen: Chat ---------- */
  useEffect(() => {
    if (!courseCode) return;
    return listenToChatMessages(courseCode, setChatMessages);
  }, [courseCode]);

  /* ---------- Listen: Posts ---------- */
  useEffect(() => {
    if (!courseCode) return;
    return listenToDiscussionPosts(courseCode, setPosts);
  }, [courseCode]);

  /* ---------- Listen: Comments (FIXED) ---------- */
  useEffect(() => {
    const unsubscribes: Array<() => void> = [];

    posts.forEach((post) => {
      if (!post.id) return;

      // ✅ FIX: pass courseCode FIRST
      const unsub = listenToComments(
        courseCode,
        post.id,
        (comments) => {
          setPostComments((prev) => ({
            ...prev,
            [post.id!]: comments,
          }));
        }
      );

      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [posts, courseCode]);

  /* ---------- Scroll chat ---------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ---------- Actions ---------- */
  const handleSendChat = async () => {
    if (!chatInput.trim() || !user) return;

    await sendChatMessage(
      courseCode,
      user.uid,
      user.displayName || "Anonymous",
      user.email || "",
      chatInput
    );
    setChatInput("");
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim() || !user) return;

    await createDiscussionPost(
      courseCode,
      user.uid,
      user.displayName || "Anonymous",
      user.email || "",
      postTitle,
      postContent
    );

    setPostTitle("");
    setPostContent("");
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text || !user) return;

    // ✅ FIX: backend requires courseCode
    await addCommentToPost(
      courseCode,
      postId,
      user.uid,
      user.displayName || "Anonymous",
      user.email || "",
      text
    );

    setCommentInputs((p) => ({ ...p, [postId]: "" }));
  };

  /* =======================
     UI
  ======================= */
  return (
    <div className="p-6 space-y-6">
      <div className="text-2xl font-semibold">Chat & Discussion</div>

      {/* CHAT */}
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-2">Live Chat</div>

        <div className="h-64 overflow-y-auto border rounded p-3 mb-3">
          {chatMessages.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No messages yet
            </div>
          ) : (
            chatMessages.map((m) => (
              <div key={m.id} className="text-sm">
                <b>{m.userName}:</b> {m.message}
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Type a message"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
          />
          <button
            onClick={handleSendChat}
            className="px-4 py-2 rounded bg-primary text-primary-foreground"
          >
            Send
          </button>
        </div>
      </div>

      {/* ADD POST */}
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-2">Add Post</div>

        <input
          className="w-full border rounded px-3 py-2 text-sm mb-2"
          placeholder="Post title"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded px-3 py-2 text-sm mb-3"
          placeholder="Post content"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />

        <button
          onClick={handleCreatePost}
          className="w-full py-2 rounded bg-primary text-primary-foreground"
        >
          Add Post
        </button>
      </div>

      {/* POSTS */}
      <div className="border rounded-xl p-4">
        <div className="font-semibold mb-3">📌 Posts & Announcements</div>

        {posts.length === 0 ? (
          <div className="text-sm text-muted-foreground">No posts yet.</div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="border rounded p-4 mb-4">
              <div className="font-semibold">{post.title}</div>
              <div className="text-sm text-muted-foreground mb-2">
                {post.content}
              </div>

              <div className="space-y-2">
                {(postComments[post.id!] || []).map((c) => (
                  <div key={c.id} className="text-sm border-l pl-3">
                    {c.text}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  className="flex-1 border rounded px-3 py-2 text-sm"
                  placeholder="Add a comment"
                  value={commentInputs[post.id!] || ""}
                  onChange={(e) =>
                    setCommentInputs((p) => ({
                      ...p,
                      [post.id!]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddComment(post.id!)
                  }
                />
                <button
                  onClick={() => handleAddComment(post.id!)}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground"
                >
                  Comment
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =======================
   Export
======================= */
export default function ChatDiscussion() {
  return (
    <SafeBoundary>
      <InnerChatDiscussion />
    </SafeBoundary>
  );
}
