import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  Home,
  Merge,
  Scissors,
  RotateCw,
  FileStack,
  Lock,
  Minimize2,
  FileType,
  ScanText,
  Menu,
  X,
  FileText,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/merge", label: "Merge PDF", icon: Merge },
  { path: "/split", label: "Split PDF", icon: Scissors },
  { path: "/rotate", label: "Rotate", icon: RotateCw },
  { path: "/pages", label: "Pages", icon: FileStack },
  { path: "/protect", label: "Protect", icon: Lock },
  { path: "/compress", label: "Compress", icon: Minimize2 },
  { path: "/convert", label: "Convert", icon: FileType },
  { path: "/ocr", label: "OCR", icon: ScanText },
];

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSessionInfo, setShowSessionInfo] = useState(false);
  const location = useLocation();
  const { sessionId, files, initSession } = useSessionStore();

  useEffect(() => {
    initSession().catch(() => {});
  }, [initSession]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold text-foreground">PDFTool</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSessionInfo(!showSessionInfo)}
              className="relative p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Session Info"
            >
              <Info className="w-5 h-5 text-muted-foreground" />
              {files.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                  {files.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Session Info Dropdown */}
        {showSessionInfo && (
          <div className="absolute right-4 top-16 bg-white border border-border rounded-lg shadow-lg p-4 w-72 z-50">
            <h3 className="font-semibold mb-2">Session Info</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Session ID: <span className="font-mono text-xs">{sessionId?.slice(0, 8)}...</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Files in session: <span className="font-semibold">{files.length}</span>
            </p>
          </div>
        )}
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border">
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-secondary"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="bg-white w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-secondary"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          Files are automatically deleted after 30 minutes for your privacy.
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
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
