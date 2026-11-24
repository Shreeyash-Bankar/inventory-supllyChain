import React from "react";
import { useAuth } from "../store/AuthContext";

const HomePage = () => {
  const { user } = useAuth();
  return <div>{user ? <h2>Welcome, {user.name}</h2> : <h2>Guest</h2>}</div>;
};

export default HomePage;
