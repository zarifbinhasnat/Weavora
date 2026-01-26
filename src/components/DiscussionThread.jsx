import { useState } from "react";

function DiscussionThread() {
  const [posts, setPosts] = useState([
    {
      title: "Welcome to the discussion",
      content: "Feel free to ask questions or share ideas here.",
      comments: ["This looks useful!", "Happy to be here"],
    },
  ]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const addPost = () => {
    if (!title || !content) return;
    setPosts([...posts, { title, content, comments: [] }]);
    setTitle("");
    setContent("");
  };

  const addComment = (index, comment) => {
    if (!comment) return;
    const updatedPosts = [...posts];
    updatedPosts[index].comments.push(comment);
    setPosts(updatedPosts);
  };

  return (
    <div>
      <h3>Discussion Thread</h3>

      <input
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: "8px" }}
      />

      <textarea
        placeholder="Post content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ width: "100%", marginBottom: "8px" }}
      />

      <button onClick={addPost}>Add Post</button>

      <hr />

      {posts.map((post, index) => (
        <div key={index} style={{ border: "1px solid #ccc", padding: "12px", marginTop: "16px" }}>
          <h4>{post.title}</h4>
          <p>{post.content}</p>

          <strong>Comments:</strong>
          <ul>
            {post.comments.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>

          <input
            placeholder="Add a comment"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                addComment(index, e.target.value);
                e.target.value = "";
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.previousSibling;
              addComment(index, input.value);
              input.value = "";
            }}
          >
            Add Comment
          </button>
        </div>
      ))}
    </div>
  );
}

export default DiscussionThread;
