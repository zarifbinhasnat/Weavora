import React, { useState } from "react";

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (text.trim() === "") return;
    setMessages([...messages, text]);
    setText("");
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        width: "100%",
        maxWidth: "400px",
        marginTop: "20px",
      }}
    >
      <h3>Chat</h3>

      <div
        style={{
          minHeight: "120px",
          border: "1px solid #eee",
          padding: "8px",
          marginBottom: "10px",
        }}
      >
        {messages.length === 0 && <p>No messages yet</p>}

        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: "4px" }}>
            {msg}
          </div>
        ))}
      </div>

      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message"
        style={{ width: "100%", marginBottom: "8px" }}
      />

      <button type="button" onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default ChatBox;

