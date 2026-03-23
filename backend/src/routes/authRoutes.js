import express from "express";

import { login, registerPhysiotherapist } from "../controllers/authController.js";
import { authRequired, roleRequired } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register-physiotherapist", authRequired, roleRequired("SUPER_ADMIN"), registerPhysiotherapist);

export default router;
