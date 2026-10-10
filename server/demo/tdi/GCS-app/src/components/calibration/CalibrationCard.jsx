import React from "react";

const CalibrationCard = ({
  calibrationName,
  calibrationDescription,
  calibrationSteps,
}) => {
  return (
    <div className="flex flex-col justify-around transition-colors bg-gray-700 hover:bg-gray-900 gap-3 rounded-xl ml-3.5 mr-3.5 mt-5 max-h-80 min-h-40 px-6 py-6 w-full min-w-[400px] border-gray-600 hover:border-gray-700 border-[1px] cursor-pointer hover:text-green-500">
      <div className="font-mono font-bold text-2xl">{calibrationName}</div>
      <div className="font-sans font-medium">
        Steps involved: {calibrationSteps}
      </div>
      <div className="font-sans font-medium">
        DESCRIPTION: {calibrationDescription}
      </div>
    </div>
  );
};

export default CalibrationCard;
