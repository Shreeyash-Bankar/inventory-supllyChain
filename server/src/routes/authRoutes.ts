import express from "express";
import {
  forgotPassword,
  login,
  logout,
  signUp,
} from "../controller/authController.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.get("/logout", logout);

export default router;
