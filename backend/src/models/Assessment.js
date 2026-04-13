import mongoose from "mongoose";

// ICOPE domains: Cognition, Locomotion, Vitality, Sensory (Vision+Hearing), Mood, Care
const assessmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // ── Cognition (MMSE / MoCA brief) ──────────────────────────────
    cognitionScore:   { type: Number, min: 0, max: 30 },
    cognitionNotes:   { type: String, default: "" },
    cognitionStatus:  { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Not Assessed"], default: "Not Assessed" },

    // ── Locomotion (TUG / Gait) ───────────────────────────────────
    tugTime:          { type: Number },          // seconds
    walkingAid:       { type: String, default: "" },
    locomotionStatus: { type: String, enum: ["Normal", "Mild Limitation", "Moderate Limitation", "Severe Limitation", "Not Assessed"], default: "Not Assessed" },
    locomotionNotes:  { type: String, default: "" },

    // ── Vitality / Nutrition (MNA-SF) ────────────────────────────
    mnaScore:         { type: Number, min: 0, max: 14 },
    bmi:              { type: Number },
    weight:           { type: Number },          // kg
    height:           { type: Number },          // cm
    vitalityStatus:   { type: String, enum: ["Normal", "At Risk", "Malnourished", "Not Assessed"], default: "Not Assessed" },
    vitalityNotes:    { type: String, default: "" },

    // ── Hearing ───────────────────────────────────────────────────
    hearingLeft:      { type: String, enum: ["Normal", "Mild Loss", "Moderate Loss", "Severe Loss", "Not Assessed"], default: "Not Assessed" },
    hearingRight:     { type: String, enum: ["Normal", "Mild Loss", "Moderate Loss", "Severe Loss", "Not Assessed"], default: "Not Assessed" },
    hearingAid:       { type: Boolean, default: false },
    hearingNotes:     { type: String, default: "" },

    // ── Vision ────────────────────────────────────────────────────
    visionLeft:       { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Not Assessed"], default: "Not Assessed" },
    visionRight:      { type: String, enum: ["Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment", "Not Assessed"], default: "Not Assessed" },
    glassesUsed:      { type: Boolean, default: false },
    visionNotes:      { type: String, default: "" },

    // ── Mood / Depression (GDS-4) ─────────────────────────────────
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
