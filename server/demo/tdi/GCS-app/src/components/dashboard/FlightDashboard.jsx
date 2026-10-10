import AttitudeCard from "./AttitudeCard";
import GPSCard from "./GPSCard";
import BatteryCard from "./BatteryCard";
import HeartbeatCard from "./Hearbeat";
import FlightMap from "./FlightMap";
import { useTelemetryStore } from "@/store/telemetryStore";
import AttitudeIndicator from "@/pages/AttitudeIndicator";
import { Card } from "../ui/card";
import Compass from "@/pages/Compass";
import { useState } from "react";
import SelectedTelemetryPanel from "@/pages/SelectedTelemetryPanel";
import TelemetrySelectorModal from "@/pages/TelemetrySelectorModal";
import MessageBox from "./MessageBox";
import EkfStatus from "../other/EkfStatus";
import Vibration from "../other/Vibration";

export default function FlightDashboard() {
  const attitude = useTelemetryStore((s) => s.attitude);
  const messages = useTelemetryStore((s) => s.messages); // adjust key if different
  const [selectedFields, setSelectedFields] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [showEkf, setShowEkf] = useState(false);
  const [showVibration, setShowVibration] = useState(false);

  const handleRemove = (type, key) =>
    setSelectedFields((prev) =>
      prev.filter((f) => !(f.type === type && f.key === key)),
    );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 items-start p-2 bg-sidebar-foreground">
      {/* MAIN AREA */}
      <div className="xl:col-span-3 space-y-3">
        {/* LARGE MAP */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
          {/* BIG MAP HEIGHT */}
          <div className="h-[55vh] min-h-50 w-full">
            <FlightMap
              showEkf={showEkf}
              setShowEkf={setShowEkf}
              showVibration={showVibration}
              setShowVibration={setShowVibration}
            />

            {showEkf && <EkfStatus onClose={() => setShowEkf(false)} />}

            {showVibration && (
              <Vibration onClose={() => setShowVibration(false)} />
            )}
          </div>
        </div>

        {/* SMALLER FLIGHT SYSTEMS */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40">
            <p className="text-[11px] tracking-widest text-zinc-400 uppercase">
              Flight Systems
            </p>
          </div>

          {/* SMALL CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 items-center bg-gray-800">
            <div className="scale-[0.90] origin-top">
              <AttitudeCard />
            </div>

            <div className="scale-[0.90] origin-top">
              <GPSCard />
            </div>

            <div className="scale-[0.90] origin-top">
              <BatteryCard />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl overflow-hidden p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-zinc-300">Custom Telemetry</div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-2 py-1 text-sm bg-blue-600 rounded"
              >
                Add fields
              </button>
            </div>

            <SelectedTelemetryPanel
              selectedFields={selectedFields}
              messages={messages}
              onRemove={handleRemove}
            />
          </div>

          {modalOpen && (
            <TelemetrySelectorModal
              messages={messages}
              selectedFields={selectedFields}
              onChange={setSelectedFields}
              onClose={() => setModalOpen(false)}
            />
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="xl:col-span-1 space-y-4">
        <HeartbeatCard />

        <Card className="p-2 items-center bg-gray-800">
          <AttitudeIndicator
            roll={attitude.roll}
            pitch={attitude.pitch}
            heading={attitude.yaw}
            size={300}
          />
        </Card>

        {/* <Card className="p-2 items-center bg-gray-800">
          <Compass heading={attitude.yaw} size={300} />
        </Card> */}

        <Card className=" items-center bg-gray-800  pt-0 pb-0">
          <MessageBox />
        </Card>
      </div>

      {/* <div className="xl:col-span-1 space-y-3 overflow-hidden "></div> */}
    </div>
  );
}
