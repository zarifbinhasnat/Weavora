import React from "react";
import ChatBox from "./ChatBox";
import DiscussionThread from "./DiscussionThread";

function Profile() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Student Profile</h2>
      <p>Welcome to your profile page.</p>

      {/* Chat Feature */}
      <ChatBox />

      {/* Discussion Thread */}
      <DiscussionThread />
    </div>
  );
}

export default Profile;
