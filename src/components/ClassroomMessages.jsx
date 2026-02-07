import React, { useState } from "react";

function ClassroomMessages() {
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages([...messages, chatInput]);
    setChatInput("");
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto" }}>
      {/* CHAT SECTION */}
      <h2>Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          minHeight: "80px",
          marginBottom: "10px",
        }}
      >
        {messages.length === 0
          ? "No messages yet"
          : messages.map((msg, index) => (
              <div key={index}>• {msg}</div>
            ))}
      </div>

      <input
        type="text"
        placeholder="Type your message..."
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        style={{ width: "100%", marginBottom: "5px" }}
      />

      <button onClick={sendMessage}>Send</button>

      <hr style={{ margin: "30px 0" }} />

      {/* DISCUSSION SECTION */}
      <h2>Discussion</h2>

      <input
        type="text"
        placeholder="Post title"
        style={{ width: "100%", marginBottom: "5px" }}
      />

      <textarea
        placeholder="Post content"
        style={{ width: "100%", minHeight: "80px" }}
      />

      <button style={{ marginTop: "5px" }}>Add Post</button>
    </div>
  );
}

export default ClassroomMessages;
