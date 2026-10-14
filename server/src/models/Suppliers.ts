import mongoose, { Schema } from "mongoose";

const supplierSchema = new Schema({
  supplierId: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
  },

  supplier_name: {
    type: String,
    required: [true, "Supplier name is required"],
    trim: true,
    minlength: [2, "Name must contain at least 2 characters"],
    maxlength: [100, "Name cannot exceed 100 characters"],
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    maxlength: [254, "Email is too long"],
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "Please enter a valid email address",
    ],
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
    match: [
      /^\+?[0-9]{10,15}$/,
      "Phone must contain 10–15 digits, optionally starting with +",
    ],
  },

  contact_person: {
    type: String,
    required: [true, "Contact person is required"],
    trim: true,
    minlength: [2, "Contact name must contain at least 2 characters"],
    maxlength: [100, "Contact name cannot exceed 100 characters"],
  },

  address: {
    type: String,
    default: null,
    trim: true,
    maxlength: [300, "Address cannot exceed 300 characters"],
  },
});

export const Supplier = mongoose.model("Supplier", supplierSchema);