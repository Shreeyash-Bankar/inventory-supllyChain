import React, { useRef, useState } from "react";
import Draggable from "react-draggable";

export default function FloatingPanel({
  title,
  subtitle,
  children,
  onClose,
  right,
  width = "650px",
}) {
  const [minimized, setMinimized] = useState(false);

  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef} handle=".drag-handle" cancel=".no-drag">
      <section
        ref={nodeRef}
        className="z-9999 fixed left-6 top-6  overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 text-white shadow-2xl"
        style={{
          width,
        }}
      >
        {/* HEADER */}

        <div
          className="
            drag-handle
            flex
            h-16
            cursor-grab
            items-center
            justify-between
            border-b
            border-zinc-800
            bg-zinc-900
            px-5
            active:cursor-grabbing
          "
        >
          <div>
            <h2 className="text-lg font-bold">{title}</h2>

            {!minimized && subtitle && (
              <p className="text-xs text-zinc-500">{subtitle}</p>
            )}
          </div>

          <div className="no-drag flex items-center gap-2">
            {right}

            {/* MINIMIZE */}

            <button
              type="button"
              onClick={() => setMinimized((value) => !value)}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-zinc-400
                transition
                hover:bg-zinc-800
                hover:text-white
              "
            >
              {minimized ? "+" : "−"}
            </button>

            {/* CLOSE */}

            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                text-zinc-400
                transition
                hover:bg-red-500/10
                hover:text-red-400
              "
            >
              ×
            </button>
          </div>
        </div>

        {/* CONTENT */}

        {!minimized && children}
      </section>
    </Draggable>
  );
}
