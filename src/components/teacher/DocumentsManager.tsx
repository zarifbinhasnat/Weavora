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

export default function DocumentsManager() {
  const [docs, setDocs] = useState<DocType[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Get courseId from context or URL - for now using a default
  const courseId = "CS4501"; // TODO: Get from course context

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
    if (!title || !pdfUrl) {
      toast({
        title: "Missing fields",
        description: "Please provide both title and PDF URL",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Add document to Firestore
      const docRef = await addDoc(collection(db, "Documents"), {
        title,
        description,
        pdfUrl,
        embeddingsGenerated: false,
        createdAt: Timestamp.now(),
      });

      toast({
        title: "Document added!",
        description: "Generating embeddings in background...",
      });

      // 2. Automatically generate embeddings in background
      generateEmbeddingsFromLink(courseId, docRef.id, pdfUrl, title)
        .then(() => {
          toast({
            title: "Embeddings generated!",
            description: `${title} is now searchable by AI`,
          });
          fetchDocs(); // Refresh to show updated status
        })
        .catch((error) => {
          console.error("Background embedding generation failed:", error);
          toast({
            title: "Embedding generation failed",
            description: "Document added but AI search may not work",
            variant: "destructive",
          });
        });

      setTitle("");
      setDescription("");
      setPdfUrl("");
      fetchDocs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add document",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const removeDocument = async (id: string) => {
    await deleteDoc(doc(db, "Documents", id));
    fetchDocs();
  };

  // Convert Google Drive link to embeddable format
  const getEmbeddableUrl = (url: string): string => {
    // Google Drive: convert sharing link to preview link
    if (url.includes('drive.google.com')) {
      const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
      }
    }
    
    // OneDrive: convert sharing link to embed link
    if (url.includes('1drv.ms') || url.includes('onedrive.live.com')) {
      return url.replace('view.aspx', 'embed').replace('?', '?action=embedview&');
    }
    
    // Return as-is for direct PDF links
    return url;
  };

  const handlePreview = (url: string) => {
    const embeddableUrl = getEmbeddableUrl(url);
    setPreview(embeddableUrl);
  };

  return (
    <div className="space-y-6">
      {/* Add */}
      <div className="border rounded-xl p-6 space-y-4 bg-card">
        <h3 className="font-semibold text-lg">Add New Document</h3>
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
        <div className="space-y-2">
          <Input
            placeholder="PDF link (Google Drive / OneDrive)"
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: For Google Drive, share the file and paste the link (e.g., https://drive.google.com/file/d/FILE_ID/view)
          </p>
        </div>
        <Button onClick={addDocument} className="gap-2" disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Adding & Processing...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Document
            </>
          )}
        </Button>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 gap-4">
        {docs.map((d) => (
          <div key={d.id} className="border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{d.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
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
              <p className="text-sm text-muted-foreground">{d.description}</p>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => handlePreview(d.pdfUrl)}>
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
