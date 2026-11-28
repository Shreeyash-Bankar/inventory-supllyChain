import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controller/productController.js";
import upload from "../middleware/upload.js";
const router = express.Router();

router.get("/", getProducts);

router.post("/", upload.single("image"), createProduct);

// router.patch("/:id", updateProduct);

router.delete("/:id", deleteProduct);

router.put("/:id", upload.single("image"), updateProduct);

export default router;
