import express from "express";

import { dashboard } from "../controllers/adminController.js";
import { authRequired, roleRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, roleRequired("SUPER_ADMIN"));
router.get("/dashboard", dashboard);

export default router;
