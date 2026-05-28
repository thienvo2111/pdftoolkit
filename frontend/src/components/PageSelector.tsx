import { useState } from "react";
import { X, Plus, GripVertical } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface PageSelectorProps {
  totalPages: number;
  selectedPages: number[];
  onChange: (pages: number[]) => void;
  mode: "multiple" | "range" | "reorder";
}

interface SortablePageProps {
  page: number;
  index: number;
}

function SortablePage({ page, index }: SortablePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 bg-white border border-border rounded-lg px-4 py-3",
        isDragging && "shadow-lg opacity-90"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <span className="font-medium">Page {page}</span>
      <span className="text-sm text-muted-foreground ml-auto">
        Position {index + 1}
      </span>
    </div>
  );
}

export default function PageSelector({
  totalPages,
  selectedPages,
  onChange,
  mode,
}: PageSelectorProps) {
  const [rangeFrom, setRangeFrom] = useState(1);
  const [rangeTo, setRangeTo] = useState(1);
  const [ranges, setRanges] = useState<Array<{ from: number; to: number }>>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCheckboxChange = (page: number) => {
    if (selectedPages.includes(page)) {
      onChange(selectedPages.filter((p) => p !== page));
    } else {
      onChange([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    if (selectedPages.length === totalPages) {
      onChange([]);
    } else {
      onChange(Array.from({ length: totalPages }, (_, i) => i + 1));
    }
  };

  const handleAddRange = () => {
    if (rangeFrom > 0 && rangeTo > 0 && rangeFrom <= rangeTo && rangeTo <= totalPages) {
      const newRanges = [...ranges, { from: rangeFrom, to: rangeTo }];
      setRanges(newRanges);

      // Update selected pages based on all ranges
      const allPages = new Set<number>();
      newRanges.forEach((range) => {
        for (let i = range.from; i <= range.to; i++) {
          allPages.add(i);
        }
      });
      onChange(Array.from(allPages).sort((a, b) => a - b));

      setRangeFrom(1);
      setRangeTo(1);
    }
  };

  const handleRemoveRange = (index: number) => {
    const newRanges = ranges.filter((_, i) => i !== index);
    setRanges(newRanges);

    // Update selected pages
    const allPages = new Set<number>();
    newRanges.forEach((range) => {
      for (let i = range.from; i <= range.to; i++) {
        allPages.add(i);
      }
    });
    onChange(Array.from(allPages).sort((a, b) => a - b));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedPages.findIndex((p) => p.toString() === active.id);
      const newIndex = selectedPages.findIndex((p) => p.toString() === over.id);
      onChange(arrayMove(selectedPages, oldIndex, newIndex));
    }
  };

  if (mode === "multiple") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            Select pages ({selectedPages.length} of {totalPages} selected)
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-primary hover:underline"
          >
            {selectedPages.length === totalPages ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <label
              key={page}
              className={cn(
                "flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors",
                selectedPages.includes(page)
                  ? "bg-primary text-white border-primary"
                  : "bg-white border-border hover:border-primary/50"
              )}
            >
              <input
                type="checkbox"
                checked={selectedPages.includes(page)}
                onChange={() => handleCheckboxChange(page)}
                className="sr-only"
              />
              <span className="font-medium">{page}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "range") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">From Page</label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={rangeFrom}
              onChange={(e) => setRangeFrom(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Page</label>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={rangeTo}
              onChange={(e) => setRangeTo(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleAddRange}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Range
          </button>
        </div>

        {ranges.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Selected Ranges:</span>
            <div className="flex flex-wrap gap-2">
              {ranges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-lg"
                >
                  <span className="text-sm">
                    Pages {range.from}-{range.to}
                  </span>
                  <button
                    onClick={() => handleRemoveRange(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Total pages selected: {selectedPages.length}
            </p>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Total pages in document: {totalPages}
        </p>
      </div>
    );
  }

  if (mode === "reorder") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Drag and drop pages to reorder them. Current order: {selectedPages.length} pages
        </p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedPages.map((p) => p.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {selectedPages.map((page, index) => (
                <SortablePage key={page} page={page} index={index} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    );
  }

  return null;
}
