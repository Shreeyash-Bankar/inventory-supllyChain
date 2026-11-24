import axios from "axios";
import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../store/AuthContext";

interface user {
  _id: number;
  name: string;
  email: string;
  role: string;
  isActive: string;
  created_at: string;
  updated_at: string;
}
interface loginResponse {
  message: string;
  user: user;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { setAuthUser } = useAuth();

  const handlebtnLogin = async () => {
    const response = await axios.post<loginResponse>(
      "http://localhost:5000/auth/login",
      {
        email: email,
        password: password,
      },
    );

    const user = response.data.user;

    setAuthUser(user);
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
