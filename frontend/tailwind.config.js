/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563eb", foreground: "#ffffff" },
        secondary: { DEFAULT: "#f1f5f9", foreground: "#0f172a" },
        destructive: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        muted: { DEFAULT: "#f8fafc", foreground: "#64748b" },
        accent: { DEFAULT: "#f1f5f9", foreground: "#0f172a" },
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#2563eb",
        background: "#ffffff",
        foreground: "#0f172a",
      },
      borderRadius: { lg: "0.75rem", md: "0.5rem", sm: "0.25rem" },
    },
  },
  plugins: [],
};
