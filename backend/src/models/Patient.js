import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    fullName:       { type: String, required: true, trim: true },
    dateOfBirth:    { type: String },
    age:            { type: Number },
    gender:         { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
    phone:          { type: String, trim: true },
    province:       { type: String, trim: true },
    district:       { type: String, trim: true },
    address:        { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    medicalHistory: { type: String, default: "" },
    doctorId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
