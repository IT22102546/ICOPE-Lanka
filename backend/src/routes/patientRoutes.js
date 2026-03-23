import express from "express";

import {
  createPatient,
  listPatientAssessments,
  listPatients,
  saveAssessment,
} from "../controllers/patientController.js";
import { authRequired, roleRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);
router.get("/patients", roleRequired("SUPER_ADMIN", "PHYSIOTHERAPIST"), listPatients);
router.post("/patients", roleRequired("SUPER_ADMIN", "PHYSIOTHERAPIST"), createPatient);
router.post("/patients/:id/assessments", roleRequired("SUPER_ADMIN", "PHYSIOTHERAPIST"), saveAssessment);
router.get("/patients/:id/assessments", roleRequired("SUPER_ADMIN", "PHYSIOTHERAPIST"), listPatientAssessments);

export default router;
