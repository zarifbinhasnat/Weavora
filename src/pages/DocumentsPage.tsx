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
import { useToast } from "@/hooks/use-toast";

interface DocumentType {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch documents
  const fetchDocuments = async () => {
    const snapshot = await getDocs(collection(db, "Documents"));
    const docs = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<DocumentType, "id">),
    }));
    setDocuments(docs);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Add document
  const handleAdd = async () => {
    if (!title || !pdfUrl) {
      toast({ title: "Title and PDF link are required" });
      return;
    }

    try {
      await addDoc(collection(db, "Documents"), {
        title,
        description,
        pdfUrl,
        createdAt: Timestamp.now(),
      });

      toast({ title: "PDF added successfully" });
      setTitle("");
      setDescription("");
      setPdfUrl("");
      fetchDocuments();
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "Documents", id));
    toast({ title: "Document deleted" });
    fetchDocuments();
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Teacher Documents</h1>

      {/* Add Document */}
      <div className="border rounded-xl p-6 space-y-4 bg-card">
        <Input
          placeholder="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          placeholder="PDF Link (Google Drive / OneDrive / GitHub)"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
        />
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add PDF
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {documents.map((docu) => (
          <div key={docu.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">{docu.title}</p>
                <p className="text-xs text-muted-foreground">PDF Linked</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {docu.description}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPreviewUrl(docu.pdfUrl)}
              >
                <Eye className="w-4 h-4" /> Preview
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(docu.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

  
      {previewUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-[90%] h-[90%] p-4 relative">
            <Button
              className="absolute right-4 top-4"
              onClick={() => setPreviewUrl(null)}
            >
              Close
            </Button>
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
