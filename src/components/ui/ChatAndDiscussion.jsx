import React, { useState } from "react";

export default function ChatAndDiscussion() {
  // --------------------
  // Chat state
  // --------------------
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  // --------------------
  // Discussion state
  // --------------------
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [posts, setPosts] = useState([
    {
      title: "Welcome to the discussion",
      content: "Feel free to ask questions or share ideas here.",
      comments: ["This looks useful!", "Happy to be here"],
    },
  ]);

  // --------------------
  // Handlers
  // --------------------
  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, chatInput]);
    setChatInput("");
  };

  const addPost = () => {
    if (!postTitle.trim() || !postContent.trim()) return;
    setPosts((prev) => [
      { title: postTitle, content: postContent, comments: [] },
      ...prev,
    ]);
    setPostTitle("");
    setPostContent("");
  };

  const addComment = (index, text) => {
    if (!text.trim()) return;
    setPosts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        comments: [...updated[index].comments, text],
      };
      return updated;
    });
  };

  // --------------------
  // Styles
  // --------------------
  const containerStyle = {
    maxWidth: "720px",
    margin: "40px auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  };

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "16px",
  };

  const inputStyle = {
    width: "100%",
    padding: "8px",
    marginTop: "6px",
    marginBottom: "6px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    marginTop: "6px",
    padding: "6px 12px",
    cursor: "pointer",
  };

  // --------------------
  // Render
  // --------------------
  return (
    <div style={containerStyle}>
      {/* CHAT CARD */}
      <div style={cardStyle}>
        <h2>Chat</h2>

        <div style={{ minHeight: "80px", marginBottom: "10px" }}>
          {chatMessages.length === 0 ? (
            <p>No messages yet</p>
          ) : (
            chatMessages.map((msg, i) => <p key={i}>{msg}</p>)
          )}
        </div>

        <input
          style={inputStyle}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message"
        />

        <button style={buttonStyle} onClick={sendChat}>
          Send
        </button>
      </div>

      {/* ADD POST CARD */}
      <div style={cardStyle}>
        <h2>Add Post</h2>

        <input
          style={inputStyle}
          placeholder="Post title"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
        />

        <textarea
          style={{ ...inputStyle, minHeight: "80px" }}
          placeholder="Post content"
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
        />

        <button style={buttonStyle} onClick={addPost}>
          Add Post
        </button>
      </div>

      {/* DISCUSSION POSTS */}
      {posts.map((post, index) => (
        <div key={index} style={cardStyle}>
          <h3>{post.title}</h3>
          <p>{post.content}</p>

          <strong>Comments</strong>
          <ul>
            {post.comments.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          <input
            style={inputStyle}
            placeholder="Add a comment"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addComment(index, e.target.value);
                e.target.value = "";
              }
            }}
          />

          <button
            style={buttonStyle}
            onClick={(e) => {
              const inputEl = e.currentTarget.previousSibling;
              addComment(index, inputEl.value);
              inputEl.value = "";
            }}
          >
            Add Comment
          </button>
        </div>
      ))}
    </div>
  );
}
