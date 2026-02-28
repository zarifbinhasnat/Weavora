import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db, storage } from "@/components/backend/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateEmbeddingsFromLink } from "@/components/backend/embeddings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Eye, Trash2, Plus, Sparkles, Loader2, CheckCircle } from "lucide-react";

interface DocType {
  id: string;
  title: string;
  description: string;
  pdfUrl: string;
  embeddingsGenerated?: boolean;
  embeddingsGeneratedAt?: any;
}

interface DocumentsManagerProps {
  courseId?: string;
  readOnly?: boolean;
}

export default function DocumentsManager({ courseId, readOnly = false }: DocumentsManagerProps) {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  const fetchDocs = async () => {
    if (!courseId) {
      if (!readOnly) console.warn("No courseId provided to DocumentsManager");
      setDocs([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    if (!db) {
      console.warn("Firestore not initialized — DocumentsManager cannot fetch docs.");
      setDocs([]);
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, "Documents"), where("courseId", "==", courseId));
      const snap = await getDocs(q);
      setDocs(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<DocType, "id">),
        }))
      );
    } catch (e) {
      console.error("Failed to fetch docs", e);
      toast({
        title: "Error fetching documents",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [courseId]);

  const addDocument = async () => {
    if (readOnly) return;
    if (!title || (!pdfUrl && !file)) {
      toast({
        title: "Missing fields",
        description: "Please provide both title and a file or URL",
        variant: "destructive",
      });
      return;
    }

    if (!courseId) {
      toast({
        title: "Error",
        description: "Course ID is missing. Cannot upload.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      let downloadUrl = pdfUrl;

      // Handle File Upload
      if (file) {
        if (!storage) {
          toast({ title: "Storage not configured — cannot upload file", variant: "destructive" });
          setIsGenerating(false);
          return;
        }
        // Use courseId in path to organize files
        const fileRef = ref(storage, `course-materials/${courseId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        downloadUrl = await getDownloadURL(snapshot.ref);
      }

      // 1. Add document to Firestore
      if (!db) {
        toast({ title: "Firestore not configured — cannot add document", variant: "destructive" });
        setIsGenerating(false);
        return;
      }

      const docRef = await addDoc(collection(db, "Documents"), {
        title,
        description,
        pdfUrl: downloadUrl,
        courseId,
        fileName: file?.name || "",
        fileSize: file ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : "",
        fileType: file?.type || "link",
        embeddingsGenerated: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Document added!",
        description: "Generating embeddings in background...",
      });

      // 2. Automatically generate embeddings in background
      if (downloadUrl) {
        // Pass the raw file object to avoid CORS issues when re-fetching
        generateEmbeddingsFromLink(courseId, docRef.id, downloadUrl, title, file)
          .then(() => {
            toast({
              title: "Embeddings generated!",
              description: `${title} is now searchable by AI`,
            });
            fetchDocs(); // Refresh
          })
          .catch((error) => {
            console.error("Background embedding generation failed:", error);
            toast({
              title: "Embedding generation failed",
              description: error?.message || "Check console for details",
              variant: "destructive",
            });
            fetchDocs(); // Refresh to show current state
          });
      }

      setTitle("");
      setDescription("");
      setPdfUrl("");
      setFile(null);
      fetchDocs();
    } catch (error: any) {
      console.error("Error adding document:", error);
      toast({
        title: "Error",
        description: "Failed to add document: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const removeDocument = async (id: string) => {
    if (readOnly) return;
    try {
      if (!db) {
        toast({ title: "Firestore not configured — cannot delete document", variant: "destructive" });
        return;
      }

      await deleteDoc(doc(db, "Documents", id));
      fetchDocs();
      toast({ title: "Document removed" });
    } catch (error) {
      console.error("Failed to delete doc:", error);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Document Section - Only if NOT readOnly */}
      {!readOnly && (
        <div className="border rounded-xl p-6 space-y-4 bg-card shadow-sm">
          <h3 className="font-semibold text-lg">Upload New Material</h3>

          <div>
            <label className="text-sm font-medium mb-1 block">Document Title</label>
            <Input
              placeholder="e.g. Lecture 1 Slides"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
            <Textarea
              placeholder="Brief description of the content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Upload File (PDF/Doc)</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFile(file);
                    if (!title) setTitle(file.name.split('.')[0]);
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-center text-sm text-muted-foreground">
              - OR -
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">External Link URL</label>
              <Input
                placeholder="https://drive.google.com/..."
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                disabled={!!file}
              />
            </div>
          </div>

          <Button onClick={addDocument} className="w-full gap-2" disabled={isGenerating || (!file && !pdfUrl)}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {file ? "Uploading & Processing..." : "Processing Link..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Document
              </>
            )}
          </Button>
        </div>
      )}

      {/* List */}
      <h3 className="font-semibold text-lg">Course Documents</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 border rounded-xl border-dashed bg-secondary/20">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-muted-foreground">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {docs.map((d) => (
            <div key={d.id} className="border rounded-xl p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{d.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      {d.embeddingsGenerated ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-green-600">AI-searchable</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-yellow-600" />
                          <span className="text-yellow-600">Processing embeddings...</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {d.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{d.description}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" className="flex-1" onClick={() => setPreview(d.pdfUrl)}>
                  <Eye className="w-4 h-4 mr-2" /> Preview
                </Button>
                {!readOnly && (
                  <Button size="sm" variant="destructive" onClick={() => removeDocument(d.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background w-full max-w-5xl h-[85vh] rounded-xl relative flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Document Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
                Close
              </Button>
            </div>
            <div className="flex-1 bg-secondary/10 p-4 overflow-hidden">
              <iframe src={preview} className="w-full h-full rounded-lg border bg-white" title="PDF Preview" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
