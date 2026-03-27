import Assessment from "../models/Assessment.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

const dashboard = async (_req, res) => {
  try {
    const [physioCount, patientCount, assessmentCount, recentPhysios, recentPatients] = await Promise.all([
      User.countDocuments({ role: "PHYSIOTHERAPIST" }),
      Patient.countDocuments(),
      Assessment.countDocuments(),
      User.find({ role: "PHYSIOTHERAPIST" }).sort({ createdAt: -1 }).limit(20),
      Patient.find().populate("doctorId", "name email").sort({ createdAt: -1 }).limit(10),
    ]);

    // Patient counts per physio
    const countAgg = await Patient.aggregate([
      { $group: { _id: "$doctorId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    countAgg.forEach(c => { countMap[String(c._id)] = c.count; });

    return res.json({
      stats: { physiotherapists: physioCount, patients: patientCount, assessments: assessmentCount },
      physiotherapists: recentPhysios.map(p => ({
        _id: p._id,
        name: p.name,
        email: p.email,
        role: p.role,
        createdAt: p.createdAt,
        patientCount: countMap[String(p._id)] || 0,
      })),
      recentPatients,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const allPatients = async (_req, res) => {
  try {
    const patients = await Patient.find()
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 });
    return res.json({ patients });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export { allPatients, dashboard };
