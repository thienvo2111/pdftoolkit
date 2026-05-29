import { Link } from "react-router-dom";
import {
  Merge,
  Scissors,
  RotateCw,
  FileStack,
  Lock,
  FileType,
  Shield,
  Clock,
  Key,
  ArrowRight,
} from "lucide-react";
import { useLangStore } from "@/store/language";

export default function HomePage() {
  const { tr } = useLangStore();

  const tools = [
    { path: "/merge", name: tr.mergePdf, description: tr.mergeDesc, icon: Merge, color: "bg-blue-600", shadow: "shadow-blue-500/20" },
    { path: "/split", name: tr.splitPdf, description: tr.splitDesc, icon: Scissors, color: "bg-emerald-600", shadow: "shadow-emerald-500/20" },
    { path: "/rotate", name: tr.rotate, description: tr.rotateDesc, icon: RotateCw, color: "bg-violet-600", shadow: "shadow-violet-500/20" },
    { path: "/pages", name: tr.pages, description: tr.pagesDesc, icon: FileStack, color: "bg-orange-600", shadow: "shadow-orange-500/20" },
    { path: "/protect", name: tr.protect, description: tr.protectDesc, icon: Lock, color: "bg-rose-600", shadow: "shadow-rose-500/20" },
    { path: "/convert", name: tr.convert, description: tr.convertDesc, icon: FileType, color: "bg-indigo-600", shadow: "shadow-indigo-500/20" },
  ];

  const privacyFeatures = [
    { icon: Shield, title: tr.noStorage, description: tr.noStorageDesc },
    { icon: Clock, title: tr.autoDelete, description: tr.autoDeleteDesc },
    { icon: Key, title: tr.apiKeyPrivate, description: tr.apiKeyPrivateDesc },
  ];

  return (
    <div className="space-y-14">
      {/* Hero */}
      <section className="relative rounded-2xl overflow-hidden bg-[#0f172a] px-8 py-14 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-[#0f172a] to-indigo-900/30 pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest">
            PDF Toolkit
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            {tr.heroTitle}
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">{tr.heroSubtitle}</p>
        </div>
      </section>

      {/* Tools Grid */}
      <section>
        <h2 className="text-xl font-bold mb-5 text-slate-700">{tr.allTools}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex gap-4 items-start"
            >
              <div
                className={`w-11 h-11 rounded-xl ${tool.color} ${tool.shadow} shadow-lg flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
              >
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {tool.name}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-sm text-slate-500 mt-0.5 leading-snug">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white rounded-2xl border border-slate-200 p-8">
        <h2 className="text-xl font-bold mb-8 text-center text-slate-800">{tr.howItWorks}</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 flex-wrap">
          {[tr.step1, tr.step2, tr.step3, tr.step4].map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2 w-24">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg shadow-blue-500/30 shrink-0">
                  {i + 1}
                </span>
                <span className="font-medium text-slate-700 text-sm text-center leading-tight">{step}</span>
              </div>
              {i < 3 && (
                <ArrowRight className="hidden md:block w-4 h-4 text-slate-300 shrink-0 mb-5" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-[#0f172a] rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-8 text-center text-white">{tr.privacyTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {privacyFeatures.map((feature, i) => (
            <div key={i} className="text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
