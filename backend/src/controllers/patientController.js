import Assessment from "../models/Assessment.js";
import Patient from "../models/Patient.js";

const listPatients = async (req, res) => {
  const query = req.user.role === "SUPER_ADMIN" ? {} : { doctorId: req.user._id };

  const patients = await Patient.find(query).sort({ createdAt: -1 });
  return res.json({ patients });
};

const createPatient = async (req, res) => {
  const { fullName, age, gender, doctorId } = req.body;

  if (!fullName) {
    return res.status(400).json({ message: "fullName is required" });
  }

  const assignedDoctorId = req.user.role === "SUPER_ADMIN" && doctorId ? doctorId : req.user._id;

  const patient = await Patient.create({
    fullName,
    age,
    gender,
    doctorId: assignedDoctorId,
    createdBy: req.user._id,
  });

  return res.status(201).json({ patient });
};

const saveAssessment = async (req, res) => {
  const { id } = req.params;
  const patient = await Patient.findById(id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only update your own patients" });
  }

  const assessment = await Assessment.create({
    patientId: patient._id,
    doctorId: req.user._id,
    hearing: req.body.hearing || "",
    vision: req.body.vision || "",
    cognition: req.body.cognition || "",
    mood: req.body.mood || "",
    mobility: req.body.mobility || "",
    nutrition: req.body.nutrition || "",
    notes: req.body.notes || "",
  });

  return res.status(201).json({ assessment });
};

const listPatientAssessments = async (req, res) => {
  const { id } = req.params;
  const patient = await Patient.findById(id);

  if (!patient) {
    return res.status(404).json({ message: "Patient not found" });
  }

  if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
    return res.status(403).json({ message: "You can only view your own patients" });
  }

  const assessments = await Assessment.find({ patientId: id }).sort({ createdAt: -1 });
  return res.json({ assessments });
};

export { createPatient, listPatientAssessments, listPatients, saveAssessment };
