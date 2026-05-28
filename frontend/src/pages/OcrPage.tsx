import { useState } from "react";
import { ScanText, Download, Loader2, Settings, Info, X } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import PageSelector from "@/components/PageSelector";
import ApiKeyModal from "@/components/ApiKeyModal";
import { useSessionStore } from "@/store/session";
import { useApiKeysStore } from "@/store/apiKeys";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const outputFormats = [
  { value: "docx", label: "Word (.docx)" },
  { value: "xlsx", label: "Excel (.xlsx)" },
];

const languages = [
  { value: "eng", label: "English" },
  { value: "vie", label: "Vietnamese" },
  { value: "chi_sim", label: "Chinese (Simplified)" },
];

export default function OcrPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const { provider, apiKey, model, clearApiKey } = useApiKeysStore();

  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const [outputFormat, setOutputFormat] = useState("docx");
  const [language, setLanguage] = useState("eng");
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [useAllPages, setUseAllPages] = useState(true);
  const [outputFilename, setOutputFilename] = useState("ocr_output");
  const [resultFile, setResultFile] = useState<string | null>(null);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      setSelectedPages(Array.from({ length: result.pages }, (_, i) => i + 1));
      setResultFile(null);
      toast.success(`Uploaded: ${files[0].name} (${result.pages} pages)`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunOcr = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsProcessing(true);
    setResultFile(null);

    try {
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        filename: uploadedFile.name,
        output_format: outputFormat,
        language: language,
        pages: useAllPages ? null : selectedPages,
        output_filename: `${outputFilename}.${outputFormat}`,
      };

      // Add AI configuration if available
      if (provider && apiKey) {
        payload.ai_provider = provider;
        payload.ai_api_key = apiKey;
        if (model) {
          payload.ai_model = model;
        }
      }

      const res = await api.post("/api/pdf/ocr", payload);
      setResultFile(res.data.output_file);
      toast.success("OCR completed successfully!");
    } catch (error) {
      toast.error("OCR processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ScanText className="w-7 h-7 text-primary" />
          OCR - Extract Text
        </h1>
        <p className="text-muted-foreground mt-1">
          Extract text from PDF to Word or Excel format
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

            {/* Output Format */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Output Format
              </label>
              <div className="flex flex-wrap gap-3">
                {outputFormats.map((format) => (
                  <label
                    key={format.value}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors",
                      outputFormat === format.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      checked={outputFormat === format.value}
                      onChange={() => setOutputFormat(format.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>{format.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Document Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Provider Section */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800">AI-Powered OCR (Optional)</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Without AI, uses local Tesseract OCR. With AI, uses vision models for better accuracy on complex layouts.
                    </p>
                  </div>
                </div>
              </div>

              {provider && apiKey ? (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    {model && ` (${model})`}
                  </span>
                  <button
                    onClick={() => setShowApiModal(true)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                  <button
                    onClick={clearApiKey}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowApiModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Configure AI API
                </button>
              )}
            </div>

            {/* Page Selection */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useAllPages}
                  onChange={(e) => setUseAllPages(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-medium">Process all pages</span>
              </label>

              {!useAllPages && (
                <PageSelector
                  totalPages={uploadedFile.pages}
                  selectedPages={selectedPages}
                  onChange={setSelectedPages}
                  mode="multiple"
                />
              )}
            </div>

            {/* Output Filename */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Output Filename
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="ocr_output"
                />
                <span className="text-muted-foreground">.{outputFormat}</span>
              </div>
            </div>

            <button
              onClick={handleRunOcr}
              disabled={isProcessing || (!useAllPages && selectedPages.length === 0)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ScanText className="w-5 h-5" />
                  Run OCR
                </>
              )}
            </button>
          </>
        )}
      </div>

      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">OCR Complete!</h3>
          <p className="text-green-700 mb-4">
            Your extracted text document is ready for download.
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

      <ApiKeyModal isOpen={showApiModal} onClose={() => setShowApiModal(false)} />
    </div>
  );
}
