import { useState } from "react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router";
import { toast } from "react-toastify";

interface user {
  name: string;
  email: string;
  role: string;
  isActive: string;
  created_at: string;
  updated_at: string;
}
interface signupResponse {
  message: string;
  user: user;
}

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const response = await axios.post<signupResponse>(
        "http://localhost:5000/auth/signup",
        {
          name: firstName,
          email: email,
          password: password,
        },
      );

      const notifyMessage = response.data.message;
      toast.success(notifyMessage);

      navigate("/login");
    } catch (error) {
      console.error("Signup failed:", error);
    }
  };

  console.log(firstName, password, email);
  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="bg-amber-200 w-[500px] ">
        <form className="p-5">
          <div>
            <label className="text-sm">First Name</label>
          </div>
          <div className="border-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label>Password</label>
          </div>
          <div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
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
            <button onClick={handleSubmit}>Sign Up</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;
