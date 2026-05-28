import { useCallback } from "react";
import { useDropzone, Accept } from "react-dropzone";
import { Upload, X, FileText } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface FileDropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  files?: File[];
  onRemoveFile?: (index: number) => void;
}

export default function FileDropzone({
  onFilesAdded,
  accept = "application/pdf",
  multiple = false,
  label = "Drop PDF files here or click to browse",
  files = [],
  onRemoveFile,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesAdded(acceptedFiles);
    },
    [onFilesAdded]
  );

  const acceptObj: Accept = {};
  accept.split(",").forEach((type) => {
    const trimmed = type.trim();
    if (trimmed === "application/pdf") {
      acceptObj["application/pdf"] = [".pdf"];
    } else if (trimmed === "image/*") {
      acceptObj["image/*"] = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    } else {
      acceptObj[trimmed] = [];
    }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptObj,
    multiple,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "w-12 h-12 mx-auto mb-4",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p
          className={cn(
            "text-lg font-medium",
            isDragActive ? "text-primary" : "text-foreground"
          )}
        >
          {isDragActive ? "Drop files here..." : label}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {multiple ? "You can upload multiple files" : "Upload a single file"}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-muted-foreground">
            Selected Files ({files.length})
          </h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm truncate max-w-xs">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => onRemoveFile(index)}
                    className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
