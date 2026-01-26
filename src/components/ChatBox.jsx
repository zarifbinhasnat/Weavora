import { useState } from "react";

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const sendMessage = () => {
    if (!text.trim()) return;
    setMessages([...messages, text]);
    setText("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "24px" }}>
      <h3>Chat</h3>

      <div
        style={{
          border: "1px solid #ddd",
          height: "120px",
          padding: "8px",
          marginBottom: "8px",
          overflowY: "auto",
        }}
      >
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((msg, index) => <p key={index}>{msg}</p>)
        )}
      </div>

      <input
        type="text"
        placeholder="Type a message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: "8px" }}
      />

      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default ChatBox;
