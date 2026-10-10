import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Cpu, Radio, Settings2, Link2 } from "lucide-react"; // If you have lucide-react

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";

export default function PortSelector({ onConnected }) {
  const [ports, setPorts] = useState([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [baudRate, setBaudRate] = useState("57600");
  const [connecting, setConnecting] = useState(false);
  const [activeConnection, setActiveConnection] = useState("serial");
  const [udpPort, setUdpPort] = useState("14550");

  useEffect(() => {
    async function loadPorts() {
      const list = await window.electron.getPorts();
      setPorts(list || []);
    }
    loadPorts();
    const interval = setInterval(loadPorts, 2000);
    return () => clearInterval(interval);
  }, [selectedPort]);

  const navigate = useNavigate();

  const handleConnect = async () => {
    // if (!selectedPort) return;
    try {
      setConnecting(true);
      const payload =
        activeConnection === "serial"
          ? { type: "SERIAL", path: selectedPort, baudRate: Number(baudRate) }
          : { type: "UDP", localPort: Number(udpPort) };
      // await window.electron.connectPort({
      //   path: selectedPort,
      //   baudRate: Number(baudRate),
      // });
      await window.electron.connectPort(payload);
      navigate("/telemetry");
      onConnected?.();
    } catch (err) {
      console.error("Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950 p-6 selection:bg-emerald-500/30">
      <Card className="w-[640px] border-slate-800 bg-slate-900/50 backdrop-blur-xl shadow-2xl p-8 space-y-8 rounded-3xl">
        {/* HEADER SECTION */}
        <div className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4">
            <Radio className="text-emerald-400" size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Link Configuration
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Establish a serial MAVLink connection to your flight controller
          </p>
        </div>

        {/* CONNECTION STATUS BADGE */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="w-2 h-2   rounded-full bg-slate-700 animate-pulse" />
            <p className="text-[14px]">System Idle</p>
          </div>
        </div>

        <div>
          <div className="flex justify-around bg-gray-900 rounded-xl border-gray-600 border-2 overflow-hidden text-center">
            <div
              className={`flex-1 py-3 sm:py-4 text-center cursor-pointer transition-colors ${
                activeConnection === "serial"
                  ? "bg-gray-700 text-emerald-400 font-medium"
                  : "text-white hover:bg-gray-950"
              }`}
              onClick={() => setActiveConnection("serial")}
            >
              Serial
            </div>
            <div
              className={`flex-1 py-3 sm:py-4 text-center cursor-pointer transition-colors ${
                activeConnection === "udp"
                  ? "bg-gray-700 text-emerald-400 font-medium"
                  : "text-white hover:bg-gray-950"
              }`}
              onClick={() => setActiveConnection("udp")}
            >
              UDP
            </div>
          </div>
        </div>

        <div className="min-h-[190px] flex flex-col justify-start">
          {activeConnection === "udp" && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  <Cpu size={14} />
                  Select Port
                </div>
                <div>
                  <input
                    className="w-full text-2xl py-2 pl-6 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl  focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    type="number"
                    value={udpPort}
                    onChange={(e) => setUdpPort(e.target.value)}
                    inputMode="numeric"
                    pattern="^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$"
                    placeholder="14550"
                  ></input>
                </div>
              </div>
            </div>
          )}

          {activeConnection === "serial" && (
            <div className="space-y-6">
              {/* PORT SELECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  <Cpu size={14} />
                  Serial Interface
                </div>
                <Select value={selectedPort} onValueChange={setSelectedPort}>
                  <SelectTrigger className="w-full h-12 bg-slate-950 border-slate-800 text-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all rounded-xl">
                    <SelectValue placeholder="Detecting devices..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    {ports.length === 0 ? (
                      <SelectItem
                        value="none"
                        disabled
                        className="text-slate-500 italic"
                      >
                        No active ports found
                      </SelectItem>
                    ) : (
                      ports.map((p) => (
                        <SelectItem
                          key={p.path}
                          value={p.path}
                          className="focus:bg-emerald-500/10 focus:text-emerald-200 text-green-300"
                        >
                          <span className="font-mono text-xs mr-2 opacity-50">
                            {p.path}
                          </span>
                          <span className="font-medium">{p.name}</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* BAUD RATE SELECTION */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  <Settings2 size={14} />
                  Bit Rate (Baud)
                </div>
                <Select value={baudRate} onValueChange={setBaudRate}>
                  <SelectTrigger className="w-full h-12 bg-slate-950 border-slate-800 text-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-300">
                    {[
                      "9600",
                      "57600",
                      "115200",
                      "230400",
                      "460800",
                      "921600",
                    ].map((rate) => (
                      <SelectItem
                        key={rate}
                        value={rate}
                        className="focus:bg-emerald-400/10 focus:text-green-200 hover:text-green-300 font-mono text-green-300 "
                      >
                        {rate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* CONNECT BUTTON */}
        <Button
          className={`w-full h-14 rounded-2xl font-bold text-base transition-all duration-300 active:scale-95 shadow-lg ${
            connecting
              ? "bg-slate-800 text-slate-500"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 hover:shadow-emerald-500/20"
          }`}
          disabled={(!selectedPort && !udpPort) || connecting}
          onClick={handleConnect}
        >
          {connecting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
              Establishing Link...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link2 size={20} />
              Initialize Connection
            </div>
          )}
        </Button>

        {/* FOOTER */}
        <p className="text-[10px] text-center font-medium text-slate-500 uppercase tracking-[0.1em] pt-4">
          Hardware check required before ignition
        </p>
      </Card>
    </div>
  );
}
