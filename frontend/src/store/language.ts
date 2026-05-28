import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";

interface LangState {
  lang: Lang;
  toggle: () => void;
  tr: (typeof t)["vi"];
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "vi",
      tr: t["vi"],
      toggle: () => {
        const next: Lang = get().lang === "vi" ? "en" : "vi";
        set({ lang: next, tr: t[next] });
      },
    }),
    { name: "pdftool_lang" }
  )
);
