import React from "react";
import { memo } from "react";

export const ParamRow = memo(
  ({ paramKey, param, isEditing, draftValue, meta }) => {
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
  },
);
