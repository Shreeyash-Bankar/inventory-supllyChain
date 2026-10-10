// import React, { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const CompassMotCalibrationGraph = () => {
//   const [currentAmps, setCurrentAmps] = useState(0);
//   const [interference, setInterference] = useState(0);
//   const [throttle, setThrottle] = useState(0);
//   const [chartData, setChartData] = useState([]);

//   useEffect(() => {
//     if (!window.electron || !window.electron.onCompassMotStatus) return;

//     const unsubscribe = window.electron.onCompassMotStatus((data) => {
//       switch (data.state) {
//         // FIXED: Clear the historical chart paths instantly when a new session boots up
//         case "STARTING":
//           setChartData([]);
//           setCurrentAmps(0);
//           setInterference(0);
//           setThrottle(0);
//           break;

//         case "ComMotCalTel": {
//           const targetThrottle =
//             data.throttle !== undefined ? data.throttle : 0;

//           setCurrentAmps(data.current);
//           setInterference(data.interference);
//           setThrottle(targetThrottle);

//           setChartData((prevData) => {
//             const newPoint = {
//               throttle: targetThrottle,
//               current: Number(data.current.toFixed(1)),
//               interference: data.interference,
//             };

//             const existingIndex = prevData.findIndex(
//               (item) => item.throttle === newPoint.throttle,
//             );
//             let updatedData = [...prevData];

//             if (existingIndex !== -1) {
//               updatedData[existingIndex] = newPoint;
//             } else {
//               updatedData.push(newPoint);
//             }

//             return updatedData.sort((a, b) => a.throttle - b.throttle);
//           });
//           break;
//         }
//         default:
//           break;
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   return (
//     <div className="w-full h-full min-h-0 flex flex-col bg-slate-950 text-slate-100 font-mono">
//       {/* Metrics Header Gauges */}
//       <div className="grid grid-cols-3 gap-4 mb-6">
//         <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
//           <div className="text-xs text-slate-400 uppercase font-semibold">
//             Throttle
//           </div>
//           <div className="text-3xl font-bold mt-1 text-sky-400">
//             {throttle}
//             <span className="text-sm text-slate-400 ml-1">%</span>
//           </div>
//         </div>
//         <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
//           <div className="text-xs text-slate-400 uppercase font-semibold">
//             Current Draw
//           </div>
//           <div className="text-3xl font-bold mt-1 text-amber-500">
//             {currentAmps.toFixed(1)}
//             <span className="text-sm text-slate-400 ml-1">A</span>
//           </div>
//         </div>
//         <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
//           <div className="text-xs text-slate-400 uppercase font-semibold">
//             Interference
//           </div>
//           <div className="text-3xl font-bold mt-1 text-emerald-400">
//             {interference}
//             <span className="text-sm text-slate-400 ml-1">%</span>
//           </div>
//         </div>
//       </div>

//       {/* RECHARTS PLOTTING ELEMENT */}
//       <div className="flex-1 min-h-0 w-full bg-slate-900 p-4 rounded-lg border border-slate-800">
//         <ResponsiveContainer width="100%" height="100%">
//           <LineChart
//             data={chartData}
//             margin={{ top: 5, right: -10, left: -10, bottom: 0 }}
//           >
//             <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

//             <XAxis
//               dataKey="throttle"
//               type="number"
//               domain={[0, 100]}
//               stroke="#64748B"
//               unit="%"
//             />

//             <YAxis
//               yAxisId="left"
//               dataKey="interference"
//               type="number"
//               domain={[0, 100]}
//               stroke="#10B981"
//               unit="%"
//             />

//             <YAxis
//               yAxisId="right"
//               orientation="right"
//               dataKey="current"
//               type="number"
//               domain={[0, "dataMax + 5"]}
//               stroke="#F59E0B"
//               unit="A"
//             />

//             <Tooltip
//               contentStyle={{
//                 backgroundColor: "#1E293B",
//                 borderColor: "#475569",
//               }}
//             />

//             <Line
//               yAxisId="left"
//               type="monotone"
//               dataKey="interference"
//               stroke="#10B981"
//               strokeWidth={3}
//               dot={{ r: 2, fill: "#34D399" }}
//               isAnimationActive={false}
//             />

//             <Line
//               yAxisId="right"
//               type="monotone"
//               dataKey="current"
//               stroke="#F59E0B"
//               strokeWidth={3}
//               dot={{ r: 2, fill: "#FBBF24" }}
//               isAnimationActive={false}
//             />
//           </LineChart>
//         </ResponsiveContainer>
//       </div>
//     </div>
//   );
// };

// export default CompassMotCalibrationGraph;

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CompassMotCalibrationGraph = () => {
  const [currentAmps, setCurrentAmps] = useState(0);
  const [interference, setInterference] = useState(0);
  const [throttle, setThrottle] = useState(0);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (!window.electron || !window.electron.onCompassMotStatus) return;

    const unsubscribe = window.electron.onCompassMotStatus((data) => {
      switch (data.state) {
        case "STARTING":
          setChartData([]);
          setCurrentAmps(0);
          setInterference(0);
          setThrottle(0);
          break;

        case "ComMotCalTel": {
          const targetThrottle =
            data.throttle !== undefined ? data.throttle : 0;
          console.log("This is the data.throttle object :", data.throttle);

          setCurrentAmps(data.current);
          setInterference(data.interference);
          setThrottle(targetThrottle);

          setChartData((prevData) => {
            const newPoint = {
              throttle: targetThrottle,
              current: Number(data.current.toFixed(1)),
              interference: data.interference,
            };

            const existingIndex = prevData.findIndex(
              (item) => item.throttle === newPoint.throttle,
            );

            let updatedData = [...prevData];

            if (existingIndex !== -1) {
              updatedData[existingIndex] = newPoint;
            } else {
              updatedData.push(newPoint);
            }

            return updatedData.sort((a, b) => a.throttle - b.throttle);
          });

          break;
        }

        default:
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-slate-950 text-slate-100 font-mono">
      {/* Current Values */}
      <div className="grid grid-cols-3 gap-4 mb-4 shrink-0">
        {/* Throttle */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">
            Throttle
          </div>

          <div className="text-3xl font-bold mt-1 text-sky-400">
            {throttle}
            <span className="text-sm text-slate-400 ml-1">%</span>
          </div>
        </div>

        {/* Current */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">
            Current
          </div>

          <div className="text-3xl font-bold mt-1 text-amber-500">
            {currentAmps.toFixed(1)}
            <span className="text-sm text-slate-400 ml-1">A</span>
          </div>
        </div>

        {/* Interference */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 uppercase font-semibold">
            Interference
          </div>

          <div className="text-3xl font-bold mt-1 text-emerald-400">
            {interference}
            <span className="text-sm text-slate-400 ml-1">%</span>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-0 w-full bg-slate-900 p-4 rounded-lg border border-slate-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 45,
              left: 45,
              bottom: 35,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            {/* =========================
                X AXIS
                Throttle (%)
               ========================= */}
            <XAxis
              dataKey="throttle"
              type="number"
              domain={[0, 100]}
              stroke="#64748B"
              unit="%"
              label={{
                value: "Throttle (%)",
                position: "insideBottom",
                offset: -20,
                fill: "#94A3B8",
              }}
            />

            {/* =========================
                LEFT Y AXIS
                Interference (%)
               ========================= */}
            <YAxis
              yAxisId="left"
              dataKey="interference"
              type="number"
              domain={[0, 100]}
              stroke="#10B981"
              unit="%"
              label={{
                value: "Interference (%)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "#10B981",
              }}
            />

            {/* =========================
                RIGHT Y AXIS
                Current (A)
               ========================= */}
            <YAxis
              yAxisId="right"
              orientation="right"
              dataKey="current"
              type="number"
              domain={[0, "dataMax + 5"]}
              stroke="#F59E0B"
              unit="A"
              label={{
                value: "Current (A)",
                angle: 90,
                position: "insideRight",
                offset: 10,
                fill: "#F59E0B",
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                borderColor: "#475569",
              }}
              labelFormatter={(value) => `Throttle: ${value}%`}
              formatter={(value, name) => {
                if (name === "interference") {
                  return [`${value}%`, "Interference"];
                }

                if (name === "current") {
                  return [`${value} A`, "Current"];
                }

                return [value, name];
              }}
            />

            {/* Interference line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="interference"
              name="Interference"
              stroke="#10B981"
              strokeWidth={3}
              dot={{
                r: 2,
                fill: "#34D399",
              }}
              isAnimationActive={false}
            />

            {/* Current line */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="current"
              name="Current"
              stroke="#F59E0B"
              strokeWidth={3}
              dot={{
                r: 2,
                fill: "#FBBF24",
              }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompassMotCalibrationGraph;
