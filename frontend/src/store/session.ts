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
    const createNewSession = async (): Promise<string | null> => {
      for (let i = 0; i < 3; i++) {
        try {
          const res = await api.post("/api/session/create");
          const id = res.data.session_id as string;
          sessionStorage.setItem("pdftool_session_id", id);
          return id;
        } catch {
          if (i < 2) await new Promise((r) => setTimeout(r, 1500));
        }
      }
      return null;
    };

    let sessionId = sessionStorage.getItem("pdftool_session_id");

    if (sessionId) {
      // Verify the session still exists on the server
      try {
        await api.get(`/api/session/${sessionId}/files`);
      } catch {
        // Session expired or server restarted — create a fresh one
        sessionStorage.removeItem("pdftool_session_id");
        sessionId = null;
      }
    }

    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        console.warn("Could not create session after 3 attempts");
        return;
      }
    }

    set({ sessionId });
    try {
      await get().refreshFiles();
    } catch {
      set({ files: [] });
    }
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
