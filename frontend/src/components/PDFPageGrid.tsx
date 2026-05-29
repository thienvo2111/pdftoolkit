import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/store/session";

interface PDFPageGridProps {
  filename: string;
  totalPages: number;
  selectedPages: number[];       // multiple mode: trang được chọn | reorder mode: thứ tự mới
  onChange: (pages: number[]) => void;
  mode: "multiple" | "reorder";
  label?: string;
}

function thumbnailUrl(sessionId: string, filename: string, page: number): string {
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
  return `${base}/api/pdf/thumbnail?session_id=${encodeURIComponent(sessionId)}&filename=${encodeURIComponent(filename)}&page=${page}&dpi=96`;
}

// ── Thumbnail card dùng cho multiple-select mode ──────────────────────────────
interface ThumbCardProps {
  sessionId: string;
  filename: string;
  page: number;
  selected: boolean;
  onClick: () => void;
}

function ThumbCard({ sessionId, filename, page, selected, onClick }: ThumbCardProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative group rounded-xl border-2 overflow-hidden transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        selected
          ? "border-blue-500 shadow-lg shadow-blue-200"
          : "border-slate-200 hover:border-blue-300 hover:shadow-md"
      )}
    >
      {/* Skeleton while loading */}
      {!loaded && !imgError && (
        <div className="w-full aspect-[3/4] bg-slate-100 animate-pulse" />
      )}

      {/* Thumbnail image */}
      {!imgError && (
        <img
          src={thumbnailUrl(sessionId, filename, page)}
          alt={`Trang ${page}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setImgError(true); setLoaded(true); }}
          className={cn(
            "w-full object-contain transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0 absolute inset-0 h-0"
          )}
        />
      )}

      {/* Fallback khi ảnh lỗi */}
      {imgError && (
        <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-slate-50 gap-2">
          <ImageOff className="w-6 h-6 text-slate-300" />
          <span className="text-xs text-slate-400">Trang {page}</span>
        </div>
      )}

      {/* Page number badge */}
      <div className={cn(
        "absolute bottom-0 inset-x-0 py-1 text-center text-xs font-semibold transition-colors",
        selected ? "bg-blue-500 text-white" : "bg-white/90 text-slate-600"
      )}>
        {page}
      </div>

      {/* Selected checkmark overlay */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow">
          <Check className="w-3 h-3 text-white stroke-[3]" />
        </div>
      )}

      {/* Hover overlay */}
      {!selected && (
        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors pointer-events-none" />
      )}
    </button>
  );
}

// ── Sortable card dùng cho reorder mode ───────────────────────────────────────
interface SortableThumbProps {
  sessionId: string;
  filename: string;
  page: number;
  index: number;
}

function SortableThumb({ sessionId, filename, page, index }: SortableThumbProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative rounded-xl border-2 border-slate-200 overflow-hidden bg-white transition-shadow cursor-grab active:cursor-grabbing select-none touch-none",
        isDragging && "shadow-2xl border-blue-400 opacity-60 z-50 scale-105"
      )}
    >
      {/* Drag hint icon (visual only) */}
      <div className="absolute top-1 left-1 z-10 p-1 rounded bg-white/80 text-slate-400 pointer-events-none">
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Order badge */}
      <div className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold shadow">
        {index + 1}
      </div>

      {!loaded && !imgError && (
        <div className="w-full aspect-[3/4] bg-slate-100 animate-pulse" />
      )}

      {!imgError && (
        <img
          src={thumbnailUrl(sessionId, filename, page)}
          alt={`Trang ${page}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => { setImgError(true); setLoaded(true); }}
          className={cn(
            "w-full object-contain",
            loaded ? "opacity-100" : "opacity-0 absolute inset-0 h-0"
          )}
        />
      )}

      {imgError && (
        <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-slate-50 gap-2">
          <ImageOff className="w-5 h-5 text-slate-300" />
          <span className="text-xs text-slate-400">{page}</span>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 py-1 text-center text-xs font-medium bg-white/90 text-slate-500">
        Trang {page}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PDFPageGrid({
  filename,
  totalPages,
  selectedPages,
  onChange,
  mode,
  label,
}: PDFPageGridProps) {
  const { sessionId } = useSessionStore();
  const sid = sessionId ?? "";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedPages.indexOf(active.id as number);
      const newIndex = selectedPages.indexOf(over.id as number);
      onChange(arrayMove(selectedPages, oldIndex, newIndex));
    }
  };

  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      onChange(selectedPages.filter((p) => p !== page));
    } else {
      onChange([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const allSelected = allPages.every((p) => selectedPages.includes(p));

  // ── Reorder mode ─────────────────────────────────────────────────────────
  if (mode === "reorder") {
    return (
      <div className="space-y-3">
        {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
        <p className="text-xs text-slate-400">Kéo thả để sắp xếp lại thứ tự trang</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={selectedPages} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {selectedPages.map((page, index) => (
                <SortableThumb
                  key={page}
                  sessionId={sid}
                  filename={filename}
                  page={page}
                  index={index}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  // ── Multiple select mode ──────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        {label && <p className="text-sm font-medium text-slate-600">{label}</p>}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-400">
            Đã chọn <span className="font-semibold text-slate-700">{selectedPages.length}</span>/{totalPages} trang
          </span>
          <button
            type="button"
            onClick={() => onChange(allSelected ? [] : allPages)}
            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors text-slate-500"
          >
            {allSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {allPages.map((page) => (
          <ThumbCard
            key={page}
            sessionId={sid}
            filename={filename}
            page={page}
            selected={selectedPages.includes(page)}
            onClick={() => togglePage(page)}
          />
        ))}
      </div>
    </div>
  );
}
