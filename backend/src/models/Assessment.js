import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hearing: { type: String, default: "" },
    vision: { type: String, default: "" },
    cognition: { type: String, default: "" },
    mood: { type: String, default: "" },
    mobility: { type: String, default: "" },
    nutrition: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;
