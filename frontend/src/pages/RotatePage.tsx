import { useState } from "react";
import { RotateCw, Download, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import PageSelector from "@/components/PageSelector";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";

const angles = [
  { value: 90, label: "90° Clockwise" },
  { value: 180, label: "180°" },
  { value: 270, label: "270° (90° Counter-clockwise)" },
];

export default function RotatePage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [angle, setAngle] = useState(90);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [outputFilename, setOutputFilename] = useState("rotated.pdf");
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

  const handleRotate = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsRotating(true);
    setResultFile(null);

    try {
      const res = await api.post("/api/pdf/rotate", {
        session_id: sessionId,
        filename: uploadedFile.name,
        angle: angle,
        pages: applyToAll ? null : selectedPages,
        output_filename: outputFilename,
      });

      setResultFile(res.data.output_file);
      toast.success("PDF rotated successfully!");
    } catch (error) {
      toast.error("Failed to rotate PDF");
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <RotateCw className="w-7 h-7 text-primary" />
          Rotate PDF
        </h1>
        <p className="text-muted-foreground mt-1">
          Rotate pages in your PDF document
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

            {/* Angle Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Rotation Angle
              </label>
              <div className="flex flex-wrap gap-3">
                {angles.map((a) => (
                  <label
                    key={a.value}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                      angle === a.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="angle"
                      checked={angle === a.value}
                      onChange={() => setAngle(a.value)}
                      className="w-4 h-4 text-primary"
                    />
                    <span>{a.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apply to All Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={(e) => setApplyToAll(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-medium">Apply to all pages</span>
              </label>
            </div>

            {/* Page Selection (if not applying to all) */}
            {!applyToAll && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select pages to rotate
                </label>
                <PageSelector
                  totalPages={uploadedFile.pages}
                  selectedPages={selectedPages}
                  onChange={setSelectedPages}
                  mode="multiple"
                />
              </div>
            )}

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
                placeholder="rotated.pdf"
              />
            </div>

            <button
              onClick={handleRotate}
              disabled={isRotating || (!applyToAll && selectedPages.length === 0)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRotating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  <RotateCw className="w-5 h-5" />
                  Rotate PDF
                </>
              )}
            </button>
          </>
        )}
      </div>

      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">Rotation Complete!</h3>
          <p className="text-green-700 mb-4">
            Your rotated PDF is ready for download.
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
