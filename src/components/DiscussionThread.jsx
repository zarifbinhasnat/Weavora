import React, { useState } from "react";

function DiscussionThread() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      title: "Welcome to the discussion",
      content: "Feel free to ask questions or share ideas here.",
      comments: ["This looks useful!", "Happy to be here"],
    },
  ]);

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newComment, setNewComment] = useState("");

  const addPost = () => {
    if (!newTitle || !newContent) return;

    const newPost = {
      id: posts.length + 1,
      title: newTitle,
      content: newContent,
      comments: [],
    };

    setPosts([newPost, ...posts]);
    setNewTitle("");
    setNewContent("");
  };

  const addComment = (postId) => {
    if (!newComment) return;

    setPosts(
      posts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      )
    );

    setNewComment("");
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Discussion Thread</h3>

      {/* Add new post */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Post title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ width: "100%", marginBottom: "8px" }}
        />
        <textarea
          placeholder="Post content"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          style={{ width: "100%", marginBottom: "8px" }}
        />
        <button onClick={addPost}>Add Post</button>
      </div>

      {/* Posts */}
      {posts.map((post) => (
        <div
          key={post.id}
          style={{
            border: "1px solid #ccc",
            padding: "10px",
            marginBottom: "15px",
          }}
        >
          <h4>{post.title}</h4>
          <p>{post.content}</p>

          <strong>Comments:</strong>
          {post.comments.map((comment, index) => (
            <div key={index} style={{ marginLeft: "10px" }}>
              - {comment}
            </div>
          ))}

          <input
            type="text"
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{ width: "100%", marginTop: "8px" }}
          />
          <button onClick={() => addComment(post.id)}>
            Add Comment
          </button>
        </div>
      ))}
    </div>
  );
}

export default DiscussionThread;
