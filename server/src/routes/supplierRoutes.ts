import express from "express";
import {
  createSupplier,
  updateSupplier,
  getSupplier,
  getSuppliers,
  deleteSupplier,
} from "../controller/supplierController.js";
const router = express.Router();

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.put("/id", updateSupplier);
router.delete("/:id", deleteSupplier);
router.get("/:id", getSupplier);

export default router;
