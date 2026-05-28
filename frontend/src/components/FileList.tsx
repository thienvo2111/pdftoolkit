import { Download, Check, FileText } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface FileItem {
  name: string;
  size: number;
  created_at: string;
}

interface FileListProps {
  files: FileItem[];
  onDownload?: (filename: string) => void;
  onSelect?: (filename: string) => void;
  selectedFile?: string;
}

export default function FileList({
  files,
  onDownload,
  onSelect,
  selectedFile,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No files in session</p>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-secondary">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-sm">Filename</th>
            <th className="text-left px-4 py-3 font-medium text-sm">Size</th>
            <th className="text-left px-4 py-3 font-medium text-sm">Created</th>
            <th className="text-right px-4 py-3 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {files.map((file) => (
            <tr
              key={file.name}
              className={
                selectedFile === file.name
                  ? "bg-primary/5"
                  : "hover:bg-secondary/50"
              }
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm truncate max-w-xs">
                    {file.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatBytes(file.size)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(file.created_at).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-2">
                  {onSelect && (
                    <button
                      onClick={() => onSelect(file.name)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        selectedFile === file.name
                          ? "bg-primary text-white"
                          : "bg-secondary hover:bg-primary/10 text-foreground"
                      }`}
                    >
                      {selectedFile === file.name ? (
                        <span className="flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Selected
                        </span>
                      ) : (
                        "Select"
                      )}
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={() => onDownload(file.name)}
                      className="p-2 rounded-lg bg-secondary hover:bg-primary/10 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
