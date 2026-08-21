import { Router } from "express";
import express from "express";
import {
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controller/categoryController.js";

const router = express.Router();

// const router = Router();
console.log("category route loaded");

// router.get("/", (req, res) => {
//   console.log("inside the router get method for categories");
//   res.send("welcome to categories");
// });

router.get("/", getCategory);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
