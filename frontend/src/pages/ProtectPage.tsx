import { useState } from "react";
import { Lock, Unlock, Download, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import FileDropzone from "@/components/FileDropzone";
import { useSessionStore } from "@/store/session";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type TabType = "add" | "remove";

export default function ProtectPage() {
  const { sessionId, uploadFile, downloadFile } = useSessionStore();
  const [activeTab, setActiveTab] = useState<TabType>("add");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; pages: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultFile, setResultFile] = useState<string | null>(null);

  // Add password state
  const [userPassword, setUserPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);

  // Remove password state
  const [unlockPassword, setUnlockPassword] = useState("");

  const handleFileAdded = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const result = await uploadFile(files[0]);
      setUploadedFile({ name: result.filename, pages: result.pages });
      setResultFile(null);
      toast.success(`Uploaded: ${files[0].name}`);
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResultFile(null);
  };

  const handleAddPassword = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    if (!userPassword && !ownerPassword) {
      toast.error("Please enter at least one password");
      return;
    }

    setIsProcessing(true);
    setResultFile(null);

    try {
      const res = await api.post("/api/pdf/protect", {
        session_id: sessionId,
        filename: uploadedFile.name,
        user_password: userPassword || "",
        owner_password: ownerPassword || "",
        allow_print: allowPrint,
        allow_copy: allowCopy,
      });

      setResultFile(res.data.output_filename);
      toast.success("Password protection added!");
    } catch (error) {
      toast.error("Failed to protect PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePassword = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    if (!unlockPassword) {
      toast.error("Please enter the password to unlock");
      return;
    }

    setIsProcessing(true);
    setResultFile(null);

    try {
      const res = await api.post("/api/pdf/unlock", {
        session_id: sessionId,
        filename: uploadedFile.name,
        password: unlockPassword,
      });

      setResultFile(res.data.output_filename);
      toast.success("Password removed successfully!");
    } catch (error) {
      toast.error("Failed to remove password. Check if the password is correct.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Lock className="w-7 h-7 text-primary" />
          Protect PDF
        </h1>
        <p className="text-muted-foreground mt-1">
          Add or remove password protection from your PDF
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => handleTabChange("add")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
            activeTab === "add"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Lock className="w-4 h-4" />
          Add Password
        </button>
        <button
          onClick={() => handleTabChange("remove")}
          className={cn(
            "flex items-center gap-2 px-4 py-3 border-b-2 transition-colors",
            activeTab === "remove"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Unlock className="w-4 h-4" />
          Remove Password
        </button>
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

            {activeTab === "add" ? (
              <>
                {/* User Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    User Password (required to open)
                  </label>
                  <input
                    type="password"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter user password"
                  />
                </div>

                {/* Owner Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Owner Password (required to modify)
                  </label>
                  <input
                    type="password"
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter owner password"
                  />
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Permissions</p>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPrint}
                      onChange={(e) => setAllowPrint(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Allow printing</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCopy}
                      onChange={(e) => setAllowCopy(e.target.checked)}
                      className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Allow copying text</span>
                  </label>
                </div>

                <button
                  onClick={handleAddPassword}
                  disabled={isProcessing || (!userPassword && !ownerPassword)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Protecting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Protect PDF
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Unlock Password */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    className="w-full max-w-xs px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Enter current password"
                  />
                </div>

                <button
                  onClick={handleRemovePassword}
                  disabled={isProcessing || !unlockPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-5 h-5" />
                      Remove Password
                    </>
                  )}
                </button>
              </>
            )}

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Passwords are not stored on our servers. Your document is
                processed securely and automatically deleted.
              </p>
            </div>
          </>
        )}
      </div>

      {resultFile && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-800 mb-2">
            {activeTab === "add" ? "Protection Added!" : "Password Removed!"}
          </h3>
          <p className="text-green-700 mb-4">
            Your {activeTab === "add" ? "protected" : "unlocked"} PDF is ready for
            download.
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
