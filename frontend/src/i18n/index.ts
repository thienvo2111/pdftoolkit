export type Lang = "vi" | "en";

export const t = {
  vi: {
    // Nav
    home: "Trang chủ",
    mergePdf: "Gộp PDF",
    splitPdf: "Tách PDF",
    rotate: "Xoay trang",
    pages: "Quản lý trang",
    protect: "Bảo mật",
    convert: "Chuyển đổi",
    // Session
    sessionInfo: "Thông tin phiên",
    sessionId: "Mã phiên",
    filesInSession: "File trong phiên",
    // Home hero
    heroTitle: "Công cụ PDF chuyên nghiệp",
    heroSubtitle:
      "Xử lý PDF nhanh chóng và bảo mật. Không lưu trữ vĩnh viễn, không thu thập dữ liệu.",
    // Home tools
    allTools: "Công cụ",
    mergeDesc: "Gộp nhiều PDF thành một file duy nhất",
    splitDesc: "Tách PDF thành nhiều file riêng",
    rotateDesc: "Xoay trang trong tài liệu PDF",
    pagesDesc: "Xóa, sắp xếp lại hoặc trích xuất trang",
    protectDesc: "Thêm hoặc xóa mật khẩu bảo vệ",
    convertDesc: "PDF sang ảnh, ảnh sang PDF, thêm watermark",
    // Privacy
    privacyTitle: "Bảo mật thông tin của bạn",
    noStorage: "Không lưu đám mây",
    noStorageDesc: "File được xử lý tại chỗ và không bao giờ lưu vĩnh viễn trên server",
    autoDelete: "Tự động xóa",
    autoDeleteDesc: "Tất cả file tải lên sẽ tự động bị xóa sau 30 phút",
    apiKeyPrivate: "API Key bảo mật",
    apiKeyPrivateDesc: "API key AI chỉ lưu trong phiên làm việc của trình duyệt",
    // How it works
    howItWorks: "Cách sử dụng",
    step1: "Tải lên PDF",
    step2: "Chọn công cụ",
    step3: "Tải về kết quả",
    // Footer
    footerText: "File tự động xóa sau 30 phút để bảo vệ quyền riêng tư của bạn.",
  },
  en: {
    home: "Home",
    mergePdf: "Merge PDF",
    splitPdf: "Split PDF",
    rotate: "Rotate",
    pages: "Manage Pages",
    protect: "Protect",
    convert: "Convert",
    sessionInfo: "Session Info",
    sessionId: "Session ID",
    filesInSession: "Files in session",
    heroTitle: "Professional PDF Tools",
    heroSubtitle:
      "Process your PDFs securely and efficiently. No permanent storage, no data collection.",
    allTools: "All Tools",
    mergeDesc: "Combine multiple PDFs into one document",
    splitDesc: "Split a PDF into separate files",
    rotateDesc: "Rotate pages in your PDF",
    pagesDesc: "Delete, reorder, or extract pages",
    protectDesc: "Add or remove password protection",
    convertDesc: "PDF to images, images to PDF, watermark",
    privacyTitle: "Your Privacy Matters",
    noStorage: "No Cloud Storage",
    noStorageDesc: "Files are processed locally and never stored permanently on our servers",
    autoDelete: "Auto-Delete",
    autoDeleteDesc: "All uploaded files are automatically deleted after 30 minutes",
    apiKeyPrivate: "API Keys Stay Private",
    apiKeyPrivateDesc: "Your AI API keys are only stored in your browser session",
    howItWorks: "How It Works",
    step1: "Upload your PDF",
    step2: "Choose your tool",
    step3: "Download result",
    footerText: "Files are automatically deleted after 30 minutes for your privacy.",
  },
} as const;
