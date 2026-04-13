import express from "express";

import { allPatients, dashboard } from "../controllers/adminController.js";
import { authRequired, roleRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired, roleRequired("SUPER_ADMIN"));
router.get("/dashboard", dashboard);
router.get("/patients",  allPatients);

export default router;
