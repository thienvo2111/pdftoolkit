import { useState } from "react";
import { Scissors, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import PageSelector from "@/components/PageSelector";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";

export default function SplitPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [mode, setMode] = useState<"each" | "ranges">("each");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [resultFiles, setResultFiles] = useState<string[]>([]);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      setSelectedPages(Array.from({ length: result.pages }, (_, i) => i + 1));
      setResultFiles([]);
      toast.success(`Uploaded: ${files[0].name} (${result.pages} pages)`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSplit = async () => {
    if (!uploadedFile || selectedPages.length === 0) {
      toast.error("Please upload a file and select pages");
      return;
    }

    setIsSplitting(true);
    setResultFiles([]);

    try {
      const res = await api.post("/api/pdf/split", {
        session_id: sessionId,
        filename: uploadedFile.name,
        mode: mode,
        pages: selectedPages,
      });

      setResultFiles(res.data.output_files);
      toast.success(`Split into ${res.data.output_files.length} file(s)`);
    } catch (error) {
      toast.error("Failed to split PDF");
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Scissors className="w-7 h-7 text-primary" />
          Split PDF
        </h1>
        <p className="text-muted-foreground mt-1">
          Split a PDF into separate files
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 space-y-6">
        <FileDropzone
          onFilesAdded={handleFileAdded}
          multiple={false}
          label="Drop a PDF file here or click to browse"
        />

        {isUploading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}

        {uploadedFile && (
          <>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="font-medium">{uploadedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {uploadedFile.pages} pages
              </p>
            </div>

            {/* Mode Toggle */}
            <div>
              <label className="block text-sm font-medium mb-2">Split Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "each"}
                    onChange={() => {
                      setMode("each");
                      setSelectedPages(
                        Array.from({ length: uploadedFile.pages }, (_, i) => i + 1)
                      );
                    }}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Split each page into separate files</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "ranges"}
                    onChange={() => {
                      setMode("ranges");
                      setSelectedPages([]);
                    }}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Split by page ranges</span>
                </label>
              </div>
            </div>

            {/* Page Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {mode === "each"
                  ? "Select pages to extract"
                  : "Define page ranges"}
              </label>
              <PageSelector
                totalPages={uploadedFile.pages}
                selectedPages={selectedPages}
                onChange={setSelectedPages}
                mode={mode === "each" ? "multiple" : "range"}
              />
            </div>

            <button
              onClick={handleSplit}
              disabled={selectedPages.length === 0 || isSplitting}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSplitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Splitting...
                </>
              ) : (
                <>
                  <Scissors className="w-5 h-5" />
                  Split PDF
                </>
              )}
            </button>
          </>
        )}
      </div>

      {resultFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-4">
            Split Complete! ({resultFiles.length} files)
          </h3>
          <div className="space-y-2">
            {resultFiles.map((file) => (
              <div
                key={file}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-200"
              >
                <span className="font-medium">{file}</span>
                <button
                  onClick={() => downloadFile(file)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
