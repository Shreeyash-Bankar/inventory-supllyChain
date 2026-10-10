import React from "react";
import CalibrationCard from "./CalibrationCard";
import { Outlet, useNavigate } from "react-router-dom";
const CalibrationDash = () => {
  const navigate = useNavigate();

  const handleAccelClick = () => {
    navigate("/accellCalibration");
  };
  const handleCompassClick = () => {
    navigate("/compassCalibration");
  };

  const handleCompassMotorClick = () => {
    navigate("/compassMotorCalibration");
  };

  return (
    <div className="flex gap-3 w-full h-full min-h-79 justify-between flex-wrap ">
      <div className="flex flex-1" onClick={handleAccelClick}>
        <CalibrationCard
          calibrationName={"Accelerometer  Calibration"}
          calibrationSteps={"6"}
          calibrationDescription={"This callibration collects 6 axis data"}
        />
      </div>

      <div className="flex flex-1" onClick={handleCompassClick}>
        <CalibrationCard
          calibrationName={"Compass Calibration"}
          calibrationSteps={"6"}
          calibrationDescription={
            "This callibration calibrates the compass by rotating the drone in 6 axis"
          }
        />
      </div>
      <div className="flex flex-1" onClick={handleCompassMotorClick}>
        <CalibrationCard
          calibrationName={"Servo Calibration"}
          calibrationSteps={"6"}
          calibrationDescription={
            "This callibration need the motors to spin at its max "
          }
        />
      </div>
      <div className="bg-gray-600">
        <Outlet />
      </div>
    </div>
  );
};

export default CalibrationDash;
