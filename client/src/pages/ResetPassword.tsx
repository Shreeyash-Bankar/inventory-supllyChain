import axios from "axios";
import React from "react";
import { useState } from "react";

interface Response {
  message: string;
}
const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayPasswordCheck, setDisplayPasswordCheck] = useState("");

  const checkPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (e.target.value !== password) {
      const checking = "Password does not match with confirm password ";
      setDisplayPasswordCheck(checking);
    }
  };

  const handleResetPasswordBtn = async () => {
    try {
      const response = await axios.post<Response>(
        "http://localhost:5000/auth/reset-password",
        {
          password,
        },
      );

      if (response.data) {
        alert(response.data.message);
      }
    } catch (error) {
      console.error("Failed to reset Password:", error);
    }
  };

  return (
    <div>
      <div>
        <div>
          <label>Password</label>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={checkPassword}
          />
          <span>{displayPasswordCheck}</span>
        </div>
        <div>
          <button type="button" onClick={handleResetPasswordBtn}>
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
