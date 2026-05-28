import { create } from "zustand";
import api from "../lib/api";

interface SessionState {
  sessionId: string | null;
  files: Array<{ name: string; size: number; created_at: string }>;
  initSession: () => Promise<void>;
  refreshFiles: () => Promise<void>;
  uploadFile: (file: File) => Promise<{ filename: string; pages: number }>;
  downloadFile: (filename: string) => Promise<void>;
  deleteSession: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionId: null,
  files: [],

  initSession: async () => {
    let sessionId = sessionStorage.getItem("pdftool_session_id");
    if (!sessionId) {
      const res = await api.post("/api/session/create");
      sessionId = res.data.session_id;
      sessionStorage.setItem("pdftool_session_id", sessionId!);
    }
    set({ sessionId });
    await get().refreshFiles();
  },

  refreshFiles: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    try {
      const res = await api.get(`/api/session/${sessionId}/files`);
      set({ files: res.data });
    } catch {
      set({ files: [] });
    }
  },

  uploadFile: async (file: File) => {
    const { sessionId } = get();
    if (!sessionId) throw new Error("No active session");
    const form = new FormData();
    form.append("file", file);
    const res = await api.post(`/api/session/${sessionId}/upload`, form);
    await get().refreshFiles();
    return res.data;
  },

  downloadFile: async (filename: string) => {
    const { sessionId } = get();
    if (!sessionId) throw new Error("No active session");
    const res = await api.get(`/api/session/${sessionId}/download/${filename}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  deleteSession: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    await api.delete(`/api/session/${sessionId}`);
    sessionStorage.removeItem("pdftool_session_id");
    set({ sessionId: null, files: [] });
  },
}));
