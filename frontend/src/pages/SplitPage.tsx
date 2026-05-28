import { useState } from "react";
import { Scissors, Download, Loader2, Plus, X } from "lucide-react";
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

  const [ranges, setRanges] = useState<string[]>([]);
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);

  const [resultFiles, setResultFiles] = useState<Array<{ name: string; pages: number }>>([]);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      setSelectedPages(Array.from({ length: result.pages }, (_, i) => i + 1));
      setRanges([]);
      setResultFiles([]);
      toast.success(`Uploaded: ${files[0].name} (${result.pages} pages)`);
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddRange = () => {
    if (!uploadedFile) return;
    if (rangeFrom < 1 || rangeTo < rangeFrom || rangeTo > uploadedFile.pages) {
      toast.error(`Range must be between 1 and ${uploadedFile.pages}`);
      return;
    }
    const rangeStr = `${rangeFrom}-${rangeTo}`;
    if (!ranges.includes(rangeStr)) {
      setRanges([...ranges, rangeStr]);
    }
  };

  const handleRemoveRange = (r: string) => {
    setRanges(ranges.filter((x) => x !== r));
  };

  const handleSplit = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }
    if (mode === "each" && selectedPages.length === 0) {
      toast.error("Please select at least one page");
      return;
    }
    if (mode === "ranges" && ranges.length === 0) {
      toast.error("Please add at least one range");
      return;
    }

    setIsSplitting(true);
    setResultFiles([]);

    try {
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        filename: uploadedFile.name,
        mode: mode === "each" ? "pages" : "range",
      };

      if (mode === "each") {
        payload.pages = selectedPages;
      } else {
        payload.ranges = ranges;
      }

      const res = await api.post("/api/pdf/split", payload);
      setResultFiles(res.data.output_files);
      toast.success(`Split into ${res.data.output_files.length} file(s)`);
    } catch {
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
        <p className="text-muted-foreground mt-1">Split a PDF into separate files</p>
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
              <p className="text-sm text-muted-foreground">{uploadedFile.pages} pages</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Split Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "each"}
                    onChange={() => { setMode("each"); setRanges([]); }}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Split each page into separate files</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={mode === "ranges"}
                    onChange={() => { setMode("ranges"); setSelectedPages([]); }}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Split by page ranges</span>
                </label>
              </div>
            </div>

            {mode === "each" && (
              <div>
                <label className="block text-sm font-medium mb-2">Select pages to extract</label>
                <PageSelector
                  totalPages={uploadedFile.pages}
                  selectedPages={selectedPages}
                  onChange={setSelectedPages}
                  mode="multiple"
                />
              </div>
            )}

            {mode === "ranges" && (
              <div className="space-y-4">
                <label className="block text-sm font-medium">Define page ranges</label>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">From</label>
                    <input
                      type="number"
                      min={1}
                      max={uploadedFile.pages}
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">To</label>
                    <input
                      type="number"
                      min={1}
                      max={uploadedFile.pages}
                      value={rangeTo}
                      onChange={(e) => setRangeTo(parseInt(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <button
                    onClick={handleAddRange}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Range
                  </button>
                </div>

                {ranges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {ranges.map((r) => (
                      <div key={r} className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-medium">Pages {r}</span>
                        <button onClick={() => handleRemoveRange(r)} className="text-destructive hover:text-destructive/80">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Each range will become a separate PDF file. Document has {uploadedFile.pages} pages.
                </p>
              </div>
            )}

            <button
              onClick={handleSplit}
              disabled={
                isSplitting ||
                (mode === "each" && selectedPages.length === 0) ||
                (mode === "ranges" && ranges.length === 0)
              }
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
                key={file.name}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-green-200"
              >
                <span className="font-medium">{file.name}</span>
                <span className="text-sm text-muted-foreground mr-auto ml-3">{file.pages} page(s)</span>
                <button
                  onClick={() => downloadFile(file.name)}
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
