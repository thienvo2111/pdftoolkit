import { useState } from "react";
import { Minimize2, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";
import { formatBytes, cn } from "@/lib/utils";

const qualities = [
  {
    value: "low",
    label: "Low",
    description: "Maximum compression, smaller file size",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Balanced compression and quality",
  },
  {
    value: "high",
    label: "High",
    description: "Best quality, larger file size",
  },
];

export default function CompressPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    pages: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [quality, setQuality] = useState("medium");
  const [result, setResult] = useState<{
    file: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadResult = await uploadFile(files[0]);
      setUploadedFile({
        name: uploadResult.filename,
        size: files[0].size,
        pages: uploadResult.pages,
      });
      setResult(null);
      toast.success(`Uploaded: ${files[0].name}`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompress = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsCompressing(true);
    setResult(null);

    try {
      const res = await api.post("/api/pdf/compress", {
        session_id: sessionId,
        filename: uploadedFile.name,
        quality: quality,
      });

      setResult({
        file: res.data.output_file,
        originalSize: res.data.original_size,
        compressedSize: res.data.compressed_size,
      });
      toast.success("PDF compressed successfully!");
    } catch (error) {
      toast.error("Failed to compress PDF");
    } finally {
      setIsCompressing(false);
    }
  };

  const getReductionPercentage = () => {
    if (!result) return 0;
    return Math.round(
      ((result.originalSize - result.compressedSize) / result.originalSize) * 100
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Minimize2 className="w-7 h-7 text-primary" />
          Compress PDF
        </h1>
        <p className="text-muted-foreground mt-1">
          Reduce the file size of your PDF document
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
                {formatBytes(uploadedFile.size)} • {uploadedFile.pages} pages
              </p>
            </div>

            {/* Quality Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Compression Quality
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {qualities.map((q) => (
                  <label
                    key={q.value}
                    className={cn(
                      "flex flex-col p-4 border rounded-lg cursor-pointer transition-colors",
                      quality === q.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="quality"
                        checked={quality === q.value}
                        onChange={() => setQuality(q.value)}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="font-medium">{q.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 ml-6">
                      {q.description}
                    </p>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCompress}
              disabled={isCompressing}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCompressing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Minimize2 className="w-5 h-5" />
                  Compress PDF
                </>
              )}
            </button>
          </>
        )}
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-4">
            Compression Complete!
          </h3>

          {/* Size Comparison */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Original Size</span>
              <span className="font-medium text-green-800">
                {formatBytes(result.originalSize)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-4 bg-green-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all duration-500"
                style={{
                  width: `${(result.compressedSize / result.originalSize) * 100}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Compressed Size</span>
              <span className="font-medium text-green-800">
                {formatBytes(result.compressedSize)}
              </span>
            </div>

            <div className="text-center py-2 bg-green-100 rounded-lg">
              <span className="text-2xl font-bold text-green-700">
                {getReductionPercentage()}%
              </span>
              <span className="text-green-600 ml-2">reduction</span>
            </div>
          </div>

          <button
            onClick={() => downloadFile(result.file)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download {result.file}
          </button>
        </div>
      )}
    </div>
  );
}
