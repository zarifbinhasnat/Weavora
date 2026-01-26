import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import ChatAndDiscussion from "./ui/ChatAndDiscussion";

function Profile() {
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      {userDetails && (
        <>
          {/* USER INFO */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            {userDetails.photo && (
              <img
                src={userDetails.photo}
                alt="Profile"
                width="120"
                style={{ borderRadius: "50%", marginBottom: "10px" }}
              />
            )}
            <h3>Welcome {userDetails.firstName}</h3>
            <p>{userDetails.email}</p>

            <button className="btn btn-primary" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <hr />

          {/* CHAT + DISCUSSION (STUDENT VIEW) */}
          <ChatAndDiscussion />
        </>
      )}
    </div>
  );
}

export default Profile;
