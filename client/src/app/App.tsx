import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import reactLogo from "../assets/react.svg";
import viteLogo from "../assets/vite.svg";
import heroImg from "../assets/hero.png";
import "./App.css";
import CategoryForm from "../features/categories/components/CategoryForm";
import CategoryTable from "../features/categories/components/CategoryTable";
import Login from "../pages/Login.js";
import Signup from "../pages/Signup.js";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/" element={<Signup />}></Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
