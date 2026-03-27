import express from "express";

import {
  createPatient,
  deletePatient,
  deletePhysiotherapist,
  getPatient,
  getLocationOptions,
  listPatientAssessments,
  listPatients,
  listPhysiotherapists,
  saveAssessment,
  updateAssessment,
  updatePatient,
  updatePhysiotherapist,
} from "../controllers/patientController.js";
import { authRequired, roleRequired } from "../middleware/auth.js";

const router = express.Router();
router.use(authRequired);

router.get("/metadata/locations", roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), getLocationOptions);

// ── Patients ──────────────────────────────────────────────────────
router.get("/patients",          roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), listPatients);
router.post("/patients",         roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), createPatient);
router.get("/patients/:id",      roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), getPatient);
router.put("/patients/:id",      roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), updatePatient);
router.delete("/patients/:id",   roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), deletePatient);

// ── Assessments ───────────────────────────────────────────────────
router.get("/patients/:id/assessments",                    roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), listPatientAssessments);
router.post("/patients/:id/assessments",                   roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), saveAssessment);
router.put("/patients/:id/assessments/:assessmentId",      roleRequired("SUPER_ADMIN","PHYSIOTHERAPIST"), updateAssessment);

// ── Admin: Physiotherapist management (SUPER_ADMIN only) ─────────
router.get("/physiotherapists",        roleRequired("SUPER_ADMIN"), listPhysiotherapists);
router.put("/physiotherapists/:id",    roleRequired("SUPER_ADMIN"), updatePhysiotherapist);
router.delete("/physiotherapists/:id", roleRequired("SUPER_ADMIN"), deletePhysiotherapist);

export default router;
