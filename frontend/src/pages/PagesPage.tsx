import { useState } from "react";
import { FileStack, Download, Loader2, Trash2, ArrowUpDown, FileOutput } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import PageSelector from "@/components/PageSelector";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type TabType = "delete" | "reorder" | "extract";

const tabs: Array<{ id: TabType; label: string; icon: typeof Trash2 }> = [
  { id: "delete", label: "Delete Pages", icon: Trash2 },
  { id: "reorder", label: "Reorder Pages", icon: ArrowUpDown },
  { id: "extract", label: "Extract Pages", icon: FileOutput },
];

export default function PagesPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [activeTab, setActiveTab] = useState<TabType>("delete");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [outputFilename, setOutputFilename] = useState("output.pdf");
  const [resultFile, setResultFile] = useState<string | null>(null);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      // For reorder, initialize with all pages in order
      if (activeTab === "reorder") {
        setSelectedPages(Array.from({ length: result.pages }, (_, i) => i + 1));
      } else {
        setSelectedPages([]);
      }
      setResultFile(null);
      toast.success(`Uploaded: ${files[0].name} (${result.pages} pages)`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedPages([]);
    setResultFile(null);
    if (uploadedFile && tab === "reorder") {
      setSelectedPages(Array.from({ length: uploadedFile.pages }, (_, i) => i + 1));
    }
  };

  const handleProcess = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    if (selectedPages.length === 0) {
      toast.error("Please select pages");
      return;
    }

    setIsProcessing(true);
    setResultFile(null);

    try {
      let endpoint = "";
      let payload: Record<string, unknown> = {
        session_id: sessionId,
        filename: uploadedFile.name,
        output_name: outputFilename,
      };

      switch (activeTab) {
        case "delete":
          endpoint = "/api/pdf/pages/delete";
          payload.pages = selectedPages;
          break;
        case "reorder":
          endpoint = "/api/pdf/pages/reorder";
          payload.order = selectedPages;
          break;
        case "extract":
          endpoint = "/api/pdf/pages/extract";
          payload.pages = selectedPages;
          break;
      }

      const res = await api.post(endpoint, payload);
      setResultFile(res.data.output_filename);
      toast.success("Operation completed successfully!");
    } catch (error) {
      toast.error("Operation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    switch (activeTab) {
      case "delete":
        return isProcessing ? "Deleting..." : "Delete Pages";
      case "reorder":
        return isProcessing ? "Reordering..." : "Save New Order";
      case "extract":
        return isProcessing ? "Extracting..." : "Extract Pages";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileStack className="w-7 h-7 text-primary" />
          Manage Pages
        </h1>
        <p className="text-muted-foreground mt-1">
          Delete, reorder, or extract pages from your PDF
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
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

            {/* Page Selection based on tab */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {activeTab === "delete" && "Select pages to delete"}
                {activeTab === "reorder" && "Drag pages to reorder"}
                {activeTab === "extract" && "Select pages to extract"}
              </label>
              <PageSelector
                totalPages={uploadedFile.pages}
                selectedPages={selectedPages}
                onChange={setSelectedPages}
                mode={activeTab === "reorder" ? "reorder" : "multiple"}
              />
            </div>

            {/* Output Filename */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Output Filename
              </label>
              <input
                type="text"
                value={outputFilename}
                onChange={(e) => setOutputFilename(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="output.pdf"
              />
            </div>

            <button
              onClick={handleProcess}
              disabled={isProcessing || selectedPages.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
              {getButtonText()}
            </button>
          </>
        )}
      </div>

      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">Operation Complete!</h3>
          <p className="text-green-700 mb-4">
            Your processed PDF is ready for download.
          </p>
          <button
            onClick={() => downloadFile(resultFile)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download {resultFile}
          </button>
        </div>
      )}
    </div>
  );
}
