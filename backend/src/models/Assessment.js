import mongoose from "mongoose";

// ICOPE domains: Cognition, Locomotion, Vitality, Sensory (Vision+Hearing), Mood, Care
const assessmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Cognition (MMSE / MoCA brief) ──────────────────────────────
    cognitionScore:   { type: String },
    cognitionNotes:   { type: String, default: "" },
    cognitionStatus:  { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Impaired", "Not Assessed"], default: "Not Assessed" },

    // ── Locomotion ────────────────────────────────────────────────
    tugTime:          { type: Number },
    walkingAid:       { type: String, default: "" },
    locomotionStatus: { type: String, enum: ["Normal", "Mild Limitation", "Moderate Limitation", "Severe Limitation", "Limitation", "Not Assessed"], default: "Not Assessed" },
    locomotionNotes:  { type: String, default: "" },

    // ── Vitality / Nutrition ─────────────────────────────────────
    mnaScore:         { type: Number, min: 0, max: 14 },
    bmi:              { type: Number },
    weight:           { type: Number },
    height:           { type: Number },
    vitalityStatus:   { type: String, enum: ["Normal", "At Risk", "Malnourished", "Not Assessed"], default: "Not Assessed" },
    vitalityNotes:    { type: String, default: "" },

    // ── Hearing ───────────────────────────────────────────────────
    hearingLeft:      { type: String, enum: ["Normal", "Mild Loss", "Moderate Loss", "Severe Loss", "Hearing Loss", "Not Assessed"], default: "Not Assessed" },
    hearingRight:     { type: String, enum: ["Normal", "Mild Loss", "Moderate Loss", "Severe Loss", "Hearing Loss", "Not Assessed"], default: "Not Assessed" },
    hearingAid:       { type: Boolean, default: false },
    hearingNotes:     { type: String, default: "" },

    // ── Vision ────────────────────────────────────────────────────
    visionLeft:       { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Impairment", "Not Assessed"], default: "Not Assessed" },
    visionRight:      { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Impairment", "Not Assessed"], default: "Not Assessed" },
    glassesUsed:      { type: Boolean, default: false },
    visionNotes:      { type: String, default: "" },

    // ── Mood / Depression ─────────────────────────────────────────
    gdsScore:         { type: Number, min: 0, max: 15 },
    moodStatus:       { type: String, enum: ["Normal", "Possible Depression", "Depression", "Not Assessed"], default: "Not Assessed" },
    moodNotes:        { type: String, default: "" },

    // ── Care Plan / Recommendations ───────────────────────────────
    careRecommendations: { type: String, default: "" },
    followUpDate:        { type: String },
    referralNeeded:      { type: Boolean, default: false },
    referralDetails:     { type: String, default: "" },

    // Legacy flat fields kept for backward compat
    hearing:   { type: String, default: "" },
    vision:    { type: String, default: "" },
    cognition: { type: String, default: "" },
    mood:      { type: String, default: "" },
    mobility:  { type: String, default: "" },
    nutrition: { type: String, default: "" },
    notes:     { type: String, default: "" },
  },
  { timestamps: true }
);

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;
