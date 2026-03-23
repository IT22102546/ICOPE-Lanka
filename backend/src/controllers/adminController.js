import Patient from "../models/Patient.js";
import User from "../models/User.js";

const dashboard = async (_req, res) => {
  const [physioCount, patientCount, recentPhysios] = await Promise.all([
    User.countDocuments({ role: "PHYSIOTHERAPIST" }),
    Patient.countDocuments(),
    User.find({ role: "PHYSIOTHERAPIST" }).sort({ createdAt: -1 }).limit(20),
  ]);

  return res.json({
    stats: {
      physiotherapists: physioCount,
      patients: patientCount,
    },
    physiotherapists: recentPhysios,
  });
};

export { dashboard };
