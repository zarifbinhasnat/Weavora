import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Image, FileText } from "lucide-react";

const classes = [
  { id: 1, name: "Machine Learning Fundamentals", code: "CS 4501" },
  { id: 2, name: "Data Structures", code: "CS 2100" },
  { id: 3, name: "Web Development", code: "CS 3200" },
];

export function ClassroomPosts() {
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [post, setPost] = useState("");

  const handlePost = () => {
    if (!post.trim()) return;
    // Handle post submission
    console.log("Posting to class:", selectedClass, post);
    setPost("");
    alert("Post published successfully!");
  };

  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <h3 className="font-display font-semibold text-foreground mb-4">Create Announcement</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">Select Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
            className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.code})
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={post}
          onChange={(e) => setPost(e.target.value)}
          placeholder="What would you like to share with your class?"
          rows={6}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              <FileText className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handlePost}
            disabled={!post.trim()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Post
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <h3 className="font-display font-semibold text-foreground mb-4">Recent Posts</h3>
        <div className="space-y-4">
          {[
            { title: "Assignment 3 Deadline Extended", time: "2 hours ago", class: "CS 4501" },
            { title: "New Reading Material Available", time: "1 day ago", class: "CS 2100" },
            { title: "Reminder: Quiz Tomorrow", time: "2 days ago", class: "CS 3200" },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.class}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
