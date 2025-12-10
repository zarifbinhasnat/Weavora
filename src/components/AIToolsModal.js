// components/AIToolsModal.js
import React, { useState } from "react";
import "./AIToolsModal.css";

function AIToolsModal({ isOpen, onClose, toolType, userDetails }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Tool configurations
  const toolConfig = {
    grading: {
      title: "AI Auto-Grading System",
      icon: "bi-clipboard-check",
      color: "#667eea",
      description: "Upload assignment submissions for AI-assisted grading",
    },
    tutor: {
      title: "Course AI Tutor",
      icon: "bi-chat-dots",
      color: "#f5576c",
      description: "Ask questions about your course materials",
    },
    explainer: {
      title: "AI Lecture Explainer",
      icon: "bi-lightbulb",
      color: "#00f2fe",
      description: "Generate simplified explanations of complex topics",
    },
    analyzer: {
      title: "Pass-Paper Analyzer",
      icon: "bi-graph-up-arrow",
      color: "#38f9d7",
      description: "Analyze exam patterns and trends",
    },
    summarizer: {
      title: "Meeting Summarizer",
      icon: "bi-mic",
      color: "#fee140",
      description: "Transcribe and summarize lecture recordings",
    },
    chatbot: {
      title: "AI Teaching Assistant",
      icon: "bi-robot",
      color: "#330867",
      description: "Your 24/7 AI assistant for teaching support",
    },
  };

  const config = toolConfig[toolType] || toolConfig.chatbot;

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    setMessages([...messages, { type: "user", text: inputText }]);
    setInputText("");
    setLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          type: "ai",
          text: `This is a demo response for ${config.title}. Integration with AI services coming soon!`,
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ai-modal-header" style={{ borderLeftColor: config.color }}>
          <div className="modal-title-section">
            <i className={`bi ${config.icon}`} style={{ color: config.color }}></i>
            <div>
              <h3>{config.title}</h3>
              <p>{config.description}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="ai-modal-body">
          {/* Chat Messages */}
          <div className="ai-messages-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <i className={`bi ${config.icon}`} style={{ color: config.color }}></i>
                <h4>Start Using {config.title}</h4>
                <p>Type your message below or upload files to get started</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  <div className="message-content">{msg.text}</div>
                </div>
              ))
            )}
            {loading && (
              <div className="message ai">
                <div className="message-content loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="ai-input-section">
            <div className="input-wrapper">
              <button className="attach-btn" title="Attach file">
                <i className="bi bi-paperclip"></i>
              </button>
              <input
                type="text"
                placeholder={`Ask ${config.title}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!inputText.trim() || loading}
                style={{ background: config.color }}
              >
                <i className="bi bi-send-fill"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="ai-modal-footer">
          <small>
            <i className="bi bi-info-circle"></i> This AI tool is powered by advanced
            machine learning models
          </small>
        </div>
      </div>
    </div>
  );
}

export default AIToolsModal;