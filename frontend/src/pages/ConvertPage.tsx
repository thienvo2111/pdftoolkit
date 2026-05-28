import { useState } from "react";
import { FileType, Download, Loader2, Image, FileText, Droplets, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import PageSelector from "@/components/PageSelector";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";
import { cn, formatBytes } from "@/lib/utils";

type TabType = "pdf-to-images" | "images-to-pdf" | "watermark";

interface ImageFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
}

interface SortableImageProps {
  file: ImageFile;
  onRemove: (id: string) => void;
}

function SortableImage({ file, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: file.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 bg-white border border-border rounded-lg px-4 py-3",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <Image className="w-5 h-5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.originalName}</p>
        <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        className="text-destructive hover:text-destructive/80 text-sm"
      >
        Remove
      </button>
    </div>
  );
}

export default function ConvertPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [activeTab, setActiveTab] = useState<TabType>("pdf-to-images");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultFiles, setResultFiles] = useState<string[]>([]);
  const [resultFile, setResultFile] = useState<string | null>(null);

  // PDF to Images state
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [dpi, setDpi] = useState(150);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Images to PDF state
  const [outputFilename, setOutputFilename] = useState("converted.pdf");

  // Watermark state
  const [watermarkText, setWatermarkText] = useState("");
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [angle, setAngle] = useState(-45);
  const [color, setColor] = useState("#000000");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setUploadedFile(null);
    setImageFiles([]);
    setResultFiles([]);
    setResultFile(null);
  };

  const handlePdfFileAdded = async (files: File[]) => {
    if (files.length === 0) return;
    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      setSelectedPages(Array.from({ length: result.pages }, (_, i) => i + 1));
      setResultFiles([]);
      setResultFile(null);
      toast.success(`Uploaded: ${files[0].name} (${result.pages} pages)`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageFilesAdded = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        const result = await uploadFile(file);
        setImageFiles((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: result.filename,
            originalName: file.name,
            size: file.size,
          },
        ]);
      }
      toast.success(`Uploaded ${files.length} image(s)`);
    } catch (error) {
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handlePdfToImages = async () => {
    if (!uploadedFile) return;
    setIsProcessing(true);
    setResultFiles([]);
    try {
      const res = await api.post("/api/pdf/to-images", {
        session_id: sessionId,
        filename: uploadedFile.name,
        format: format,
        dpi: dpi,
        pages: selectedPages.length > 0 ? selectedPages : null,
      });
      setResultFiles(res.data.output_files);
      toast.success(`Converted to ${res.data.output_files.length} images`);
    } catch (error) {
      toast.error("Conversion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImagesToPdf = async () => {
    if (imageFiles.length === 0) return;
    setIsProcessing(true);
    setResultFile(null);
    try {
      const res = await api.post("/api/pdf/from-images", {
        session_id: sessionId,
        filenames: imageFiles.map((f) => f.name),
        output_name: outputFilename,
      });
      setResultFile(res.data.output_filename);
      toast.success("PDF created successfully!");
    } catch (error) {
      toast.error("Conversion failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddWatermark = async () => {
    if (!uploadedFile || !watermarkText.trim()) return;
    setIsProcessing(true);
    setResultFile(null);
    try {
      const res = await api.post("/api/pdf/watermark", {
        session_id: sessionId,
        filename: uploadedFile.name,
        text: watermarkText,
        opacity: opacity,
        font_size: fontSize,
        angle: angle,
        color: color,
      });
      setResultFile(res.data.output_filename);
      toast.success("Watermark added successfully!");
    } catch (error) {
      toast.error("Failed to add watermark");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FileType className="w-7 h-7 text-primary" />
          Convert
        </h1>
        <p className="text-muted-foreground mt-1">
          Convert between PDF and images, or add watermarks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => handleTabChange("pdf-to-images")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "pdf-to-images"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Image className="w-4 h-4" />
          PDF to Images
        </button>
        <button
          onClick={() => handleTabChange("images-to-pdf")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "images-to-pdf"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Images to PDF
        </button>
        <button
          onClick={() => handleTabChange("watermark")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap",
            activeTab === "watermark"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Droplets className="w-4 h-4" />
          Add Watermark
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 space-y-6">
        {/* PDF to Images */}
        {activeTab === "pdf-to-images" && (
          <>
            <FileDropzone
              onFilesAdded={handlePdfFileAdded}
              multiple={false}
              label="Drop a PDF file here"
            />

            {uploadedFile && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{uploadedFile.pages} pages</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Format</label>
                    <div className="flex gap-3">
                      {(["png", "jpg"] as const).map((f) => (
                        <label key={f} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={format === f}
                            onChange={() => setFormat(f)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="uppercase">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">DPI (72-300)</label>
                    <input
                      type="number"
                      min={72}
                      max={300}
                      value={dpi}
                      onChange={(e) => setDpi(parseInt(e.target.value) || 150)}
                      className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Select pages (optional)</label>
                  <PageSelector
                    totalPages={uploadedFile.pages}
                    selectedPages={selectedPages}
                    onChange={setSelectedPages}
                    mode="multiple"
                  />
                </div>

                <button
                  onClick={handlePdfToImages}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                  {isProcessing ? "Converting..." : "Convert to Images"}
                </button>
              </>
            )}
          </>
        )}

        {/* Images to PDF */}
        {activeTab === "images-to-pdf" && (
          <>
            <FileDropzone
              onFilesAdded={handleImageFilesAdded}
              accept="image/*"
              multiple
              label="Drop images here (PNG, JPG, etc.)"
            />

            {imageFiles.length > 0 && (
              <>
                <div className="space-y-4">
                  <h3 className="font-medium">Images ({imageFiles.length}) — drag to reorder</h3>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={imageFiles.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {imageFiles.map((file) => (
                          <SortableImage key={file.id} file={file} onRemove={handleRemoveImage} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Output Filename</label>
                  <input
                    type="text"
                    value={outputFilename}
                    onChange={(e) => setOutputFilename(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <button
                  onClick={handleImagesToPdf}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                  {isProcessing ? "Converting..." : "Create PDF"}
                </button>
              </>
            )}
          </>
        )}

        {/* Watermark */}
        {activeTab === "watermark" && (
          <>
            <FileDropzone onFilesAdded={handlePdfFileAdded} multiple={false} label="Drop a PDF file here" />

            {uploadedFile && (
              <>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">{uploadedFile.pages} pages</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full max-w-md px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="e.g., CONFIDENTIAL"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Opacity</label>
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={opacity}
                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <span className="text-sm text-muted-foreground">{opacity}</span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Font Size</label>
                      <input
                        type="number"
                        min={12}
                        max={120}
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 48)}
                        className="w-20 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Angle</label>
                      <input
                        type="number"
                        min={-90}
                        max={90}
                        value={angle}
                        onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Color</label>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-10 border border-input rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  {watermarkText && (
                    <div className="p-6 border border-border rounded-lg bg-gray-50 flex items-center justify-center">
                      <span
                        style={{
                          opacity: opacity,
                          fontSize: `${Math.min(fontSize, 32)}px`,
                          transform: `rotate(${angle}deg)`,
                          color: color,
                        }}
                        className="font-bold"
                      >
                        {watermarkText}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddWatermark}
                  disabled={isProcessing || !watermarkText.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Droplets className="w-5 h-5" />}
                  {isProcessing ? "Adding..." : "Add Watermark"}
                </button>
              </>
            )}
          </>
        )}

        {isUploading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}
      </div>

      {/* Results - Multiple Files */}
      {resultFiles.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-4">
            Conversion Complete! ({resultFiles.length} files)
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

      {/* Results - Single File */}
      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">Operation Complete!</h3>
          <p className="text-green-700 mb-4">Your file is ready for download.</p>
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
