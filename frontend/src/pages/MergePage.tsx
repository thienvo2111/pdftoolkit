import { useState } from "react";
import { GripVertical, Download, Loader2, Merge } from "lucide-react";
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
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";
import { formatBytes, cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
}

interface SortableFileProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

function SortableFile({ file, onRemove }: SortableFileProps) {
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

export default function MergePage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [outputFilename, setOutputFilename] = useState("merged.pdf");
  const [isUploading, setIsUploading] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [resultFile, setResultFile] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesAdded = async (newFiles: File[]) => {
    setIsUploading(true);
    try {
      for (const file of newFiles) {
        const result = await uploadFile(file);
        setFiles((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            name: result.filename,
            originalName: file.name,
            size: file.size,
          },
        ]);
      }
      toast.success(`Uploaded ${newFiles.length} file(s)`);
    } catch (error) {
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      toast.error("Please add at least 2 files to merge");
      return;
    }

    setIsMerging(true);
    setResultFile(null);

    try {
      const res = await api.post("/api/pdf/merge", {
        session_id: sessionId,
        files: files.map((f) => f.name),
        output_name: outputFilename,
      });

      setResultFile(res.data.output_filename);
      toast.success("PDFs merged successfully!");
    } catch (error) {
      toast.error("Failed to merge PDFs");
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (resultFile) {
      downloadFile(resultFile);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Merge className="w-7 h-7 text-primary" />
          Merge PDF
        </h1>
        <p className="text-muted-foreground mt-1">
          Combine multiple PDF files into a single document
        </p>
      </div>

      <div className="bg-white rounded-xl border border-border p-6 space-y-6">
        <FileDropzone
          onFilesAdded={handleFilesAdded}
          multiple
          label="Drop PDF files here or click to browse"
        />

        {isUploading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">
              Files to merge ({files.length}) — drag to reorder
            </h3>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={files.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {files.map((file) => (
                    <SortableFile
                      key={file.id}
                      file={file}
                      onRemove={handleRemoveFile}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Output Filename
          </label>
          <input
            type="text"
            value={outputFilename}
            onChange={(e) => setOutputFilename(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="merged.pdf"
          />
        </div>

        <button
          onClick={handleMerge}
          disabled={files.length < 2 || isMerging}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMerging ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Merging...
            </>
          ) : (
            <>
              <Merge className="w-5 h-5" />
              Merge PDFs
            </>
          )}
        </button>
      </div>

      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">Merge Complete!</h3>
          <p className="text-green-700 mb-4">
            Your merged PDF is ready for download.
          </p>
          <button
            onClick={handleDownload}
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
