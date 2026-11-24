import express from "express";
import dotenv from "dotenv";
import { pool } from "./config/db.js";
import { connectMongo } from "./config/mongo.js";

import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoute.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cors from "cors";
import session from "express-session";
import { connectRedis } from "./config/redis.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10000 * 60 * 30,
    },
  }),
);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.use("/categories", categoryRoutes);
app.use("/products", productRoutes);
app.use("/supplier", supplierRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT || 5000;

// await connectRedis();

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected");
    console.log(result.rows);
    // await connectMongo();
  } catch (err) {
    console.error("❌ Database connection failed");
    console.error(err);
  }
});
