// // import React from "react";

// // const CompassMotorCalibration = () => {
// //   return <div>CompassMotorCalibration</div>;
// // };

// // export default CompassMotorCalibration;

// import CompassMotCalibrationGraph from "@/components/calibration/CompassMotCalibrationGraph";
// import { point } from "leaflet";

// import React, { useState, useEffect, useRef } from "react";

// const CompassMotorCalibration = () => {
//   const [calibrationState, setCalibrationState] = useState("IDLE"); // IDLE, STARTING, ACCEPTED, RUNNING, COMPLETE, FAILED
//   const [statusLog, setStatusLog] = useState([]);
//   const [currentAmps, setCurrentAmps] = useState(0);
//   const [interference, setInterference] = useState(0);
//   // const [throttle, setThrottle] = useState(0);
//   const [compensationX, setCompensationX] = useState(0);
//   const [compensationY, setCompensationY] = useState(0);
//   const [compensationZ, setCompensationZ] = useState(0);

//   const logEndRef = useRef(null);

//   useEffect(() => {
//     if (logEndRef.current) {
//       logEndRef.current.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [statusLog]);

//   useEffect(() => {
//     if (!window.electron || !window.electron.onCompassMotStatus) {
//       console.warn(
//         " IPC channel 'onCompassMotStatus' not found. Ensure preload script is active.",
//       );
//       return;
//     }

//     // Subscribe to backend status updates emitted from TelemetryEngine / CalibrationService
//     const unsubscribe = window.electron.onCompassMotStatus((data) => {
//       switch (data.state) {
//         case "STARTING":
//           setCalibrationState("STARTING");
//           setCurrentAmps(0);
//           setInterference(0);
//           setStatusLog(["[SYSTEM]: Initializing CompassMot Sequence..."]);
//           break;

//         case "ACCEPTED":
//           setCalibrationState("ACCEPTED");
//           setStatusLog((prev) => [
//             ...prev,
//             " Command Accepted by Flight Controller. Secure vehicle and safely raise throttle.",
//           ]);
//           break;

//         case "MESSAGE":
//           setCalibrationState("RUNNING");
//           setStatusLog((prev) => [...prev, ` FC: ${data.text}`]);
//           break;

//         // case "CURRENT":
//         //   setCurrentAmps(data.current);
//         //   break;

//         // case "INTERFERENCE":
//         //   setInterference(data.percent);
//         //   break;

//         case "ComMotCalTel":
//           setCurrentAmps(data.current);
//           setInterference(data.interference);
//           setThrottle(data.throttle);
//           setCompensationX(data.compensationX);
//           setCompensationY(data.compensationY);
//           setCompensationZ(data.compensationZ);
//           break;

//         case "COMPLETE":
//           setCalibrationState("COMPLETE");
//           setInterference(data.interference);
//           setCompensationX(data.compensationX);
//           setCompensationY(data.compensationY);
//           setCompensationZ(data.compensationZ);
//           setCurrentAmps(data.current);
//           setStatusLog((prev) => [
//             ...prev,
//             ` CALIBRATION SUCCESSFUL! Final Interference: ${data.interference}%, Max Current: ${data.current}A.`,
//           ]);

//           break;

//         case "FAILED":
//           setCalibrationState("FAILED");
//           setStatusLog((prev) => [
//             ...prev,
//             " CALIBRATION FAILED. Check motor connections or throttle range parameters.",
//           ]);
//           break;

//         default:
//           break;
//       }
//     });

//     // Clean up MAVLink IPC event listener on component unmount to prevent memory leaks
//     return () => unsubscribe();
//   }, []);

//   const handleStartCalibration = () => {
//     if (window.electron && window.electron.startCompassMotCalibration) {
//       window.electron.startCompassMotCalibration();
//     } else {
//       console.error(
//         " Preload execution function 'startCompassMotCalibration' is missing.",
//       );
//     }
//   };

//   const handleStopCalibration = () => {
//     if (window.electron && window.electron.stopCompassMot) {
//       window.electron.stopCompassMot();
//     } else {
//       console.error(" Preload execution fucntion 'stopCompassMot' is missing");
//     }
//   };

//   // const handleThrottleChange = (e) => {
//   //   // const value = Number(e.target.value);
//   //   const value = Number(e.target.value);
//   //   setThrottle(value);
//   //   window.electron.setThrottle(value);
//   //   // console.log("current value of throttle: ", value);
//   //   // console.log("current value of throttleState: ", throttle);
//   // };

//   const getFeedbackColor = (pct) => {
//     if (pct <= 10) return "#10B981"; // Green (Excellent)
//     if (pct <= 30) return "#F59E0B"; // Yellow (Acceptable, minor interference)
//     return "#EF4444"; // Red (Critical, relocate hardware compass)
//   };

//   // Determine helper message strings based on test status
//   const getBannerText = () => {
//     switch (calibrationState) {
//       case "STARTING":
//         return "Contacting Flight Controller...";
//       case "ACCEPTED":
//         return "Ready. Safely raise throttle to max and lower it.";
//       case "RUNNING":
//         return "Calibrating. Reading real-time electromagnetic offsets...";
//       case "COMPLETE":
//         return "Calibration complete! Parameters burned to EEPROM.";
//       case "FAILED":
//         return "Test failed or canceled by autopilot safety systems.";
//       default:
//         return "Ready to begin ground test hardware routine.";
//     }
//   };

//   const isButtonsDisabled =
//     calibrationState === "STARTING" ||
//     calibrationState === "RUNNING" ||
//     calibrationState === "ACCEPTED";

//   // return (

//   //   <div style={styles.container}>
//   //     {/* Module Title Context */}
//   //     <div style={styles.header}>
//   //       <h2 style={styles.title}> Compass/Motor Calibration (CompassMot)</h2>
//   //       <p style={styles.subtitle}>
//   //         Calibrate the magnetometer against power line magnetic field
//   //         distortions.
//   //       </p>
//   //     </div>

//   //     {/* Main Telemetry Tele-Gauges Dashboard */}
//   //     <div style={styles.dashboard}>
//   //       <div style={styles.metricsContainer}>
//   //         <div style={styles.card}>
//   //           <span style={styles.cardLabel}> Current Draw</span>
//   //           <div style={styles.cardValue}>
//   //             {currentAmps.toFixed(1)} <span style={styles.unit}>A</span>
//   //           </div>
//   //         </div>

//   //         <div style={styles.card}>
//   //           <span style={styles.cardLabel}> Magnetic Interference</span>
//   //           <div
//   //             style={{
//   //               ...styles.cardValue,
//   //               color: getFeedbackColor(interference),
//   //             }}
//   //           >
//   //             {interference}
//   //             <span style={styles.unit}>%</span>
//   //           </div>
//   //         </div>
//   //       </div>

//   //       {/* Dynamic Context Status Banner */}
//   //       <div
//   //         style={{ ...styles.stateBanner, ...bannerColors[calibrationState] }}
//   //       >
//   //         <strong>[{calibrationState}]</strong> {getBannerText()}
//   //       </div>

//   //       {/* Action Ignition Button Trigger */}
//   //       <button
//   //         onClick={handleStartCalibration}
//   //         disabled={isButtonsDisabled}
//   //         style={{
//   //           ...styles.button,
//   //           backgroundColor: isButtonsDisabled ? "#4B5563" : "#2563EB",
//   //           cursor: isButtonsDisabled ? "not-allowed" : "pointer",
//   //         }}
//   //       >
//   //         {calibrationState === "RUNNING"
//   //           ? "Processing MAVLink Data streams..."
//   //           : "Start Calibration Sequence"}
//   //       </button>
//   //       <button
//   //         onClick={handleStopCalibration}
//   //         style={{
//   //           ...styles.button,
//   //           backgroundColor: "#DC2626",
//   //         }}
//   //       >
//   //         Stop Calibration
//   //       </button>
//   //     </div>

//   //     {/* Real-Time Telemetry Event Logger Terminal */}
//   //     <div style={styles.logContainer}>
//   //       <h4 style={styles.logTitle}>
//   //         Live Telemetry Logs (STATUSTEXT Decodes)
//   //       </h4>
//   //       <div style={styles.logBox}>
//   //         {statusLog.length === 0 && (
//   //           <span style={styles.emptyLog}>
//   //             Awaiting ground control initialization...
//   //           </span>
//   //         )}
//   //         {statusLog.map((log, index) => (
//   //           <div key={index} style={styles.logLine}>
//   //             {log}
//   //           </div>
//   //         ))}
//   //         <div ref={logEndRef} />
//   //       </div>
//   //     </div>

//   //     {/* <div className="mt-7 max-w rounded-xl border border-slate-500 bg-slate-950 p-4 shadow-sm">
//   //       <div className="flex items-center justify-between pb-2">
//   //         <label className="text-sm font-medium text-slate-400">
//   //           Motor Throttle
//   //         </label>
//   //         <span className="rounded-md bg-slate-500 px-2 py-0.5 text-xs font-semibold text-slate-200">
//   //           {throttle}%
//   //         </span>
//   //       </div>
//   //       <input
//   //         type="range"
//   //         min={0}
//   //         max={100}
//   //         value={throttle}
//   //         onChange={handleThrottleChange}
//   //         className="w-full cursor-pointer h-2 accent-blue-600 bg-slate-200 rounded-lg"
//   //       />
//   //     </div> */}

//   //     <div>
//   //       <CompassMotCalibrationGraph />
//   //     </div>

//   //     <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
//   //       <div className="mb-3 flex items-center justify-between">
//   //         <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
//   //           Vector Compensation (mG)
//   //         </h4>
//   //         <span className="text-[10px] font-mono rounded bg-slate-800 px-1.5 py-0.5 text-slate-500">
//   //           Real-time Offsets
//   //         </span>
//   //       </div>

//   //       <div className="grid grid-cols-3 gap-3">
//   //         {/* X Axis */}
//   //         <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950 px-3 py-2">
//   //           <span className="font-mono text-xs font-black text-red-500">X</span>
//   //           <span className="font-mono text-sm font-semibold tracking-tight text-slate-200">
//   //             {compensationX}
//   //           </span>
//   //         </div>

//   //         {/* Y Axis */}
//   //         <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950 px-3 py-2">
//   //           <span className="font-mono text-xs font-black text-emerald-500">
//   //             Y
//   //           </span>
//   //           <span className="font-mono text-sm font-semibold tracking-tight text-slate-200">
//   //             {compensationY}
//   //           </span>
//   //         </div>

//   //         {/* Z Axis */}
//   //         <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950 px-3 py-2">
//   //           <span className="font-mono text-xs font-black text-blue-500">
//   //             Z
//   //           </span>
//   //           <span className="font-mono text-sm font-semibold tracking-tight text-slate-200">
//   //             {compensationZ}
//   //           </span>
//   //         </div>
//   //       </div>
//   //     </div>
//   //   </div>
//   // );

//   return (
//     <div className="w-full h-screen min-h-0 overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col">
//       {/* ============================================================
//         HEADER
//     ============================================================ */}
//       <header className="h-[68px] shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
//         <div>
//           <h2 className="text-lg xl:text-xl font-semibold tracking-tight text-slate-100">
//             Compass/Motor Calibration
//           </h2>

//           <p className="mt-1 text-xs text-slate-500">
//             Calibrate the magnetometer against power line magnetic field
//             distortions.
//           </p>
//         </div>

//         {/* Current state */}
//         <div
//           className={`
//           flex items-center gap-2
//           rounded-md border px-3 py-1.5
//           text-[10px] font-bold tracking-wider
//           ${
//             calibrationState === "RUNNING"
//               ? "border-amber-800 bg-amber-950/40 text-amber-400"
//               : calibrationState === "COMPLETE"
//                 ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
//                 : calibrationState === "FAILED"
//                   ? "border-red-800 bg-red-950/40 text-red-400"
//                   : calibrationState === "ACCEPTED"
//                     ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
//                     : "border-slate-700 bg-slate-900 text-slate-400"
//           }
//         `}
//         >
//           <span
//             className={`
//             h-2 w-2 rounded-full
//             ${
//               calibrationState === "RUNNING"
//                 ? "bg-amber-400 animate-pulse"
//                 : calibrationState === "COMPLETE"
//                   ? "bg-emerald-400"
//                   : calibrationState === "FAILED"
//                     ? "bg-red-400"
//                     : "bg-slate-500"
//             }
//           `}
//           />

//           {calibrationState}
//         </div>
//       </header>

//       {/* ============================================================
//         MAIN DASHBOARD
//     ============================================================ */}
//       <main className="flex-1 min-h-0 grid grid-cols-[380px_minmax(0,1fr)] gap-4 p-4">
//         {/* ==========================================================
//           LEFT CONTROL PANEL
//       ========================================================== */}
//         <aside className="min-h-0 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
//           {/* ========================================================
//             LIVE TELEMETRY
//         ======================================================== */}
//           <section>
//             <div className="mb-2 flex items-center justify-between">
//               <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
//                 Live Telemetry
//               </h3>

//               <span className="text-[9px] font-mono text-slate-600">
//                 REAL-TIME
//               </span>
//             </div>

//             <div className="grid grid-cols-2 gap-3">
//               {/* CURRENT */}
//               <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
//                 <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
//                   Current Draw
//                 </div>

//                 <div className="mt-3 flex items-baseline gap-1.5">
//                   <span className="text-3xl xl:text-4xl font-bold tabular-nums text-slate-100">
//                     {currentAmps.toFixed(1)}
//                   </span>

//                   <span className="text-xs text-slate-500">A</span>
//                 </div>
//               </div>

//               {/* INTERFERENCE */}
//               <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
//                 <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
//                   Interference
//                 </div>

//                 <div className="mt-3 flex items-baseline gap-1.5">
//                   <span
//                     className="text-3xl xl:text-4xl font-bold tabular-nums"
//                     style={{
//                       color: getFeedbackColor(interference),
//                     }}
//                   >
//                     {interference}
//                   </span>

//                   <span className="text-xs text-slate-500">%</span>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* ========================================================
//             CALIBRATION STATUS
//         ======================================================== */}
//           <section>
//             <div className="mb-2">
//               <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
//                 Calibration Status
//               </h3>
//             </div>

//             <div
//               className={`
//               rounded-lg border px-4 py-3
//               text-xs leading-relaxed
//               ${
//                 calibrationState === "STARTING"
//                   ? "border-blue-800 bg-blue-950/40 text-blue-300"
//                   : calibrationState === "ACCEPTED"
//                     ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
//                     : calibrationState === "RUNNING"
//                       ? "border-amber-800 bg-amber-950/40 text-amber-300"
//                       : calibrationState === "COMPLETE"
//                         ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
//                         : calibrationState === "FAILED"
//                           ? "border-red-800 bg-red-950/40 text-red-300"
//                           : "border-slate-700 bg-slate-900 text-slate-400"
//               }
//             `}
//             >
//               <div className="flex items-start gap-2">
//                 <span className="font-bold shrink-0">[{calibrationState}]</span>

//                 <span>{getBannerText()}</span>
//               </div>
//             </div>
//           </section>

//           {/* ========================================================
//             ACTION BUTTONS
//         ======================================================== */}
//           <section className="grid grid-cols-2 gap-3">
//             <button
//               onClick={handleStartCalibration}
//               disabled={isButtonsDisabled}
//               className={`
//               h-11 rounded-lg
//               text-xs font-semibold
//               transition-all duration-150
//               ${
//                 isButtonsDisabled
//                   ? "cursor-not-allowed bg-slate-800 text-slate-500"
//                   : "cursor-pointer bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700"
//               }
//             `}
//             >
//               {calibrationState === "RUNNING"
//                 ? "Processing..."
//                 : "Start Calibration"}
//             </button>

//             <button
//               onClick={handleStopCalibration}
//               className="
//               h-11 rounded-lg
//               border border-red-900
//               bg-red-950/50
//               text-xs font-semibold text-red-400
//               transition-all duration-150
//               hover:bg-red-900/60
//               hover:text-red-300
//               active:bg-red-900
//             "
//             >
//               Stop Calibration
//             </button>
//           </section>

//           {/* ========================================================
//             TELEMETRY LOG
//         ======================================================== */}
//           <section>
//             <div className="mb-2 flex items-center justify-between">
//               <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
//                 Live Telemetry Logs
//               </h3>

//               <span className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 font-mono text-[8px] text-slate-600">
//                 STATUSTEXT
//               </span>
//             </div>

//             <div className="h-[150px] overflow-y-auto rounded-lg border border-slate-800 bg-black/30 p-3 font-mono text-[10px] leading-relaxed">
//               {statusLog.length === 0 && (
//                 <span className="italic text-slate-700">
//                   Awaiting ground control initialization...
//                 </span>
//               )}

//               {statusLog.map((log, index) => (
//                 <div
//                   key={index}
//                   className="mb-1 border-l-2 border-emerald-600 pl-2 text-emerald-400 break-words"
//                 >
//                   {log}
//                 </div>
//               ))}

//               <div ref={logEndRef} />
//             </div>
//           </section>

//           {/* ========================================================
//             VECTOR COMPENSATION
//         ======================================================== */}
//           <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
//             <div className="mb-3 flex items-center justify-between">
//               <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
//                 Vector Compensation
//               </h3>

//               <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] text-slate-500">
//                 mG
//               </span>
//             </div>

//             <div className="grid grid-cols-3 gap-2">
//               {/* X */}
//               <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
//                 <span className="font-mono text-xs font-black text-red-500">
//                   X
//                 </span>

//                 <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
//                   {compensationX}
//                 </span>
//               </div>

//               {/* Y */}
//               <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
//                 <span className="font-mono text-xs font-black text-emerald-500">
//                   Y
//                 </span>

//                 <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
//                   {compensationY}
//                 </span>
//               </div>

//               {/* Z */}
//               <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
//                 <span className="font-mono text-xs font-black text-blue-500">
//                   Z
//                 </span>

//                 <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
//                   {compensationZ}
//                 </span>
//               </div>
//             </div>
//           </section>
//         </aside>

//         {/* ==========================================================
//           RIGHT GRAPH
//       ========================================================== */}
//         <section className="min-w-0 min-h-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
//           {/* Graph header */}
//           <div className="h-[58px] shrink-0 border-b border-slate-800 px-5 flex items-center justify-between">
//             <div>
//               <h2 className="text-sm xl:text-base font-semibold text-slate-200">
//                 Calibration Curve
//               </h2>

//               <p className="mt-0.5 text-[10px] text-slate-500">
//                 Throttle vs current draw and magnetic interference
//               </p>
//             </div>

//             <div className="flex items-center gap-5">
//               <div className="flex items-center gap-2">
//                 <span className="h-2 w-2 rounded-full bg-emerald-400" />

//                 <span className="text-[10px] text-slate-400">Interference</span>
//               </div>

//               <div className="flex items-center gap-2">
//                 <span className="h-2 w-2 rounded-full bg-amber-500" />

//                 <span className="text-[10px] text-slate-400">Current</span>
//               </div>
//             </div>
//           </div>

//           {/* Graph itself */}
//           <div className="h-[calc(100%-58px)] min-h-0 w-full p-3">
//             <div className="h-full w-full">
//               <CompassMotCalibrationGraph />
//             </div>
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// };

// // Ground Control Station Dark Theme CSS Styles
// const styles = {
//   container: {
//     padding: "24px",
//     backgroundColor: "#111827",
//     color: "#F9FAFB",
//     fontFamily: "Segoe UI, Roboto, Helvetica, sans-serif",
//     borderRadius: "12px",
//     maxWidth: "600px",
//     margin: "20px auto",
//     boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
//   },
//   header: {
//     borderBottom: "1px solid #374151",
//     paddingBottom: "14px",
//     marginBottom: "20px",
//   },
//   title: {
//     margin: "0 0 6px 0",
//     fontSize: "20px",
//     fontWeight: "600",
//     color: "#F3F4F6",
//   },
//   subtitle: {
//     margin: "0",
//     color: "#9CA3AF",
//     fontSize: "13px",
//     lineHeight: "1.4",
//   },
//   dashboard: { display: "flex", flexDirection: "column", gap: "16px" },
//   metricsContainer: { display: "flex", gap: "16px" },
//   card: {
//     flex: 1,
//     backgroundColor: "#1F2937",
//     padding: "16px",
//     borderRadius: "8px",
//     border: "1px solid #374151",
//   },
//   cardLabel: {
//     display: "block",
//     color: "#9CA3AF",
//     fontSize: "11px",
//     fontWeight: "600",
//     textTransform: "uppercase",
//     letterSpacing: "0.05em",
//     marginBottom: "8px",
//   },
//   cardValue: { fontSize: "36px", fontWeight: "700", color: "#F9FAFB" },
//   unit: {
//     fontSize: "16px",
//     fontWeight: "500",
//     color: "#9CA3AF",
//     marginLeft: "2px",
//   },
//   stateBanner: {
//     padding: "12px",
//     borderRadius: "6px",
//     fontSize: "13px",
//     textAlign: "left",
//     display: "block",
//     transition: "all 0.3s ease",
//   },
//   button: {
//     width: "100%",
//     padding: "14px",
//     color: "#FFFFFF",
//     border: "none",
//     borderRadius: "6px",
//     fontWeight: "600",
//     fontSize: "14px",
//     transition: "background-color 0.2s ease",
//   },
//   logContainer: { marginTop: "24px" },
//   logTitle: {
//     margin: "0 0 8px 0",
//     fontSize: "13px",
//     fontWeight: "600",
//     color: "#9CA3AF",
//   },
//   logBox: {
//     backgroundColor: "#030712",
//     padding: "12px",
//     borderRadius: "6px",
//     height: "150px",
//     overflowY: "auto",
//     border: "1px solid #1F2937",
//     fontFamily: "Consolas, Monaco, monospace",
//     fontSize: "12px",
//     lineHeight: "1.6",
//   },
//   emptyLog: { color: "#4B5563", fontStyle: "italic" },
//   logLine: {
//     marginBottom: "4px",
//     color: "#34D399",
//     borderLeft: "2px solid #10B981",
//     paddingLeft: "6px",
//   },
// };

// const bannerColors = {
//   IDLE: {
//     backgroundColor: "#374151",
//     color: "#F3F4F6",
//     border: "1px solid #4B5563",
//   },
//   STARTING: {
//     backgroundColor: "#1E3A8A",
//     color: "#93C5FD",
//     border: "1px solid #2563EB",
//   },
//   ACCEPTED: {
//     backgroundColor: "#065F46",
//     color: "#A7F3D0",
//     border: "1px solid #059669",
//   },
//   RUNNING: {
//     backgroundColor: "#78350F",
//     color: "#FDE68A",
//     border: "1px solid #D97706",
//   },
//   COMPLETE: {
//     backgroundColor: "#065F46",
//     color: "#A7F3D0",
//     border: "2px solid #10B981",
//   },
//   FAILED: {
//     backgroundColor: "#7F1D1D",
//     color: "#FCA5A5",
//     border: "2px solid #EF4444",
//   },
// };

// export default CompassMotorCalibration;

import CompassMotCalibrationGraph from "@/components/calibration/CompassMotCalibrationGraph";
import React, { useState, useEffect, useRef } from "react";

const CompassMotorCalibration = () => {
  const [calibrationState, setCalibrationState] = useState("IDLE");
  const [statusLog, setStatusLog] = useState([]);
  const [currentAmps, setCurrentAmps] = useState(0);
  const [interference, setInterference] = useState(0);
  const [throttle, setThrottle] = useState(0);

  const [compensationX, setCompensationX] = useState(0);
  const [compensationY, setCompensationY] = useState(0);
  const [compensationZ, setCompensationZ] = useState(0);

  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [statusLog]);

  useEffect(() => {
    if (!window.electron || !window.electron.onCompassMotStatus) {
      console.warn(
        "IPC channel 'onCompassMotStatus' not found. Ensure preload script is active.",
      );
      return;
    }

    const unsubscribe = window.electron.onCompassMotStatus((data) => {
      switch (data.state) {
        case "STARTING":
          setCalibrationState("STARTING");
          setCurrentAmps(0);
          setInterference(0);
          setThrottle(0);

          setCompensationX(0);
          setCompensationY(0);
          setCompensationZ(0);

          setStatusLog(["[SYSTEM]: Initializing CompassMot Sequence..."]);
          break;

        case "ACCEPTED":
          setCalibrationState("ACCEPTED");

          setStatusLog((prev) => [
            ...prev,
            "Command Accepted by Flight Controller. Secure vehicle and safely raise throttle.",
          ]);
          break;

        case "MESSAGE":
          setCalibrationState("RUNNING");

          setStatusLog((prev) => [...prev, `FC: ${data.text}`]);
          break;

        case "ComMotCalTel":
          setCalibrationState("RUNNING");

          setCurrentAmps(Number(data.current) || 0);
          setInterference(Number(data.interference) || 0);
          setThrottle(Number(data.throttle) || 0);
          console.log("This is the data.throttle object :", data.throttle);
          console.log("this is data : ", data);

          setCompensationX(Number(data.compensationX) || 0);
          setCompensationY(Number(data.compensationY) || 0);
          setCompensationZ(Number(data.compensationZ) || 0);

          break;

        case "COMPLETE":
          setCalibrationState("COMPLETE");

          setInterference(Number(data.interference) || 0);
          setCompensationX(Number(data.compensationX) || 0);
          setCompensationY(Number(data.compensationY) || 0);
          setCompensationZ(Number(data.compensationZ) || 0);
          setCurrentAmps(Number(data.current) || 0);
          setThrottle(Number(data.throttle) || 0);
          console.log("This is the data.throttle object :", data.throttle);

          setStatusLog((prev) => [
            ...prev,
            `CALIBRATION SUCCESSFUL! Final Interference: ${data.interference}%, Max Current: ${data.current}A.`,
          ]);

          break;

        case "FAILED":
          setCalibrationState("FAILED");

          setStatusLog((prev) => [
            ...prev,
            "CALIBRATION FAILED. Check motor connections or throttle range parameters.",
          ]);
          break;

        default:
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStartCalibration = () => {
    if (window.electron && window.electron.startCompassMotCalibration) {
      window.electron.startCompassMotCalibration();
    } else {
      console.error(
        "Preload execution function 'startCompassMotCalibration' is missing.",
      );
    }
  };

  const handleStopCalibration = () => {
    if (window.electron && window.electron.stopCompassMot) {
      window.electron.stopCompassMot();
    } else {
      console.error("Preload execution function 'stopCompassMot' is missing.");
    }
  };

  const getFeedbackColor = (pct) => {
    if (pct <= 10) return "#10B981";
    if (pct <= 30) return "#F59E0B";
    return "#EF4444";
  };

  const getBannerText = () => {
    switch (calibrationState) {
      case "STARTING":
        return "Contacting Flight Controller...";

      case "ACCEPTED":
        return "Ready. Safely raise throttle to max and lower it.";

      case "RUNNING":
        return "Calibrating. Reading real-time electromagnetic offsets...";

      case "COMPLETE":
        return "Calibration complete! Parameters burned to EEPROM.";

      case "FAILED":
        return "Test failed or canceled by autopilot safety systems.";

      default:
        return "Ready to begin ground test hardware routine.";
    }
  };

  const isButtonsDisabled =
    calibrationState === "STARTING" ||
    calibrationState === "RUNNING" ||
    calibrationState === "ACCEPTED";

  return (
    <div className="w-full h-screen min-h-0 overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className="h-[68px] shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg xl:text-xl font-semibold tracking-tight text-slate-100">
            Compass/Motor Calibration
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Calibrate the magnetometer against power line magnetic field
            distortions.
          </p>
        </div>

        {/* Current State */}

        <div
          className={`
            flex items-center gap-2
            rounded-md border px-3 py-1.5
            text-[10px] font-bold tracking-wider
            ${
              calibrationState === "RUNNING"
                ? "border-amber-800 bg-amber-950/40 text-amber-400"
                : calibrationState === "COMPLETE"
                  ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                  : calibrationState === "FAILED"
                    ? "border-red-800 bg-red-950/40 text-red-400"
                    : calibrationState === "ACCEPTED"
                      ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                      : "border-slate-700 bg-slate-900 text-slate-400"
            }
          `}
        >
          <span
            className={`
              h-2 w-2 rounded-full
              ${
                calibrationState === "RUNNING"
                  ? "bg-amber-400 animate-pulse"
                  : calibrationState === "COMPLETE"
                    ? "bg-emerald-400"
                    : calibrationState === "FAILED"
                      ? "bg-red-400"
                      : calibrationState === "ACCEPTED"
                        ? "bg-emerald-400"
                        : "bg-slate-500"
              }
            `}
          />

          {calibrationState}
        </div>
      </header>

      {/* ============================================================
          MAIN DASHBOARD
      ============================================================ */}

      <main className="flex-1 min-h-0 grid grid-cols-[35%_65%] gap-4 p-4">
        {/* ==========================================================
            LEFT SIDEBAR - 35%
        ========================================================== */}

        <aside className="min-h-0 overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* ========================================================
              LIVE TELEMETRY
          ======================================================== */}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Live Telemetry
              </h3>

              <span className="text-[9px] font-mono text-slate-600">
                REAL-TIME
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* CURRENT */}

              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Current Draw
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl xl:text-4xl font-bold tabular-nums text-slate-100">
                    {Number(currentAmps).toFixed(1)}
                  </span>

                  <span className="text-xs text-slate-500">A</span>
                </div>
              </div>

              {/* INTERFERENCE */}

              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Interference
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className="text-3xl xl:text-4xl font-bold tabular-nums"
                    style={{
                      color: getFeedbackColor(interference),
                    }}
                  >
                    {interference}
                  </span>

                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================
              THROTTLE
          ======================================================== */}

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Motor Throttle
                </h3>

                <p className="mt-1 text-[9px] text-slate-600">
                  Current motor output
                </p>
              </div>

              <div className="text-2xl font-bold tabular-nums text-sky-400">
                {throttle}
                <span className="ml-1 text-xs text-slate-500">%</span>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-950">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-150"
                style={{
                  width: `${Math.min(
                    Math.max(Number(throttle) || 0, 0),
                    100,
                  )}%`,
                }}
              />
            </div>
          </section>

          {/* ========================================================
              CALIBRATION STATUS
          ======================================================== */}

          <section>
            <div className="mb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Calibration Status
              </h3>
            </div>

            <div
              className={`
                rounded-lg border px-4 py-3
                text-xs leading-relaxed
                ${
                  calibrationState === "STARTING"
                    ? "border-blue-800 bg-blue-950/40 text-blue-300"
                    : calibrationState === "ACCEPTED"
                      ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                      : calibrationState === "RUNNING"
                        ? "border-amber-800 bg-amber-950/40 text-amber-300"
                        : calibrationState === "COMPLETE"
                          ? "border-emerald-800 bg-emerald-950/40 text-emerald-300"
                          : calibrationState === "FAILED"
                            ? "border-red-800 bg-red-950/40 text-red-300"
                            : "border-slate-700 bg-slate-900 text-slate-400"
                }
              `}
            >
              <div className="flex items-start gap-2">
                <span className="font-bold shrink-0">[{calibrationState}]</span>

                <span>{getBannerText()}</span>
              </div>
            </div>
          </section>

          {/* ========================================================
              ACTION BUTTONS
          ======================================================== */}

          <section className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStartCalibration}
              disabled={isButtonsDisabled}
              className={`
                h-11 rounded-lg
                text-xs font-semibold
                transition-all duration-150
                ${
                  isButtonsDisabled
                    ? "cursor-not-allowed bg-slate-800 text-slate-500"
                    : "cursor-pointer bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700"
                }
              `}
            >
              {calibrationState === "RUNNING"
                ? "Processing..."
                : "Start Calibration"}
            </button>

            <button
              onClick={handleStopCalibration}
              className="
                h-11 rounded-lg
                border border-red-900
                bg-red-950/50
                text-xs font-semibold text-red-400
                transition-all duration-150
                hover:bg-red-900/60
                hover:text-red-300
                active:bg-red-900
              "
            >
              Stop Calibration
            </button>
          </section>

          {/* ========================================================
              VECTOR COMPENSATION
          ======================================================== */}

          <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Vector Compensation
              </h3>

              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[8px] text-slate-500">
                mG
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* X */}

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <span className="font-mono text-xs font-black text-red-500">
                  X
                </span>

                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                  {compensationX}
                </span>
              </div>

              {/* Y */}

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <span className="font-mono text-xs font-black text-emerald-500">
                  Y
                </span>

                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                  {compensationY}
                </span>
              </div>

              {/* Z */}

              <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 px-3 py-2">
                <span className="font-mono text-xs font-black text-blue-500">
                  Z
                </span>

                <span className="font-mono text-xs font-semibold tabular-nums text-slate-300">
                  {compensationZ}
                </span>
              </div>
            </div>
          </section>

          {/* ========================================================
              SIDEBAR FILLER / SYSTEM INFO
          ======================================================== */}

          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Calibration Monitor
              </h3>

              <span className="text-[9px] font-mono text-slate-600">
                MAVLINK
              </span>
            </div>

            <div className="space-y-2 text-[10px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Connection</span>

                <span className="text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Telemetry</span>

                <span className="text-emerald-400">STREAMING</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Calibration</span>

                <span className="text-slate-400">{calibrationState}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600">Samples</span>

                <span className="text-slate-400">LIVE</span>
              </div>
            </div>
          </section>
        </aside>

        {/* ==========================================================
            RIGHT WORKSPACE - 65%
        ========================================================== */}

        <section className="min-w-0 min-h-0 grid grid-rows-[75%_25%] gap-4">
          {/* ========================================================
              GRAPH - 75%
          ======================================================== */}

          <div className="min-h-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            {/* Graph Header */}

            <div className="h-[58px] shrink-0 border-b border-slate-800 px-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm xl:text-base font-semibold text-slate-200">
                  Calibration Curve
                </h2>

                <p className="mt-0.5 text-[10px] text-slate-500">
                  Throttle vs current draw and magnetic interference
                </p>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  <span className="text-[10px] text-slate-400">
                    Interference
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />

                  <span className="text-[10px] text-slate-400">Current</span>
                </div>
              </div>
            </div>

            {/* Graph */}

            <div className="h-[calc(100%-58px)] min-h-0 w-full p-4">
              <div className="h-full w-full">
                <CompassMotCalibrationGraph />
              </div>
            </div>
          </div>

          {/* ========================================================
              CONSOLE - 25%
          ======================================================== */}

          <div className="min-h-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
            {/* Console Header */}

            <div className="h-[42px] shrink-0 border-b border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Telemetry Console
                </h3>
              </div>

              <span className="font-mono text-[9px] text-slate-600">LIVE</span>
            </div>

            {/* Console Content */}

            <div className="h-[calc(100%-42px)] overflow-y-auto p-3 font-mono text-[10px] leading-relaxed">
              {statusLog.length === 0 ? (
                <div className="flex h-full items-center justify-center text-slate-700">
                  Awaiting telemetry...
                </div>
              ) : (
                statusLog.map((log, index) => (
                  <div
                    key={index}
                    className="mb-1 border-l-2 border-emerald-600 pl-2 text-emerald-400 break-words"
                  >
                    <span className="mr-2 text-slate-600">
                      [{String(index + 1).padStart(3, "0")}]
                    </span>

                    {log}
                  </div>
                ))
              )}

              <div ref={logEndRef} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CompassMotorCalibration;
