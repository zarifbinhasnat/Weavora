import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, AlertTriangle, CheckCircle, Upload } from "lucide-react";

export function CopyChecker() {
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    setChecking(true);
    // Simulate AI check
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResult({
      similarity: Math.random() * 100,
      sources: [
        { url: "example.com/article1", similarity: 45 },
        { url: "wikipedia.org/topic", similarity: 23 },
      ],
    });
    setChecking(false);
  };

  return (
    <div className="max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">AI-Powered Copy Checker</h3>
            <p className="text-sm text-muted-foreground">Detect plagiarism and check originality</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste student submission text here..."
          rows={10}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 mb-4"
        />

        <button
          onClick={handleCheck}
          disabled={!text || checking}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
        >
          {checking ? "Analyzing..." : "Check for Plagiarism"}
        </button>
      </motion.div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-foreground">Analysis Results</h3>
            <div className="flex items-center gap-2">
              {result.similarity < 30 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-medium">Original</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <span className="text-orange-600 font-medium">Check Required</span>
                </>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Similarity</span>
              <span className="text-2xl font-bold text-foreground">{result.similarity.toFixed(1)}%</span>
            </div>
            <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${result.similarity < 30 ? 'bg-green-500' : result.similarity < 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${result.similarity}%` }}
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Potential Sources</h4>
            <div className="space-y-2">
              {result.sources.map((source: any, index: number) => (
                <div key={index} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground truncate">{source.url}</span>
                    <span className="text-sm font-medium text-orange-600">{source.similarity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
