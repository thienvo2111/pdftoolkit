import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Merge,
  Scissors,
  RotateCw,
  FileStack,
  Lock,
  FileType,
  Menu,
  X,
  FileText,
  ChevronRight,
  Files,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session";
import { useLangStore } from "@/store/language";

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const location = useLocation();
  const { sessionId, files, initSession } = useSessionStore();
  const { lang, toggle, tr } = useLangStore();

  const navItems = [
    { path: "/", label: tr.home, icon: Home, end: true },
    { path: "/merge", label: tr.mergePdf, icon: Merge },
    { path: "/split", label: tr.splitPdf, icon: Scissors },
    { path: "/rotate", label: tr.rotate, icon: RotateCw },
    { path: "/pages", label: tr.pages, icon: FileStack },
    { path: "/protect", label: tr.protect, icon: Lock },
    { path: "/convert", label: tr.convert, icon: FileType },
  ];

  useEffect(() => {
    initSession().catch(() => {});
  }, [initSession]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-wide">PDF Toolkit</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
            >
              {lang === "vi" ? "🇻🇳 VI" : "🇺🇸 EN"}
              <ChevronRight className="w-3 h-3 rotate-90 opacity-60" />
            </button>

            {/* Session info */}
            <button
              onClick={() => setShowSessionInfo(!showSessionInfo)}
              className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors"
              title={tr.sessionInfo}
            >
              <Files className="w-5 h-5 text-slate-300" />
              {files.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {files.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Session Info Dropdown */}
        {showSessionInfo && (
          <div
            className="absolute right-4 top-16 bg-[#1e293b] border border-slate-600 rounded-xl shadow-2xl p-4 w-72 z-50"
            onClick={() => setShowSessionInfo(false)}
          >
            <h3 className="font-semibold text-white mb-3 text-sm">{tr.sessionInfo}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{tr.sessionId}:</span>
                <span className="font-mono text-xs text-slate-200 bg-slate-700 px-2 py-0.5 rounded">
                  {sessionId?.slice(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{tr.filesInSession}:</span>
                <span className="font-semibold text-white">{files.length}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-60 bg-[#0f172a] border-r border-slate-800 shrink-0">
          <nav className="flex-1 p-3 space-y-0.5 pt-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                    isActive
                      ? "bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              {tr.footerText}
            </p>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 top-16 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="bg-[#0f172a] w-64 h-full p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-0.5">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm",
                        isActive
                          ? "bg-blue-600 text-white font-semibold"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto min-w-0">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-slate-800 py-5">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5 text-center">
          <p className="text-sm text-slate-500">{tr.footerText}</p>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Bản quyền thuộc về{" "}
            <span className="text-slate-400 font-semibold">VPTT</span>
            {" "}· Được xây dựng với{" "}
            <span className="text-slate-400 font-semibold">Claude Code</span>
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a] border-t border-slate-800 z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
