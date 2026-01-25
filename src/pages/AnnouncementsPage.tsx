import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { auth } from "../components/backend/firebase.js";
import {
  CourseAnnouncement,
  createAnnouncement,
  listenAnnouncements,
} from "../components/backend/announcements";

export default function AnnouncementsPage() {
  // route: /teacher/courses/:courseId/announcements (example)
 const { courseCode } = useParams<{ courseCode: string }>();
const courseId = courseCode; // use as Firestore doc id


  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);

  const [items, setItems] = useState<CourseAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    setLoading(true);
    const unsub = listenAnnouncements(
      courseId,
      (rows) => {
        setItems(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [courseId]);

  const post = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login first");
    if (!courseId) return alert("Missing courseId");
    if (!title.trim() || !text.trim()) return alert("Title and text are required");

    await createAnnouncement({
      courseId,
      title,
      text,
      authorName: user.email ?? "Teacher",
      pinned,
    });

    setTitle("");
    setText("");
    setPinned(false);
  };

  if (!courseId) {
    return <div style={{ padding: 24 }}>Missing courseId in route.</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        Announcements • {courseId}
      </h1>

      {/* Post */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Post announcement
        </h2>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g., Midterm)"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write announcement..."
          rows={4}
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          Pin this announcement
        </label>

        <button onClick={post} style={{ padding: "10px 14px" }}>
          Post
        </button>
      </div>

      {/* List */}
      <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Announcements
        </h2>

        {loading && <p>Loading…</p>}

        {!loading && items.length === 0 && <p>No announcements yet.</p>}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((a) => (
            <div key={a.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>
                    {a.title} {a.pinned ? "📌" : ""}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{a.authorName}</div>
                </div>
              </div>

              <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{a.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
