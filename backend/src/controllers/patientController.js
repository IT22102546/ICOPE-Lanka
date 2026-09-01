import Assessment from "../models/Assessment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { PROVINCES, SRI_LANKA_LOCATIONS, isValidProvinceDistrict } from "../constants/sriLankaLocations.js";

// ─── Patients ────────────────────────────────────────────────────────────────

const listPatients = async (req, res) => {
  try {
    let query;
    if (req.user.role === "SUPER_ADMIN") {
      // ?mine=true → only patients directly assigned to this admin
      query = req.query.mine === "true" ? { doctorId: req.user._id } : {};
    } else {
      query = { doctorId: req.user._id };
    }
    const patients = await Patient.find(query)
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });
    return res.json({ patients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate("doctorId", "name email");
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }
    return res.json({ patient });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const createPatient = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      age,
      gender,
      phone,
      province,
      district,
      address,
      emergencyContact,
      medicalHistory,
      doctorId,
    } = req.body;
    if (!fullName) return res.status(400).json({ message: "fullName is required" });
    if (!phone) return res.status(400).json({ message: "phone is required" });

    if (!province || !PROVINCES.includes(province)) {
      return res.status(400).json({ message: "A valid province is required" });
    }

    if (!district || !isValidProvinceDistrict(province, district)) {
      return res.status(400).json({ message: "A valid district is required for the selected province" });
    }

    // Super admin must explicitly assign to a physiotherapist
    if (req.user.role === "SUPER_ADMIN" && !doctorId) {
      return res.status(400).json({ message: "Please assign this patient to a physiotherapist" });
    }

    const assignedDoctorId = req.user.role === "SUPER_ADMIN" ? doctorId : req.user._id;

    const patient = await Patient.create({
      fullName, dateOfBirth, age, gender, phone, address, emergencyContact, medicalHistory,
      province,
      district,
      doctorId: assignedDoctorId,
      createdBy: req.user._id,
    });

    return res.status(201).json({ patient });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const nextProvince = req.body.province !== undefined ? req.body.province : patient.province;
    const nextDistrict = req.body.district !== undefined ? req.body.district : patient.district;

    if (req.body.province !== undefined && !PROVINCES.includes(nextProvince)) {
      return res.status(400).json({ message: "A valid province is required" });
    }

    if ((req.body.province !== undefined || req.body.district !== undefined) && !isValidProvinceDistrict(nextProvince, nextDistrict)) {
      return res.status(400).json({ message: "A valid district is required for the selected province" });
    }

    const allowed = ["fullName","dateOfBirth","age","gender","phone","province","district","address","emergencyContact","medicalHistory"];
    allowed.forEach(k => { if (req.body[k] !== undefined) patient[k] = req.body[k]; });

    // Super admin can reassign the patient to any user (including themselves)
    if (req.user.role === "SUPER_ADMIN" && req.body.doctorId) {
      patient.doctorId = req.body.doctorId;
    }

    await patient.save();
    await patient.populate("doctorId", "name email");
    return res.json({ patient });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Assessment.deleteMany({ patientId: patient._id });
    await patient.deleteOne();
    return res.json({ message: "Patient deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Assessments ─────────────────────────────────────────────────────────────

const listPatientAssessments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessments = await Assessment.find({ patientId: req.params.id })
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });
    return res.json({ assessments });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const saveAssessment = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    if (req.user.role !== "SUPER_ADMIN" && String(patient.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const assessment = await Assessment.create({
      patientId: patient._id,
      doctorId: req.user._id,
      ...req.body,
    });

    return res.status(201).json({ assessment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.assessmentId);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });

    const patient = await Patient.findById(assessment.patientId);
    if (req.user.role !== "SUPER_ADMIN" && String(patient?.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(assessment, req.body);
    await assessment.save();
    return res.json({ assessment });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Admin: list all physiotherapists ────────────────────────────────────────

const listPhysiotherapists = async (req, res) => {
  try {
    const physios = await User.find({ role: "PHYSIOTHERAPIST" }).sort({ createdAt: -1 });
    // Add patient count per physio
    const ids = physios.map(p => p._id);
    const counts = await Patient.aggregate([
      { $match: { doctorId: { $in: ids } } },
      { $group: { _id: "$doctorId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[String(c._id)] = c.count; });
    const result = physios.map(p => ({
      _id: p._id,
      name: p.name,
      email: p.email,
      role: p.role,
      createdAt: p.createdAt,
      patientCount: countMap[String(p._id)] || 0,
    }));
    return res.json({ physiotherapists: result });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getLocationOptions = async (_req, res) => {
  return res.json({
    provinces: PROVINCES,
    districtsByProvince: SRI_LANKA_LOCATIONS,
  });
};

const deletePhysiotherapist = async (req, res) => {
  try {
    const physio = await User.findById(req.params.id);
    if (!physio) return res.status(404).json({ message: "User not found" });
    if (physio.role === "SUPER_ADMIN") return res.status(403).json({ message: "Cannot delete super admin" });
    await physio.deleteOne();
    return res.json({ message: "Physiotherapist deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updatePhysiotherapist = async (req, res) => {
  try {
    const physio = await User.findById(req.params.id);
    if (!physio) return res.status(404).json({ message: "User not found" });
    if (physio.role === "SUPER_ADMIN") return res.status(403).json({ message: "Cannot modify super admin" });

    if (req.body.name  !== undefined) physio.name  = req.body.name.trim();
    if (req.body.email !== undefined) physio.email = req.body.email.trim().toLowerCase();

    if (req.body.password) {
      if (req.body.password.length < 8)
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      physio.passwordHash = await bcrypt.hash(req.body.password, 10);
    }

    await physio.save();
    return res.json({
      physiotherapist: {
        _id: physio._id, name: physio.name, email: physio.email,
        role: physio.role, createdAt: physio.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export {
  createPatient, deletePatient, deletePhysiotherapist, getPatient,
  getLocationOptions,
  listPatientAssessments, listPatients, listPhysiotherapists,
  saveAssessment, updateAssessment, updatePatient, updatePhysiotherapist,
};
