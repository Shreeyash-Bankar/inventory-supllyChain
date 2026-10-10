import ControlPanel from "@/components/controlPanel/ControlPanel";
import MapView from "@/components/controlPanel/Maps";
import React from "react";

const FlightLayout = () => {
  return (
    <div className="flex">
      <div className="w-full h-full">
        <ControlPanel />
      </div>
      <div>
        <MapView />
      </div>
    </div>
  );
};

export default FlightLayout;
