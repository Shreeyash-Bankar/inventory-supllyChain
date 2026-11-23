import axios from "axios";
import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handlebtnLogin = async () => {
    const response = await axios.post("http://localhost:5000/auth/login", {
      email: email,
      password: password,
    });
  };

  return (
    <div>
      <div className="min-h-screen flex justify-center items-center">
        <form className="w-[500px] bg-amber-200 p-2">
          <div>
            <label>Email</label>
          </div>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label>Password</label>
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
            <span></span>
          </div>
          <div>
            <button>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
