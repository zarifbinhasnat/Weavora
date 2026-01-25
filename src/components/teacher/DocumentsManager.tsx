import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/components/backend/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Eye, Trash2, Plus } from "lucide-react";

interface DocType {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
}

export default function DocumentsManager() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const fetchDocs = async () => {
    const snap = await getDocs(collection(db, "Documents"));
    setDocs(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<DocType, "id">),
      }))
    );
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const addDocument = async () => {
    if (!title || !pdfUrl) return;

    await addDoc(collection(db, "Documents"), {
      title,
      description,
      pdfUrl,
      createdAt: Timestamp.now(),
    });

    setTitle("");
    setDescription("");
    setPdfUrl("");
    fetchDocs();
  };

  const removeDocument = async (id: string) => {
    await deleteDoc(doc(db, "Documents", id));
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      {/* Add */}
      <div className="border rounded-xl p-6 space-y-4 bg-card">
        <Input
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          placeholder="PDF link (Google Drive / OneDrive)"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
        />
        <Button onClick={addDocument} className="gap-2">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 gap-4">
        {docs.map((d) => (
          <div key={d.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">{d.title}</p>
                <p className="text-xs text-muted-foreground">PDF linked</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{d.description}</p>

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPreview(d.pdfUrl)}>
                <Eye className="w-4 h-4" /> Preview
              </Button>
              <Button size="sm" variant="destructive" onClick={() => removeDocument(d.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] h-[90%] rounded-xl relative p-4">
            <Button className="absolute top-4 right-4" onClick={() => setPreview(null)}>
              Close
            </Button>
            <iframe src={preview} className="w-full h-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
