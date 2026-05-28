import { create } from "zustand";

interface ApiKeysState {
  provider: string;
  apiKey: string;
  model: string;
  setApiKey: (provider: string, apiKey: string, model?: string) => void;
  clearApiKey: () => void;
}

export const useApiKeysStore = create<ApiKeysState>((set) => ({
  provider: "",
  apiKey: "",
  model: "",
  setApiKey: (provider, apiKey, model = "") => set({ provider, apiKey, model }),
  clearApiKey: () => set({ provider: "", apiKey: "", model: "" }),
}));
