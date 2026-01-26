import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Plus,
  MessageCircle,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function ChatDiscussion() {
  const { courseCode } = useParams<{ courseCode: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Discussion state
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>(
    {}
  );
  const [postComments, setPostComments] = useState<{
    [key: string]: Comment[];
  }>({});

  // Show new post form
  const [showNewPost, setShowNewPost] = useState(false);

  // Listen to chat messages
  useEffect(() => {
    if (!courseCode) return;

    const unsubscribe = listenToChatMessages(courseCode, (messages) => {
      setChatMessages(messages);
    });

    return () => unsubscribe();
  }, [courseCode]);

  // Listen to discussion posts
  useEffect(() => {
    if (!courseCode) return;

    const unsubscribe = listenToDiscussionPosts(courseCode, (posts) => {
      setPosts(posts);
    });

    return () => unsubscribe();
  }, [courseCode]);

  // Listen to comments for each post
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    posts.forEach((post) => {
      if (post.id) {
        const unsubscribe = listenToComments(post.id, (comments) => {
          setPostComments((prev) => ({
            ...prev,
            [post.id!]: comments,
          }));
        });
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [posts]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChat = async () => {
    console.log("Send clicked", { chatInput, courseCode, user });
    
    if (!chatInput.trim()) {
      console.log("Empty message");
      return;
    }
    
    if (!courseCode) {
      console.log("No course code");
      return;
    }
    
    if (!user) {
      console.log("No user logged in");
      alert("Please log in to send messages");
      return;
    }

    try {
      console.log("Sending message...");
      await sendChatMessage(
        courseCode,
        user.uid,
        user.displayName || "Anonymous",
        user.email || "",
        chatInput
      );
      console.log("Message sent successfully");
      setChatInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + (error as Error).message);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim() || !courseCode || !user)
      return;

    try {
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
      setShowNewPost(false);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim() || !user) return;

    try {
      await addCommentToPost(
        postId,
        user.uid,
        user.displayName || "Anonymous",
        user.email || "",
        commentText
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Chat & Discussion
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with classmates and instructors
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="discussion" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Discussion Board
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Live Chat
                  <Badge variant="secondary" className="ml-auto">
                    {chatMessages.length} messages
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <motion.div
                        key={msg.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${
                          msg.userId === user?.uid ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(msg.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex flex-col ${
                            msg.userId === user?.uid ? "items-end" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {msg.userName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <div
                            className={`px-4 py-2 rounded-lg max-w-md ${
                              msg.userId === user?.uid
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSendChat} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discussion Tab */}
          <TabsContent value="discussion">
            <div className="space-y-4">
              {/* New Post Button */}
              {!showNewPost && (
                <Button
                  onClick={() => setShowNewPost(true)}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                  Create New Post
                </Button>
              )}

              {/* New Post Form */}
              {showNewPost && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Create Discussion Post</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Post title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="What would you like to discuss?"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleCreatePost} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Post
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewPost(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Discussion Posts */}
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-center">
                      No discussion posts yet. Be the first to start a
                      discussion!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(post.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {post.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>{post.userName}</span>
                              <Clock className="w-3 h-3 ml-2" />
                              <span>{formatTime(post.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{post.content}</p>

                        {/* Comments Section */}
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Comments ({postComments[post.id!]?.length || 0})
                          </h4>

                          {/* Existing Comments */}
                          <div className="space-y-3 mb-4">
                            {postComments[post.id!]?.map((comment, i) => (
                              <div
                                key={comment.id || i}
                                className="flex gap-3 pl-4 border-l-2 border-border"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback className="text-xs bg-secondary">
                                    {getInitials(comment.userName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">
                                      {comment.userName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatTime(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {comment.text}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a comment..."
                              value={commentInputs[post.id!] || ""}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id!]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(post.id!);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddComment(post.id!)}
                            >
                              Comment
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
