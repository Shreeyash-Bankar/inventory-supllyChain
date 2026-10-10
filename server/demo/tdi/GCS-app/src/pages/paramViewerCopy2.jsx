import { useState, useEffect, useMemo, memo } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { toast } from "sonner";

export default function ParamViewer() {
  const [params, setParams] = useState({});
  const [meta, setMeta] = useState({});
  const [editing, setEditing] = useState({});
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState("");

  // ---------------- TYPE MAP ----------------
  const TYPE_MAP = {
    2: "UINT8",
    3: "INT16",
    4: "INT32",
    5: "UINT32",
    6: "FLOAT",
    7: "DOUBLE",
    9: "FLOAT",
  };

  function notify(type, msg) {
    if (type === "error") {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
  }

  // ---------------- SAVE ----------------
  const handleSave = async (key) => {
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

    setParams((prev) => ({
      ...prev,
      [key]: { ...prev[key], value },
    }));

    try {
      await window.electron.setParam({
        id: key,
        value,
        type: param.type,
        index: param.index,
      });

      notify("success", `${key} updated`);

      setEditing((p) => ({ ...p, [key]: false }));
      setDrafts((p) => {
        const copy = { ...p };
        delete copy[key];
        return copy;
      });
    } catch (err) {
      setParams((prev) => ({
        ...prev,
        [key]: { ...prev[key], value: previous },
      }));

      notify("error", `Failed to update ${key}`);
    }
  };

  // ---------------- INIT ----------------
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setLoading(true);

        const m = await window.electron.getParamMeta();
        if (!alive) return;
        setMeta(m || {});

        await window.electron.requestParams();
      } catch (err) {
        notify("error", "Failed to load parameters");
        setLoading(false);
      }
    };

    load();

    const unsubParam = window.electron.onParam((msg) => {
      if (!msg?.id) return;

      setParams((prev) => {
        const existing = prev[msg.id] || {};
        return {
          ...prev,
          [msg.id]: {
            ...existing,
            id: msg.id,
            value: msg.value,
            type: msg.type ?? existing.type,
            index: msg.index ?? existing.index,
          },
        };
      });
    });

    const unsubComplete = window.electron.onParamComplete((msg) => {
      setParams(msg.params || {});
      setTotal(msg.total || Object.keys(msg.params || {}).length);
      setLoading(false);
      // notify("success", `Loaded ${msg.total} parameters`);
    });

    return () => {
      alive = false;
      unsubParam?.();
      unsubComplete?.();
    };
  }, []);

  // ---------------- GROUPING ----------------
  const grouped = useMemo(() => {
    const groups = {};

    for (const [key, param] of Object.entries(params)) {
      const category = meta[key]?.category || "Uncategorized";

      if (!groups[category]) groups[category] = [];
      groups[category].push({ key, param });
    }

    return groups;
  }, [params, meta]);

  // ---------------- DEFAULT CATEGORY ----------------
  useEffect(() => {
    const cats = Object.keys(grouped);
    if (!activeCategory && cats.length > 0) {
      setActiveCategory(cats[0]);
    }
  }, [grouped]);

  // ---------------- SEARCH FILTER ----------------
  const visibleGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
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
  }, [search, grouped, meta]);

  // ---------------- ROW (SINGLE SOURCE OF TRUTH) ----------------

  const ParamRow = memo(({ paramKey, param, isEditing, draftValue, meta }) => {
    return (
      <Card className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-56 font-mono text-sm">{paramKey}</div>

          <Input
            className="w-32"
            disabled={!isEditing}
            value={draftValue ?? param.value}
            onChange={(e) =>
              setDrafts((p) => ({
                ...p,
                [paramKey]: e.target.value,
              }))
            }
          />

          <div className="w-20 text-xs text-gray-500">
            {TYPE_MAP[param.type] || "UNKNOWN"}
          </div>

          <div className="w-20 text-xs text-gray-500">
            ID: {param.index ?? "—"}
          </div>

          {!isEditing ? (
            <Button
              variant="outline"
              onClick={() => {
                setEditing((p) => ({ ...p, [paramKey]: true }));
                setDrafts((p) => ({
                  ...p,
                  [paramKey]: param.value,
                }));
              }}
            >
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={() => handleSave(paramKey)}>Save</Button>
              <Button
                variant="ghost"
                onClick={() => setEditing((p) => ({ ...p, [paramKey]: false }))}
              >
                Cancel
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {meta?.description || "No description available"}
        </div>
      </Card>
    );
  });

  // const ParamRow = React.memo(
  //   ({ paramKey, param, isEditing, draftValue, meta }) => {

  //     return (
  //       <Card className="p-3 flex flex-col gap-2">
  //         <div className="flex items-center gap-3">
  //           <div className="w-56 font-mono text-sm">{paramKey}</div>

  //           <Input
  //             className="w-32"
  //             disabled={!isEditing}
  //             value={draftValue}
  //             onChange={(e) =>
  //               setDrafts((p) => ({
  //                 ...p,
  //                 [paramKey]: e.target.value,
  //               }))
  //             }
  //           />

  //           <div className="w-20 text-xs text-gray-500">
  //             {TYPE_MAP[param.type] || "UNKNOWN"}
  //           </div>

  //           <div className="w-20 text-xs text-gray-500">
  //             ID: {param.index ?? "—"}
  //           </div>

  //           {!isEditing ? (
  //             <Button
  //               variant="outline"
  //               onClick={() => {
  //                 setEditing((p) => ({ ...p, [paramKey]: true }));
  //                 setDrafts((p) => ({ ...p, [paramKey]: param.value }));
  //               }}
  //             >
  //               Edit
  //             </Button>
  //           ) : (
  //             <>
  //               <Button onClick={() => handleSave(paramKey)}>Save</Button>
  //               <Button
  //                 variant="ghost"
  //                 onClick={() =>
  //                   setEditing((p) => ({ ...p, [paramKey]: false }))
  //                 }
  //               >
  //                 Cancel
  //               </Button>
  //             </>
  //           )}
  //         </div>

  //         <div className="text-xs text-gray-500">
  //           {m?.description || "No description available"}
  //         </div>
  //       </Card>
  //     );
  //   },
  // );

  // ---------------- UI ----------------
  return (
    <div className="p-4 space-y-4">
      <Button onClick={() => window.electron.requestParams()}>
        Reload Parameters
      </Button>

      <h2 className="text-xl font-semibold">
        MAVLink Parameters ({total || 0})
      </h2>

      {loading && <p className="text-orange-500">Loading...</p>}

      <Input
        placeholder="Search parameters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* CATEGORY TABS */}
      {!search && (
        <div className="flex gap-2 flex-wrap border-b pb-2 ">
          {Object.keys(grouped).map((cat) => (
            <Button
              key={cat}
              variant={cat === activeCategory ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
            >
              {cat} ({grouped[cat].length})
            </Button>
          ))}
        </div>
      )}

      {/* LIST */}
      <div className="space-y-3">
        {search
          ? Object.entries(visibleGroups).map(([category, items]) => (
              <div key={category}>
                <div className="text-sm font-bold text-gray-500">
                  {category}
                </div>

                {items.map(({ key, param }) => (
                  <ParamRow
                    key={key}
                    paramKey={key}
                    param={param}
                    isEditing={editing[key]}
                    draftValue={drafts[key]}
                    meta={meta[key]}
                  />
                ))}
              </div>
            ))
          : (grouped[activeCategory] || []).map(({ key, param }) => (
              <ParamRow
                key={key}
                paramKey={key}
                param={param}
                isEditing={editing[key]}
                draftValue={drafts[key]}
                meta={meta[key]}
              />
            ))}
      </div>
    </div>
  );
}
