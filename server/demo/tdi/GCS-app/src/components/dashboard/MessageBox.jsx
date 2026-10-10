import { useTelemetryStore } from "@/store/telemetryStore";
import React, { useEffect, useRef } from "react";

const MessageBox = () => {
  //  Extract log history from the safe Zustand store slice
  const messageList = useTelemetryStore((s) => s.statusLogs) ?? [];
  const containerRef = useRef(null);

  // Present newest entries at the bottom while keeping scroll tracking logical
  const reversedMessageList = [...messageList].reverse();

  // Pin view to bottom container edge automatically as new rows append
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = -containerRef.current.scrollHeight;
    }
  }, [messageList.length]);

  //  Map MAVLink uint8_t values (0-7) to terminal design schemes
  const getSeverityStyle = (severity) => {
    const sevNum = Number(severity);

    // 0: Emergency, 1: Alert, 2: Critical, 3: Error
    if (sevNum <= 3) {
      return {
        bg: "bg-red-500/10 border-red-500/20",
        text: "text-red-400",
        badge: "bg-red-500 text-white",
        label: "ERROR",
      };
    }
    // 4: Warning (e.g. low battery triggers)
    if (sevNum === 4) {
      return {
        bg: "bg-amber-500/10 border-amber-500/20",
        text: "text-amber-400",
        badge: "bg-amber-500 text-black",
        label: "WARN",
      };
    }
    // 5: Notice, 6: Info, 7: Debug (Normal runtime logs)
    return {
      bg: "bg-zinc-800/20 border-zinc-800/40",
      text: "text-zinc-300",
      badge: "bg-zinc-700 text-zinc-300",
      label: "INFO",
    };
  };

  return (
    <div className="flex flex-col h-[400px] w-full bg-zinc-950 rounded-xl border border-zinc-800 font-mono shadow-inner overflow-hidden">
      {/* TERMINAL HEADER */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">
            System Status Logs
          </span>
        </div>
        <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
          {messageList.length} msgs
        </span>
      </div>

      {/* TERMINAL BODY / SCROLL AREA */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent scroll-smooth"
      >
        {reversedMessageList.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic">
            Awaiting data stream...
          </div>
        ) : (
          reversedMessageList.map((m, index) => {
            const styles = getSeverityStyle(m.severity);
            const timeString = m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString([], { hour12: false })
              : "--:--:--";

            return (
              <div
                key={m.id || `msg-${index}-${m.timestamp}`}
                className={`flex flex-col gap-1 p-2 rounded border text-xs leading-relaxed transition-all duration-200 hover:bg-zinc-900/60 ${styles.bg}`}
              >
                {/* META BAR */}
                <div className="flex items-center justify-between text-[10px] select-none opacity-80">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`px-1 rounded font-black text-[9px] ${styles.badge}`}
                    >
                      {styles.label}
                    </span>
                    <span className="text-zinc-500">{timeString}</span>
                  </div>
                </div>

                {/* TEXT CONTENT */}
                <p
                  className={`break-words font-medium tracking-wide ${styles.text}`}
                >
                  {m.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MessageBox;
