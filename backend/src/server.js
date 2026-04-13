import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api", patientRoutes);
app.use("/api/admin", adminRoutes);

const ensureSuperAdmin = async () => {
  const email = String(process.env.SUPER_ADMIN_EMAIL || "").toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || "";
  const name = process.env.SUPER_ADMIN_NAME || "Main Super Admin";

  if (!email || !password) {
    console.warn("Super admin env credentials are not configured.");
    return;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    passwordHash,
    role: "SUPER_ADMIN",
  });

  console.log("Super admin created:", email);
};

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    await ensureSuperAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

start();
