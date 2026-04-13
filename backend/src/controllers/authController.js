import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const signToken = (user) => {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const login = async (req, res) => {
  const { email, identifier, password, allowedRoles } = req.body;
  const loginEmail = String(email || identifier || "").toLowerCase();

  if (!loginEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: loginEmail });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return res.status(403).json({ message: "Role not allowed" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken(user);

  return res.json({
    accessToken: token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const registerPhysiotherapist = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const normalizedEmail = String(email).toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "PHYSIOTHERAPIST",
  });

  return res.status(201).json({
    message: "Physiotherapist registered",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

export { login, registerPhysiotherapist };
