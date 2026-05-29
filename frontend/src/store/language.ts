import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Lang } from "@/i18n";
import { t } from "@/i18n";

// Dùng union của cả 2 locale thay vì pin vào "vi"
type Translations = (typeof t)[Lang];

interface LangState {
  lang: Lang;
  toggle: () => void;
  tr: Translations;
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
