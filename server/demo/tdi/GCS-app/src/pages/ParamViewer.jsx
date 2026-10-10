import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useDeferredValue,
} from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { useParamStore } from "@/store/paramStore";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";
import { useTelemetryStore } from "@/store/telemetryStore";

import {
  Loader2,
  RefreshCw,
  Search,
  Sliders,
  Check,
  X,
  Edit3,
} from "lucide-react";

/* ---------------- TYPE MAP ---------------- */
const TYPE_MAP = {
  2: "UINT8",
  3: "INT16",
  4: "INT32",
  5: "UINT32",
  6: "FLOAT",
  7: "DOUBLE",
  9: "FLOAT",
};

/* ---------------- ROW COMPONENT (OPTIMIZED & STYLED) ---------------- */
const ParamRow = memo(function ParamRow({
  paramKey,
  param,
  meta,
  isEditing,
  draftValue,
  onEdit,
  onCancel,
  onSave,
  onChangeDraft,
}) {
  const typeStr = TYPE_MAP[param.type] || "UNKNOWN";

  return (
    <Card
      className={`group p-4 bg-zinc-900/60 border-zinc-800/80 backdrop-blur-sm transition-all duration-200 hover:bg-zinc-900/90 hover:border-zinc-700/50 [content-visibility:auto] [contain-intrinsic-size:80px] ${
        isEditing
          ? "ring-2 ring-blue-500/50 border-blue-500/50 bg-zinc-900"
          : ""
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Name and Metadata Label */}
        <div className="flex flex-col gap-1 min-w-[240px] max-w-sm">
          <span className="font-mono text-sm font-semibold text-zinc-100 tracking-tight break-all">
            {paramKey}
          </span>
          <span className="text-xs text-zinc-400 font-normal line-clamp-2 group-hover:line-clamp-none transition-all">
            {meta?.description || "No parameter description available."}
          </span>
        </div>

        {/* Dynamic Controls Grid */}
        <div className="flex items-center gap-4 ml-auto w-full md:w-auto justify-between md:justify-end">
          {/* Hardware Tech Badges */}
          <div className="flex items-center gap-2 text-[11px] font-mono select-none">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/40">
              {typeStr}
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-800/40 text-zinc-500 hidden sm:inline">
              IDX: {param.index ?? "—"}
            </span>
          </div>

          {/* Interactive Core */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                className={`w-28 h-9 font-mono text-sm text-right pr-3 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-blue-500 transition-all ${
                  isEditing
                    ? "border-blue-500 bg-zinc-950 text-blue-400 font-bold"
                    : "opacity-80"
                }`}
                disabled={!isEditing}
                value={draftValue ?? param.value}
                onChange={(e) => onChangeDraft(paramKey, e.target.value)}
              />
            </div>

            {/* Action Triggers */}
            <div className="flex items-center w-20 justify-end">
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(paramKey, param.value)}
                  className="h-9 px-3 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-1.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    className="h-9 w-9 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                    onClick={() => onSave(paramKey)}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                    onClick={() => onCancel(paramKey)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
});

/* ---------------- MAIN COMPONENT ---------------- */
export default function ParamViewer() {
  const connectionState = useTelemetryStore((s) => s.connectionState);

  const isConnected = connectionState === "CONNECTED";
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");
  const parentRef = useRef(null);

  const deferredSearch = useDeferredValue(search);

  const params = useParamStore((s) => s.params);
  const meta = useParamStore((s) => s.meta);
  const loading = useParamStore((s) => s.loading);
  const total = useParamStore((s) => s.total);
  const updateParam = useParamStore((s) => s.updateParam);

  useEffect(() => {
    if (isConnected !== "CONNECTED") return;

    async function loadParams() {
      setLoading(true);
      await window.electron.requestParams();
    }

    loadParams();
  }, [isConnected]);

  /* ---------------- NOTIFY (EXACT MATCH) ---------------- */
  const notify = useCallback((type, msg) => {
    type === "error" ? toast.error(msg) : toast.success(msg);
  }, []);

  /* ---------------- IPC SYSTEM LISTENER ---------------- */
  // useEffect(() => {
  //   const unsub = window.electron.onParamSetResult((res) => {
  //     if (res.success) {
  //       toast.success(`${res.id} saved successfully`);
  //     } else {
  //       toast.error(`${res.id} failed`);
  //     }
  //   });

  //   return () => unsub?.();
  // }, []);

  useEffect(() => {
    const unsub = window.electron.onParamSetResult((res) => {
      if (res.success) {
        toast.success(`${res.id} synchronized down to Flight Controller`);
      } else {
        toast.error(`Flight Controller rejected value for ${res.id}`);
      }
    });

    return () => unsub?.();
  }, []);

  /* ---------------- GROUPING ---------------- */
  const grouped = useMemo(() => {
    const groups = {};
    for (const [key, param] of Object.entries(params)) {
      const category = meta[key]?.category || "Uncategorized";
      if (!groups[category]) groups[category] = [];
      groups[category].push({ key, param });
    }
    return groups;
  }, [params, meta]);

  /* ---------------- DEFAULT CATEGORY FIXED ---------------- */
  useEffect(() => {
    const cats = Object.keys(grouped);
    if (!activeCategory && cats.length) {
      setActiveCategory(cats[0]);
    }
  }, [grouped, activeCategory]);

  /* ---------------- SEARCH FILTER ---------------- */
  const visibleGroups = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return grouped;

    const filtered = {};
    for (const [category, items] of Object.entries(grouped)) {
      const matches = items.filter(({ key, param }) => {
        const m = meta[key];
        return (
          key.toLowerCase().includes(q) ||
          String(param.value).toLowerCase().includes(q) ||
          m?.description?.toLowerCase().includes(q) ||
          category.toLowerCase().includes(q)
        );
      });
      if (matches.length) filtered[category] = matches;
    }
    return filtered;
  }, [deferredSearch, grouped, meta]);

  const currentItems = useMemo(() => {
    if (search) {
      return Object.entries(visibleGroups).flatMap(([category, items]) =>
        items.map((item) => ({
          ...item,
          category,
        })),
      );
    }

    return grouped[activeCategory] || [];
  }, [search, visibleGroups, grouped, activeCategory]);

  const rowVirtualizer = useVirtualizer({
    count: currentItems.length,

    getScrollElement: () => parentRef.current,

    estimateSize: () => 90,

    overscan: 8,
  });

  /* ---------------- ACTIONS ---------------- */
  const handleEdit = useCallback((key, value) => {
    setEditing((p) => ({ ...p, [key]: true }));
    setDrafts((p) => ({ ...p, [key]: value }));
  }, []);

  const handleCancel = useCallback((key) => {
    setEditing((p) => ({ ...p, [key]: false }));
  }, []);

  const handleChangeDraft = useCallback((key, value) => {
    setDrafts((p) => ({ ...p, [key]: value }));
  }, []);

  /* ---------------- SAVE LOGIC RESTORED ---------------- */
  const handleSave = useCallback(
    async (key) => {
      const param = params[key];
      const draftValue = drafts[key];

      if (!param) return;

      let value;
      if (param.type === 4) value = parseInt(draftValue);
      else if (param.type === 9) value = parseFloat(draftValue);
      else value = Number(draftValue);

      if (Number.isNaN(value)) {
        notify("error", "Invalid value");
        return;
      }

      const previous = param.value;
      updateParam(key, { value });

      // try {
      //   await window.electron.setParam({
      //     id: key,
      //     value,
      //     type: param.type,
      //     index: param.index,
      //   });

      //   // Restored your notification exact trigger line here
      //   // notify("success", `${key} updated`);

      //   setEditing((p) => ({ ...p, [key]: false }));
      //   setDrafts((p) => {
      //     const copy = { ...p };
      //     delete copy[key];
      //     return copy;
      //   });
      // } catch (err) {
      //   updateParam(key, { value: previous });
      //   notify("error", `Failed to update ${key}`);
      // }
      try {
        await window.electron.setParam({
          id: key,
          value,
          type: param.type,
          index: param.index,
        });

        setEditing((p) => ({ ...p, [key]: false }));

        setDrafts((p) => {
          const copy = { ...p };
          delete copy[key];
          return copy;
        });
      } catch (err) {
        updateParam(key, { value: previous });
        notify("error", `Failed to update ${key}`);
      }
    },
    [params, drafts, updateParam, notify],
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6 antialiased selection:bg-blue-500/30">
      {/* Dynamic Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold tracking-tight">
              MAVLink Telemetry Registry
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            Active Parameters Connected:{" "}
            <span className="font-mono text-zinc-200 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              {total || 0} registers
            </span>
          </p>
        </div>

        <Button
          onClick={() => window.electron.requestParams()}
          disabled={loading}
          variant="outline"
          className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 h-9 transition-colors shadow-sm ml-auto sm:ml-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-blue-400" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2 text-zinc-400" />
          )}
          Reload Parameters
        </Button>
      </div>

      {/* Control Filter Utility */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search parameters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-blue-500 rounded-lg transition-all"
        />

        {/* CATEGORY SWITCHBOARD TABS */}
        {!search && (
          <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1 max-h-24 scrollbar-thin">
            {Object.keys(grouped).map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? "bg-blue-600/10 border-blue-500/50 text-blue-400 shadow-sm shadow-blue-500/5"
                      : "bg-zinc-900/30 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  }`}
                >
                  {cat}{" "}
                  <span className="ml-1 text-[10px] opacity-60 font-mono">
                    ({grouped[cat].length})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* HIGH-PERFORMANCE LIST VIEW WRAPPER */}
        <div
          ref={parentRef}
          className="h-[calc(100vh-16rem)] overflow-y-auto border border-zinc-800/80 rounded-xl  bg-zinc-950/40 backdrop-blur-md  custom-scrollbar"
        >
          <div
            style={{
              height: rowVirtualizer.getTotalSize(),
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const { key, param } = currentItems[virtualRow.index];

              return (
                <div
                  key={key}
                  style={{
                    position: "absolute",
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    padding: "6px 12px",
                  }}
                >
                  <ParamRow
                    paramKey={key}
                    param={param}
                    meta={meta[key]}
                    isEditing={editing[key]}
                    draftValue={drafts[key]}
                    onEdit={handleEdit}
                    onCancel={handleCancel}
                    onSave={handleSave}
                    onChangeDraft={handleChangeDraft}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
