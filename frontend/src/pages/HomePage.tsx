import { Link } from "react-router-dom";
import {
  Merge,
  Scissors,
  RotateCw,
  FileStack,
  Lock,
  Minimize2,
  FileType,
  ScanText,
  Shield,
  Clock,
  Key,
} from "lucide-react";

const tools = [
  {
    path: "/merge",
    name: "Merge PDF",
    description: "Combine multiple PDFs into one document",
    icon: Merge,
    color: "bg-blue-500",
  },
  {
    path: "/split",
    name: "Split PDF",
    description: "Split a PDF into separate files",
    icon: Scissors,
    color: "bg-green-500",
  },
  {
    path: "/rotate",
    name: "Rotate PDF",
    description: "Rotate pages in your PDF",
    icon: RotateCw,
    color: "bg-purple-500",
  },
  {
    path: "/pages",
    name: "Manage Pages",
    description: "Delete, reorder, or extract pages",
    icon: FileStack,
    color: "bg-orange-500",
  },
  {
    path: "/protect",
    name: "Protect PDF",
    description: "Add or remove password protection",
    icon: Lock,
    color: "bg-red-500",
  },
  {
    path: "/compress",
    name: "Compress PDF",
    description: "Reduce PDF file size",
    icon: Minimize2,
    color: "bg-teal-500",
  },
  {
    path: "/convert",
    name: "Convert",
    description: "PDF to images, images to PDF, watermark",
    icon: FileType,
    color: "bg-indigo-500",
  },
  {
    path: "/ocr",
    name: "OCR",
    description: "Extract text to Word or Excel",
    icon: ScanText,
    color: "bg-pink-500",
  },
];

const privacyFeatures = [
  {
    icon: Shield,
    title: "No Cloud Storage",
    description: "Files are processed locally and never stored permanently on our servers",
  },
  {
    icon: Clock,
    title: "Auto-Delete",
    description: "All uploaded files are automatically deleted after 30 minutes",
  },
  {
    icon: Key,
    title: "API Keys Stay Private",
    description: "Your AI API keys are only stored in your browser session",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Professional PDF Tools
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Process your PDFs securely and efficiently. No permanent storage, no data
          collection — your files stay private.
        </p>
      </section>

      {/* Tools Grid */}
      <section>
        <h2 className="text-2xl font-bold mb-6">All Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group bg-white rounded-xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {tool.name}
              </h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Privacy Section */}
      <section className="bg-white rounded-xl border border-border p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Privacy Matters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {privacyFeatures.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="text-center">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              1
            </span>
            <span className="font-medium">Upload your PDF</span>
          </div>
          <div className="hidden md:block w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              2
            </span>
            <span className="font-medium">Choose your tool</span>
          </div>
          <div className="hidden md:block w-12 h-0.5 bg-border" />
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
              3
            </span>
            <span className="font-medium">Download result</span>
          </div>
        </div>
      </section>
    </div>
  );
}
