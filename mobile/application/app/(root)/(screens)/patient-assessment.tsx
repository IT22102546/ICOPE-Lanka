import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Switch,
  Vibration,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";

const API = process.env.EXPO_PUBLIC_API_KEY;
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const sc = (size: number) => Math.round((screenWidth / 390) * size);
const vs = (size: number) => Math.round((screenHeight / 844) * size);

// ── Bilingual ────────────────────────────────────────────────────
const TXT: Record<string, { en: string; si: string }> = {
  brand:           { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  assessment:      { en: "ICOPE Assessment", si: "ICOPE තක්සේරුව" },
  cognition:       { en: "Cognition", si: "සංජානන" },
  cognitionDesc:   { en: "Word recall & orientation", si: "වචන සිහිපත් කිරීම සහ දිශානතිය" },
  locomotion:      { en: "Locomotion", si: "චලනය" },
  locomotionDesc:  { en: "Timed Up & Go (TUG) test", si: "කාලගත නැගිටීම සහ ඇවිදීම (TUG)" },
  vitality:        { en: "Vitality / Nutrition", si: "ජීවනකාරිත්වය / පෝෂණය" },
  vitalityDesc:    { en: "MNA-SF nutritional screening", si: "MNA-SF පෝෂණ පරීක්ෂණය" },
  hearing:         { en: "Hearing", si: "ශ්‍රවණය" },
  hearingDesc:     { en: "Whisper test", si: "Whisper පරීක්ෂණය" },
  vision:          { en: "Vision", si: "දෘෂ්ටි" },
  visionDesc:      { en: "Finger counting test", si: "ඇඟිලි ගණන් කිරීමේ පරීක්ෂණය" },
  mood:            { en: "Mood / Depression", si: "මනෝභාවය / මානසික අවපීඩනය" },
  moodDesc:        { en: "GDS-4 screening", si: "GDS-4 පරීක්ෂණය" },
  carePlan:        { en: "Care Plan", si: "සත්කාර සැලැස්ම" },
  carePlanDesc:    { en: "Recommendations & follow-up", si: "නිර්දේශ සහ පසු විපරම්" },

  // cognition
  wordRecallTest:  { en: "Word Recall Test", si: "වචන සිහිපත් කිරීමේ පරීක්ෂණය" },
  wordRecallInstr: { en: "Read these 3 words aloud to the patient. Ask them to repeat and remember.", si: "මෙම වචන 3 රෝගියාට හඩින් කියවන්න. නැවත කියන්නට සහ මතක තබන්නට කියන්න." },
  showWords:       { en: "Show Words", si: "වචන පෙන්වන්න" },
  hideWords:       { en: "Hide Words", si: "වචන සඟවන්න" },
  askRecall:       { en: "Ask Patient to Recall", si: "රෝගියාට සිහිපත් කරන්නට කියන්න" },
  recallInstr:     { en: "How many words did the patient recall correctly?", si: "රෝගියා නිවැරදිව සිහිපත් කළ වචන ගණන කීයද?" },
  wordsRecalled:   { en: "Words recalled", si: "සිහිපත් කළ වචන" },
  of3:             { en: "of 3", si: "/ 3 න්" },
  orientationTest: { en: "Orientation in Time and Space", si: "කාලය සහ අවකාශය පිළිබඳ දිශානතිය" },
  orientationInstr:{ en: "Ask: What is today's full date? Where are you now (home, clinic, etc.)?", si: "අසන්න: අද සම්පූර්ණ දිනය කුමක්ද? ඔබ දැන් සිටින්නේ කොහේද (නිවස, රෝහල, ආදිය)?" },
  yesCorrect:      { en: "Yes – Correct", si: "ඔව් – නිවැරදි" },
  noWrong:         { en: "No – Wrong", si: "නැත – වැරදි" },

  // locomotion
  tugTest:         { en: "Timed Up & Go Test", si: "කාලගත නැගිටීම සහ ඇවිදීම පරීක්ෂණය" },
  tugInstr:        { en: "Patient sits in a chair, stands up, walks 3m, turns, walks back, sits down. Time it below.", si: "රෝගියා පුටුවක වාඩි වෙයි, නැගිටියි, මී 3 ඇවිදියි, හැරෙයි, ආපසු ඇවිදියි, වාඩි වෙයි. පහතින් කාලය මනින්න." },
  startTimer:      { en: "Start Timer", si: "කාලය ආරම්භ කරන්න" },
  stopTimer:       { en: "Stop Timer", si: "කාලය නවත්වන්න" },
  resetTimer:      { en: "Reset", si: "යළි සකසන්න" },
  seconds:         { en: "seconds", si: "තත්පර" },
  walkingAidLabel: { en: "Walking Aid Used", si: "ඇවිදීමේ උපකරණය" },
  aidNone:         { en: "None", si: "නැත" },
  aidCane:         { en: "Cane", si: "සැරයටිය" },
  aidWalker:       { en: "Walker", si: "වෝකර්" },
  aidWheelchair:   { en: "Wheelchair", si: "රෝදපුටුව" },

  // vitality MNA-SF
  mnaQ1:     { en: "Has food intake declined over the past 3 months?", si: "පසුගිය මාස 3 තුළ ආහාර ගැනීම අඩු වී තිබේද?" },
  mnaQ1_0:   { en: "Severe decrease", si: "දැඩි ලෙස අඩුවීම" },
  mnaQ1_1:   { en: "Moderate decrease", si: "මධ්‍යම අඩුවීම" },
  mnaQ1_2:   { en: "No decrease", si: "අඩුවීමක් නැත" },
  mnaQ2:     { en: "Weight loss during the last 3 months?", si: "පසුගිය මාස 3 තුළ බර අඩු වූවාද?" },
  mnaQ2_0:   { en: "Weight loss > 3 kg", si: "බර අඩුවීම > 3 kg" },
  mnaQ2_1:   { en: "Does not know", si: "නොදනී" },
  mnaQ2_2:   { en: "Weight loss 1-3 kg", si: "බර අඩුවීම 1-3 kg" },
  mnaQ2_3:   { en: "No weight loss", si: "බර අඩුවීමක් නැත" },
  mnaQ3:     { en: "Mobility?", si: "චලනය?" },
  mnaQ3_0:   { en: "Bed or chair bound", si: "ඇඳට හෝ පුටුවට සීමා වී ඇත" },
  mnaQ3_1:   { en: "Gets out of bed but doesn't go out", si: "ඇඳෙන් නැඟිටිය හැකි නමුත් බැහැර නොයයි" },
  mnaQ3_2:   { en: "Goes out", si: "බැහැරට යයි" },
  mnaQ4:     { en: "Psychological stress or acute disease in past 3 months?", si: "පසුගිය මාස 3 තුළ මානසික ආතතිය හෝ උග්‍ර රෝගයක්?" },
  mnaQ4_0:   { en: "Yes", si: "ඔව්" },
  mnaQ4_2:   { en: "No", si: "නැත" },
  mnaQ5:     { en: "Neuropsychological problems?", si: "ස්නායු මනෝ ගැටලු?" },
  mnaQ5_0:   { en: "Severe dementia or depression", si: "දරුණු ඩිමෙන්ශියාව හෝ අවපීඩනය" },
  mnaQ5_1:   { en: "Mild dementia", si: "මෘදු ඩිමෙන්ශියාව" },
  mnaQ5_2:   { en: "No problems", si: "ගැටලු නැත" },
  mnaQ6:     { en: "BMI or calf circumference?", si: "BMI හෝ වස්සාපිට වටප්‍රමාණය?" },
  mnaQ6_0:   { en: "BMI < 19", si: "BMI < 19" },
  mnaQ6_1:   { en: "BMI 19 to < 21", si: "BMI 19 සිට < 21" },
  mnaQ6_2:   { en: "BMI 21 to < 23", si: "BMI 21 සිට < 23" },
  mnaQ6_3:   { en: "BMI ≥ 23", si: "BMI ≥ 23" },
  mnaTotal:  { en: "MNA-SF Total Score", si: "MNA-SF මුළු ලකුණ" },
  weight:    { en: "Weight (kg)", si: "බර (kg)" },
  height:    { en: "Height (cm)", si: "උස (cm)" },
  bmi:       { en: "BMI", si: "BMI" },

  // hearing
  hearingTest:  { en: "Whisper Test", si: "Whisper පරීක්ෂණය" },
  hearingInstr: { en: "Stand behind the patient at arm's length. Whisper the number below and ask what they heard. Test each ear separately.", si: "රෝගියාගේ පිටුපසින් අතේ දිගින් සිටින්න. පහත අංකය මෘදු ලෙස කියා ඔවුන්ට ඇසුණ දේ අසන්න. එක් එක් කන වෙන වෙනම පරීක්ෂා කරන්න." },
  leftEar:      { en: "Left Ear", si: "වම් කන" },
  rightEar:     { en: "Right Ear", si: "දකුණු කන" },
  couldHear:    { en: "Could hear", si: "ඇසුණා" },
  couldNotHear: { en: "Could not hear", si: "ඇසුණේ නැහැ" },
  partially:    { en: "Partially", si: "අර්ධ වශයෙන්" },
  hearingAid:   { en: "Uses Hearing Aid", si: "ශ්‍රවණ උපකරණ භාවිතා කරයි" },
  whisperNum:   { en: "Whisper this number:", si: "මෙම අංකය මෘදු ලෙස කියන්න:" },

  // vision
  visionTest:   { en: "Finger Counting Test", si: "ඇඟිලි ගණන් කිරීමේ පරීක්ෂණය" },
  visionInstr:  { en: "Show the number of fingers below at arm's length. Ask the patient to count. Test each eye separately (cover the other).", si: "පහත ඇඟිලි ගණන අතේ දිගින් පෙන්වන්න. රෝගියාට ගණන් කරන්නට කියන්න. එක් එක් ඇස වෙන වෙනම පරීක්ෂා කරන්න (අනෙක වසන්න)." },
  newFingers:   { en: "New Number", si: "නව අංකය" },
  howMany:      { en: "How many fingers?", si: "ඇඟිලි කීයක්ද?" },
  leftEye:      { en: "Left Eye", si: "වම් ඇස" },
  rightEye:     { en: "Right Eye", si: "දකුණු ඇස" },
  correct:      { en: "Correct", si: "නිවැරදි" },
  incorrect:    { en: "Incorrect", si: "වැරදි" },
  glasses:      { en: "Uses Glasses", si: "කණ්ණාඩි භාවිතා කරයි" },

  // mood GDS-4
  moodTest:     { en: "Mood Assessment (GDS-4)", si: "මනෝභාව තක්සේරුව (GDS-4)" },
  moodInstr:    { en: "Ask the patient each question below. Record their answer.", si: "රෝගියාගෙන් එක් එක් ප්‍රශ්නය අසන්න. පිළිතුර සටහන් කරන්න." },
  gds1:         { en: "Are you basically satisfied with your life?", si: "ඔබ මූලික වශයෙන් ඔබේ ජීවිතයෙන් තෘප්තිමත්ද?" },
  gds2:         { en: "Do you feel that your life is empty?", si: "ඔබේ ජීවිතය හිස් බව ඔබට දැනෙනවාද?" },
  gds3:         { en: "Are you afraid something bad is going to happen to you?", si: "ඔබට නරක දෙයක් සිදුවීමට යන බවට බියක් දැනෙනවාද?" },
  gds4:         { en: "Do you feel happy most of the time?", si: "ඔබ බොහෝ වේලාවට සතුටින්ද?" },
  gdsYes:       { en: "Yes", si: "ඔව්" },
  gdsNo:        { en: "No", si: "නැහැ" },
  gdsScore:     { en: "GDS-4 Score", si: "GDS-4 ලකුණ" },

  // care plan
  recommendations: { en: "Recommendations", si: "නිර්දේශ" },
  followUp:        { en: "Follow-up Date", si: "පසු විපරම් දිනය" },
  referralNeeded:  { en: "Referral Needed", si: "යොමු කිරීම අවශ්‍යයි" },
  referralDetails: { en: "Referral Details", si: "යොමු කිරීමේ විස්තර" },

  // common
  score:   { en: "Score", si: "ලකුණ" },
  status:  { en: "Status", si: "තත්ත්වය" },
  notes:   { en: "Notes", si: "සටහන්" },
  left:    { en: "Left", si: "වම" },
  right:   { en: "Right", si: "දකුණ" },
  submit:          { en: "Submit Assessment", si: "තක්සේරුව ඉදිරිපත් කරන්න" },
  submitting:      { en: "Submitting...", si: "ඉදිරිපත් කරමින්..." },
  success:         { en: "Assessment saved successfully!", si: "තක්සේරුව සාර්ථකව සුරකින ලදී!" },
  error:           { en: "Failed to save assessment", si: "තක්සේරුව සුරැකීමට අසමත් විය" },
  history:         { en: "Previous Assessments", si: "පෙර තක්සේරු" },
  noHistory:       { en: "No previous assessments", si: "පෙර තක්සේරු නැත" },
  back:            { en: "Back", si: "ආපසු" },
};

// ── Word sets for recall (bilingual) ─────────────────────────────
const WORD_SETS = {
  en: [["Ball", "Flag", "Tree"], ["Car", "River", "Book"], ["Chair", "Apple", "Bell"], ["Dog", "Sun", "Cup"]],
  si: [["බෝලය", "කොඩිය", "ගස"], ["මෝටර් රථය", "ගඟ", "පොත"], ["පුටුව", "ඇපල්", "සීනුව"], ["බල්ලා", "ඉර", "කෝප්පය"]],
};

// ── Status labels (bilingual) ────────────────────────────────────
const SL: Record<string, { en: string; si: string }> = {
  "Not Assessed":        { en: "Not Assessed",        si: "තක්සේරු නොකළ" },
  Normal:                { en: "Normal",               si: "සාමාන්‍ය" },
  "Mild Impairment":     { en: "Mild Impairment",     si: "මෘදු දුර්වලතාව" },
  "Moderate Impairment": { en: "Moderate Impairment",  si: "මධ්‍යම දුර්වලතාව" },
  "Severe Impairment":   { en: "Severe Impairment",   si: "දරුණු දුර්වලතාව" },
  "Mild Limitation":     { en: "Mild Limitation",     si: "මෘදු සීමාව" },
  "Moderate Limitation": { en: "Moderate Limitation",  si: "මධ්‍යම සීමාව" },
  "Severe Limitation":   { en: "Severe Limitation",   si: "දරුණු සීමාව" },
  "At Risk":             { en: "At Risk",             si: "අවදානමට ලක්ව ඇත" },
  Malnourished:          { en: "Malnourished",        si: "මන්දපෝෂිත" },
  "Mild Loss":           { en: "Mild Loss",           si: "මෘදු අහිමිවීම" },
  "Moderate Loss":       { en: "Moderate Loss",       si: "මධ්‍යම අහිමිවීම" },
  "Severe Loss":         { en: "Severe Loss",         si: "දරුණු අහිමිවීම" },
  "Possible Depression": { en: "Possible Depression",  si: "විය හැකි අවපීඩනය" },
  Depression:            { en: "Depression",           si: "මානසික අවපීඩනය" },
};

// ── Status options per domain ────────────────────────────────────
const LOCOMOTION_STATUSES = ["Not Assessed", "Normal", "Mild Limitation", "Moderate Limitation", "Severe Limitation"];
const VITALITY_STATUSES   = ["Not Assessed", "Normal", "At Risk", "Malnourished"];
const HEARING_STATUSES    = ["Not Assessed", "Normal", "Mild Loss", "Moderate Loss", "Severe Loss"];
const VISION_STATUSES     = ["Not Assessed", "Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment"];
const MOOD_STATUSES       = ["Not Assessed", "Normal", "Possible Depression", "Depression"];

type DomainKey = "cognition" | "locomotion" | "vitality" | "hearing" | "vision" | "mood" | "carePlan";

const DOMAIN_CONFIG: { key: DomainKey; icon: string; color: string }[] = [
  { key: "cognition",  icon: "bulb-outline",       color: "#6366F1" },
  { key: "locomotion", icon: "walk-outline",        color: "#F59E0B" },
  { key: "vitality",   icon: "nutrition-outline",   color: "#10B981" },
  { key: "hearing",    icon: "ear-outline",         color: "#3B82F6" },
  { key: "vision",     icon: "eye-outline",         color: "#8B5CF6" },
  { key: "mood",       icon: "happy-outline",       color: "#EC4899" },
  { key: "carePlan",   icon: "clipboard-outline",   color: "#0E7C61" },
];

const PatientAssessment = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string; patientName: string }>();
  const { getAccessToken } = useAuthStore();
  const [lang, setLang] = useState<"en" | "si">("en");
  const t = (key: string) => TXT[key]?.[lang] ?? key;
  const sl = (key: string) => SL[key]?.[lang] ?? key;

  const [expanded, setExpanded] = useState<DomainKey | null>("cognition");
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // ── Form state (maps to backend Assessment model) ──────────────
  const [form, setForm] = useState({
    cognitionScore: "", cognitionStatus: "Not Assessed", cognitionNotes: "",
    tugTime: "", walkingAid: "", locomotionStatus: "Not Assessed", locomotionNotes: "",
    mnaScore: "", weight: "", height: "", bmi: "", vitalityStatus: "Not Assessed", vitalityNotes: "",
    hearingLeft: "Not Assessed", hearingRight: "Not Assessed", hearingAid: false, hearingNotes: "",
    visionLeft: "Not Assessed", visionRight: "Not Assessed", glassesUsed: false, visionNotes: "",
    gdsScore: "", moodStatus: "Not Assessed", moodNotes: "",
    careRecommendations: "", followUpDate: "", referralNeeded: false, referralDetails: "",
  });
  const updateForm = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));

  // ── Interactive test state ─────────────────────────────────────
  // Cognition: word recall + orientation
  const [wordSetIdx] = useState(() => Math.floor(Math.random() * WORD_SETS.en.length));
  const [wordsVisible, setWordsVisible] = useState(false);
  const [recallPhase, setRecallPhase] = useState(false);
  const [wordsRecalled, setWordsRecalled] = useState<number | null>(null);
  const [orientationCorrect, setOrientationCorrect] = useState<boolean | null>(null);

  // Locomotion: TUG timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMs, setTimerMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStart = useRef(0);

  // Vitality: MNA-SF answers
  const [mna, setMna] = useState<Record<string, number | null>>({ q1: null, q2: null, q3: null, q4: null, q5: null, q6: null });

  // Hearing: whisper test
  const [hearL, setHearL] = useState<string | null>(null);
  const [hearR, setHearR] = useState<string | null>(null);
  const [whisperNum] = useState(() => Math.floor(Math.random() * 90) + 10);

  // Vision: finger counting
  const [fingerCount, setFingerCount] = useState(() => Math.floor(Math.random() * 5) + 1);
  const [visL, setVisL] = useState<boolean | null>(null);
  const [visR, setVisR] = useState<boolean | null>(null);

  // Mood: GDS-4
  const [gds, setGds] = useState<Record<string, boolean | null>>({ g1: null, g2: null, g3: null, g4: null });

  // ── Auto-calc: cognition ───────────────────────────────────────
  useEffect(() => {
    if (wordsRecalled !== null && orientationCorrect !== null) {
      const allCorrect = wordsRecalled === 3 && orientationCorrect;
      updateForm("cognitionStatus", allCorrect ? "Normal" : "Impaired");
    }
  }, [wordsRecalled, orientationCorrect]);

  // ── Auto-calc: TUG ────────────────────────────────────────────
  useEffect(() => {
    const sec = parseFloat(form.tugTime);
    if (!isNaN(sec) && sec > 0) {
      if (sec <= 12) updateForm("locomotionStatus", "Normal");
      else if (sec <= 20) updateForm("locomotionStatus", "Mild Limitation");
      else if (sec <= 30) updateForm("locomotionStatus", "Moderate Limitation");
      else updateForm("locomotionStatus", "Severe Limitation");
    }
  }, [form.tugTime]);

  // ── Auto-calc: MNA-SF ─────────────────────────────────────────
  useEffect(() => {
    const vals = Object.values(mna);
    if (vals.every((v) => v !== null)) {
      const total = vals.reduce((s, v) => s! + (v ?? 0), 0)!;
      updateForm("mnaScore", String(total));
      if (total >= 12) updateForm("vitalityStatus", "Normal");
      else if (total >= 8) updateForm("vitalityStatus", "At Risk");
      else updateForm("vitalityStatus", "Malnourished");
    }
  }, [mna]);

  // ── Auto-calc: hearing ─────────────────────────────────────────
  useEffect(() => {
    if (hearL) updateForm("hearingLeft", hearL === "heard" ? "Normal" : hearL === "partial" ? "Mild Loss" : "Moderate Loss");
    if (hearR) updateForm("hearingRight", hearR === "heard" ? "Normal" : hearR === "partial" ? "Mild Loss" : "Moderate Loss");
  }, [hearL, hearR]);

  // ── Auto-calc: vision ──────────────────────────────────────────
  useEffect(() => {
    if (visL !== null) updateForm("visionLeft", visL ? "Normal" : "Moderate Impairment");
    if (visR !== null) updateForm("visionRight", visR ? "Normal" : "Moderate Impairment");
  }, [visL, visR]);

  // ── Auto-calc: GDS-4 ──────────────────────────────────────────
  useEffect(() => {
    if (Object.values(gds).every((v) => v !== null)) {
      let score = 0;
      if (gds.g1 === false) score++; // not satisfied → depressive
      if (gds.g2 === true)  score++; // feels empty
      if (gds.g3 === true)  score++; // afraid
      if (gds.g4 === false) score++; // not happy → depressive
      updateForm("gdsScore", String(score));
      if (score <= 1) updateForm("moodStatus", "Normal");
      else if (score <= 2) updateForm("moodStatus", "Possible Depression");
      else updateForm("moodStatus", "Depression");
    }
  }, [gds]);

  // ── Auto-calc: BMI ─────────────────────────────────────────────
  useEffect(() => {
    const w = parseFloat(form.weight), h = parseFloat(form.height);
    if (!isNaN(w) && !isNaN(h) && h > 0) updateForm("bmi", (w / ((h / 100) ** 2)).toFixed(1));
  }, [form.weight, form.height]);

  // ── TUG Timer controls ─────────────────────────────────────────
  const startTimer = useCallback(() => {
    setTimerMs(0);
    setTimerRunning(true);
    Vibration.vibrate(100);
    timerStart.current = Date.now();
    timerRef.current = setInterval(() => setTimerMs(Date.now() - timerStart.current), 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    Vibration.vibrate(200);
    const sec = ((Date.now() - timerStart.current) / 1000).toFixed(1);
    updateForm("tugTime", sec);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerMs(0);
    updateForm("tugTime", "");
    updateForm("locomotionStatus", "Not Assessed");
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Load previous assessments ──────────────────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const token = await getAccessToken();
        if (!token || !params.patientId) return;
        const res = await fetch(`${API}/api/patients/${params.patientId}/assessments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.assessments || []);
        }
      } catch (err) {
        console.error("Load history error:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [params.patientId]);

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not authenticated");

      const body: any = {};
      if (form.cognitionScore) body.cognitionScore = Number(form.cognitionScore);
      if (form.cognitionStatus !== "Not Assessed") body.cognitionStatus = form.cognitionStatus;
      if (form.cognitionNotes) body.cognitionNotes = form.cognitionNotes;
      if (form.tugTime) body.tugTime = Number(form.tugTime);
      if (form.walkingAid) body.walkingAid = form.walkingAid;
      if (form.locomotionStatus !== "Not Assessed") body.locomotionStatus = form.locomotionStatus;
      if (form.locomotionNotes) body.locomotionNotes = form.locomotionNotes;
      if (form.mnaScore) body.mnaScore = Number(form.mnaScore);
      if (form.weight) body.weight = Number(form.weight);
      if (form.height) body.height = Number(form.height);
      if (form.bmi) body.bmi = Number(form.bmi);
      if (form.vitalityStatus !== "Not Assessed") body.vitalityStatus = form.vitalityStatus;
      if (form.vitalityNotes) body.vitalityNotes = form.vitalityNotes;
      if (form.hearingLeft !== "Not Assessed") body.hearingLeft = form.hearingLeft;
      if (form.hearingRight !== "Not Assessed") body.hearingRight = form.hearingRight;
      body.hearingAid = form.hearingAid;
      if (form.hearingNotes) body.hearingNotes = form.hearingNotes;
      if (form.visionLeft !== "Not Assessed") body.visionLeft = form.visionLeft;
      if (form.visionRight !== "Not Assessed") body.visionRight = form.visionRight;
      body.glassesUsed = form.glassesUsed;
      if (form.visionNotes) body.visionNotes = form.visionNotes;
      if (form.gdsScore) body.gdsScore = Number(form.gdsScore);
      if (form.moodStatus !== "Not Assessed") body.moodStatus = form.moodStatus;
      if (form.moodNotes) body.moodNotes = form.moodNotes;
      if (form.careRecommendations) body.careRecommendations = form.careRecommendations;
      if (form.followUpDate) body.followUpDate = form.followUpDate;
      body.referralNeeded = form.referralNeeded;
      if (form.referralDetails) body.referralDetails = form.referralDetails;

      const res = await fetch(`${API}/api/patients/${params.patientId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed");
      }

      Alert.alert(t("brand"), t("success"), [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t("brand"), err.message || t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status chip selector (bilingual) ───────────────────────────
  const StatusChips = ({ statuses, value, onChange }: { statuses: string[]; value: string; onChange: (v: string) => void }) => (
    <View style={styles.chipRow}>
      {statuses.map((s) => {
        const isActive = value === s;
        const chipColor = s === "Not Assessed" ? "#9CA3AF" : s.includes("Normal") ? "#10B981" : s.includes("Mild") || s.includes("At Risk") || s.includes("Possible") ? "#F59E0B" : "#EF4444";
        return (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={[styles.statusChip, isActive && { backgroundColor: chipColor + "20", borderColor: chipColor }]}>
            <Text style={[styles.statusChipText, isActive && { color: chipColor, fontFamily: "Poppins-SemiBold" }]}>{sl(s)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Reusable option button ─────────────────────────────────────
  const OptBtn = ({ label, sel, onPress, color = "#0E7C61" }: { label: string; sel: boolean; onPress: () => void; color?: string }) => (
    <TouchableOpacity onPress={onPress} style={[styles.optBtn, sel && { backgroundColor: color + "15", borderColor: color }]} activeOpacity={0.7}>
      {sel && <Ionicons name="checkmark-circle" size={sc(16)} color={color} style={{ marginRight: sc(5) }} />}
      <Text style={[styles.optBtnText, sel && { color, fontFamily: "Poppins-SemiBold" }]}>{label}</Text>
    </TouchableOpacity>
  );

  // ── Accordion header ────────────────────────────────────────────
  const DomainHeader = ({ domain }: { domain: typeof DOMAIN_CONFIG[0] }) => {
    const isOpen = expanded === domain.key;
    return (
      <TouchableOpacity style={[styles.domainHeader, isOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} onPress={() => setExpanded(isOpen ? null : domain.key)} activeOpacity={0.7}>
        <View style={[styles.domainIcon, { backgroundColor: domain.color + "15" }]}>
          <Ionicons name={domain.icon as any} size={sc(22)} color={domain.color} />
        </View>
        <View style={styles.domainHeaderText}>
          <Text style={styles.domainTitle}>{t(domain.key)}</Text>
          <Text style={styles.domainDesc}>{t(domain.key + "Desc")}</Text>
        </View>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={sc(20)} color="#999" />
      </TouchableOpacity>
    );
  };

  // ── Word set for current language ──────────────────────────────
  const words = WORD_SETS[lang][wordSetIdx];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={sc(22)} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t("assessment")}</Text>
            <Text style={styles.headerPatient}>{params.patientName || ""}</Text>
          </View>
          <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.headerLangBtn}>
            <Ionicons name="language-outline" size={sc(18)} color="#fff" />
            <Text style={styles.headerLangText}>{lang === "en" ? "සිං" : "EN"}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── 1. Cognition ───────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[0]} />
          {expanded === "cognition" && (
            <View style={styles.domainBody}>
              {/* Word Recall Test */}
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("wordRecallTest")}</Text>
                <Text style={styles.testInstr}>{t("wordRecallInstr")}</Text>

                {!recallPhase ? (
                  <>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#6366F1" }]} onPress={() => setWordsVisible(!wordsVisible)}>
                      <Ionicons name={wordsVisible ? "eye-off" : "eye"} size={sc(20)} color="#fff" />
                      <Text style={styles.actionBtnText}>{wordsVisible ? t("hideWords") : t("showWords")}</Text>
                    </TouchableOpacity>
                    {wordsVisible && (
                      <View style={styles.wordRow}>
                        {words.map((w: string, i: number) => (
                          <View key={i} style={styles.wordBadge}>
                            <Text style={styles.wordNum}>{i + 1}</Text>
                            <Text style={styles.wordText}>{w}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#4F46E5", marginTop: sc(10) }]} onPress={() => { setWordsVisible(false); setRecallPhase(true); }}>
                      <Ionicons name="help-circle-outline" size={sc(20)} color="#fff" />
                      <Text style={styles.actionBtnText}>{t("askRecall")}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.testInstr}>{t("recallInstr")}</Text>
                    <View style={styles.wordRow}>
                      {words.map((w: string, i: number) => (
                        <View key={i} style={[styles.wordBadge, { opacity: 0.4 }]}>
                          <Text style={styles.wordNum}>{i + 1}</Text>
                          <Text style={styles.wordText}>{w}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={[styles.fieldLabel, { marginTop: sc(12) }]}>{t("wordsRecalled")}</Text>
                    <View style={styles.recallRow}>
                      {[0, 1, 2, 3].map((n) => (
                        <TouchableOpacity key={n} style={[styles.recallBtn, wordsRecalled === n && { backgroundColor: "#6366F1", borderColor: "#6366F1" }]} onPress={() => setWordsRecalled(n)}>
                          <Text style={[styles.recallBtnText, wordsRecalled === n && { color: "#fff" }]}>{n} {t("of3")}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Orientation in Time and Space */}
              <View style={[styles.testBox, { marginTop: sc(12) }]}>
                <Text style={styles.testTitle}>{t("orientationTest")}</Text>
                <Text style={styles.testInstr}>{t("orientationInstr")}</Text>
                <View style={styles.row}>
                  <OptBtn label={t("yesCorrect")} sel={orientationCorrect === true} onPress={() => setOrientationCorrect(true)} color="#10B981" />
                  <OptBtn label={t("noWrong")} sel={orientationCorrect === false} onPress={() => setOrientationCorrect(false)} color="#EF4444" />
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <View style={styles.row}>
                <OptBtn label="Yes – Normal" sel={form.cognitionStatus === "Normal"} onPress={() => updateForm("cognitionStatus", "Normal")} color="#10B981" />
                <OptBtn label="No – Impaired" sel={form.cognitionStatus === "Impaired"} onPress={() => updateForm("cognitionStatus", "Impaired")} color="#EF4444" />
              </View>
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.cognitionNotes} onChangeText={(v) => updateForm("cognitionNotes", v)} placeholder={t("notes")} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 2. Locomotion (TUG Timer) ──────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[1]} />
          {expanded === "locomotion" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("tugTest")}</Text>
                <Text style={styles.testInstr}>{t("tugInstr")}</Text>
                <View style={styles.timerDisplay}>
                  <Text style={styles.timerNumber}>{(timerMs / 1000).toFixed(1)}</Text>
                  <Text style={styles.timerUnit}>{t("seconds")}</Text>
                </View>
                <View style={styles.timerRow}>
                  {!timerRunning ? (
                    <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#10B981" }]} onPress={startTimer}>
                      <Ionicons name="play" size={sc(22)} color="#fff" />
                      <Text style={styles.timerBtnText}>{t("startTimer")}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#EF4444" }]} onPress={stopTimer}>
                      <Ionicons name="stop" size={sc(22)} color="#fff" />
                      <Text style={styles.timerBtnText}>{t("stopTimer")}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#6B7280" }]} onPress={resetTimer}>
                    <Ionicons name="refresh" size={sc(20)} color="#fff" />
                    <Text style={styles.timerBtnText}>{t("resetTimer")}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t("walkingAidLabel")}</Text>
              <View style={styles.chipRow}>
                {([["", "aidNone"], ["Cane", "aidCane"], ["Walker", "aidWalker"], ["Wheelchair", "aidWheelchair"]] as const).map(([val, key]) => (
                  <TouchableOpacity key={key} onPress={() => updateForm("walkingAid", val)} style={[styles.statusChip, form.walkingAid === val && { backgroundColor: "#F59E0B20", borderColor: "#F59E0B" }]}>
                    <Text style={[styles.statusChipText, form.walkingAid === val && { color: "#F59E0B", fontFamily: "Poppins-SemiBold" }]}>{t(key)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={LOCOMOTION_STATUSES} value={form.locomotionStatus} onChange={(v) => updateForm("locomotionStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.locomotionNotes} onChangeText={(v) => updateForm("locomotionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 3. Vitality / Nutrition (MNA-SF) ───── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[2]} />
          {expanded === "vitality" && (
            <View style={styles.domainBody}>
              {/* Q1 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ1")}</Text>
                <OptBtn label={t("mnaQ1_0")} sel={mna.q1 === 0} onPress={() => setMna(p => ({ ...p, q1: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ1_1")} sel={mna.q1 === 1} onPress={() => setMna(p => ({ ...p, q1: 1 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ1_2")} sel={mna.q1 === 2} onPress={() => setMna(p => ({ ...p, q1: 2 }))} color="#10B981" />
              </View>
              {/* Q2 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ2")}</Text>
                <OptBtn label={t("mnaQ2_0")} sel={mna.q2 === 0} onPress={() => setMna(p => ({ ...p, q2: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ2_1")} sel={mna.q2 === 1} onPress={() => setMna(p => ({ ...p, q2: 1 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ2_2")} sel={mna.q2 === 2} onPress={() => setMna(p => ({ ...p, q2: 2 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ2_3")} sel={mna.q2 === 3} onPress={() => setMna(p => ({ ...p, q2: 3 }))} color="#10B981" />
              </View>
              {/* Q3 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ3")}</Text>
                <OptBtn label={t("mnaQ3_0")} sel={mna.q3 === 0} onPress={() => setMna(p => ({ ...p, q3: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ3_1")} sel={mna.q3 === 1} onPress={() => setMna(p => ({ ...p, q3: 1 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ3_2")} sel={mna.q3 === 2} onPress={() => setMna(p => ({ ...p, q3: 2 }))} color="#10B981" />
              </View>
              {/* Q4 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ4")}</Text>
                <OptBtn label={t("mnaQ4_0")} sel={mna.q4 === 0} onPress={() => setMna(p => ({ ...p, q4: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ4_2")} sel={mna.q4 === 2} onPress={() => setMna(p => ({ ...p, q4: 2 }))} color="#10B981" />
              </View>
              {/* Q5 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ5")}</Text>
                <OptBtn label={t("mnaQ5_0")} sel={mna.q5 === 0} onPress={() => setMna(p => ({ ...p, q5: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ5_1")} sel={mna.q5 === 1} onPress={() => setMna(p => ({ ...p, q5: 1 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ5_2")} sel={mna.q5 === 2} onPress={() => setMna(p => ({ ...p, q5: 2 }))} color="#10B981" />
              </View>
              {/* Q6 */}
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("mnaQ6")}</Text>
                <OptBtn label={t("mnaQ6_0")} sel={mna.q6 === 0} onPress={() => setMna(p => ({ ...p, q6: 0 }))} color="#EF4444" />
                <OptBtn label={t("mnaQ6_1")} sel={mna.q6 === 1} onPress={() => setMna(p => ({ ...p, q6: 1 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ6_2")} sel={mna.q6 === 2} onPress={() => setMna(p => ({ ...p, q6: 2 }))} color="#F59E0B" />
                <OptBtn label={t("mnaQ6_3")} sel={mna.q6 === 3} onPress={() => setMna(p => ({ ...p, q6: 3 }))} color="#10B981" />
              </View>

              {form.mnaScore !== "" && (
                <View style={styles.scoreBadge}>
                  <Ionicons name="calculator-outline" size={sc(18)} color="#10B981" />
                  <Text style={styles.scoreText}>{t("mnaTotal")}: {form.mnaScore}/14</Text>
                </View>
              )}
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("weight")}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={form.weight} onChangeText={(v) => updateForm("weight", v)} placeholderTextColor="#bbb" />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("height")}</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={form.height} onChangeText={(v) => updateForm("height", v)} placeholderTextColor="#bbb" />
                </View>
              </View>
              {form.bmi !== "" && <View style={styles.scoreBadge}><Text style={styles.scoreText}>{t("bmi")}: {form.bmi}</Text></View>}
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={VITALITY_STATUSES} value={form.vitalityStatus} onChange={(v) => updateForm("vitalityStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.vitalityNotes} onChangeText={(v) => updateForm("vitalityNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 4. Hearing (Whisper Test) ──────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[3]} />
          {expanded === "hearing" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("hearingTest")}</Text>
                <Text style={styles.testInstr}>{t("hearingInstr")}</Text>

                <View style={styles.whisperDisplay}>
                  <Text style={styles.whisperLabel}>{t("whisperNum")}</Text>
                  <Text style={styles.whisperNumber}>{whisperNum}</Text>
                </View>

                <Text style={[styles.fieldLabel, { marginTop: sc(16), fontSize: sc(15), fontFamily: "Poppins-SemiBold" }]}>{t("leftEar")}</Text>
                <View style={styles.btnRow}>
                  <OptBtn label={t("couldHear")} sel={hearL === "heard"} onPress={() => setHearL("heard")} color="#10B981" />
                  <OptBtn label={t("partially")} sel={hearL === "partial"} onPress={() => setHearL("partial")} color="#F59E0B" />
                  <OptBtn label={t("couldNotHear")} sel={hearL === "not_heard"} onPress={() => setHearL("not_heard")} color="#EF4444" />
                </View>
                <Text style={[styles.fieldLabel, { marginTop: sc(12), fontSize: sc(15), fontFamily: "Poppins-SemiBold" }]}>{t("rightEar")}</Text>
                <View style={styles.btnRow}>
                  <OptBtn label={t("couldHear")} sel={hearR === "heard"} onPress={() => setHearR("heard")} color="#10B981" />
                  <OptBtn label={t("partially")} sel={hearR === "partial"} onPress={() => setHearR("partial")} color="#F59E0B" />
                  <OptBtn label={t("couldNotHear")} sel={hearR === "not_heard"} onPress={() => setHearR("not_heard")} color="#EF4444" />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("hearingAid")}</Text>
                <Switch value={form.hearingAid} onValueChange={(v) => updateForm("hearingAid", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("status")} ({t("left")})</Text>
              <StatusChips statuses={HEARING_STATUSES} value={form.hearingLeft} onChange={(v) => updateForm("hearingLeft", v)} />
              <Text style={styles.fieldLabel}>{t("status")} ({t("right")})</Text>
              <StatusChips statuses={HEARING_STATUSES} value={form.hearingRight} onChange={(v) => updateForm("hearingRight", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.hearingNotes} onChangeText={(v) => updateForm("hearingNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 5. Vision (Finger Counting) ────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[4]} />
          {expanded === "vision" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("visionTest")}</Text>
                <Text style={styles.testInstr}>{t("visionInstr")}</Text>

                <View style={styles.fingerDisplay}>
                  <Text style={styles.fingerNumber}>{fingerCount}</Text>
                  <Text style={styles.fingerLabel}>{t("howMany")}</Text>
                </View>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]} onPress={() => setFingerCount(Math.floor(Math.random() * 5) + 1)}>
                  <Ionicons name="shuffle" size={sc(20)} color="#fff" />
                  <Text style={styles.actionBtnText}>{t("newFingers")}</Text>
                </TouchableOpacity>

                <Text style={[styles.fieldLabel, { marginTop: sc(16), fontSize: sc(15), fontFamily: "Poppins-SemiBold" }]}>{t("leftEye")}</Text>
                <View style={styles.btnRow}>
                  <OptBtn label={t("correct")} sel={visL === true} onPress={() => setVisL(true)} color="#10B981" />
                  <OptBtn label={t("incorrect")} sel={visL === false} onPress={() => setVisL(false)} color="#EF4444" />
                </View>
                <Text style={[styles.fieldLabel, { marginTop: sc(12), fontSize: sc(15), fontFamily: "Poppins-SemiBold" }]}>{t("rightEye")}</Text>
                <View style={styles.btnRow}>
                  <OptBtn label={t("correct")} sel={visR === true} onPress={() => setVisR(true)} color="#10B981" />
                  <OptBtn label={t("incorrect")} sel={visR === false} onPress={() => setVisR(false)} color="#EF4444" />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("glasses")}</Text>
                <Switch value={form.glassesUsed} onValueChange={(v) => updateForm("glassesUsed", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("status")} ({t("left")})</Text>
              <StatusChips statuses={VISION_STATUSES} value={form.visionLeft} onChange={(v) => updateForm("visionLeft", v)} />
              <Text style={styles.fieldLabel}>{t("status")} ({t("right")})</Text>
              <StatusChips statuses={VISION_STATUSES} value={form.visionRight} onChange={(v) => updateForm("visionRight", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.visionNotes} onChangeText={(v) => updateForm("visionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 6. Mood / Depression (GDS-4) ───────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[5]} />
          {expanded === "mood" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("moodTest")}</Text>
                <Text style={styles.testInstr}>{t("moodInstr")}</Text>

                {/* Q1: Satisfied? No = depressive */}
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>1. {t("gds1")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g1: true }))} style={[styles.gdsBtn, gds.g1 === true && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, gds.g1 === true && { color: "#10B981" }]}>{t("gdsYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g1: false }))} style={[styles.gdsBtn, gds.g1 === false && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, gds.g1 === false && { color: "#EF4444" }]}>{t("gdsNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Q2: Empty? Yes = depressive */}
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>2. {t("gds2")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g2: true }))} style={[styles.gdsBtn, gds.g2 === true && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, gds.g2 === true && { color: "#EF4444" }]}>{t("gdsYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g2: false }))} style={[styles.gdsBtn, gds.g2 === false && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, gds.g2 === false && { color: "#10B981" }]}>{t("gdsNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Q3: Afraid? Yes = depressive */}
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>3. {t("gds3")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g3: true }))} style={[styles.gdsBtn, gds.g3 === true && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, gds.g3 === true && { color: "#EF4444" }]}>{t("gdsYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g3: false }))} style={[styles.gdsBtn, gds.g3 === false && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, gds.g3 === false && { color: "#10B981" }]}>{t("gdsNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* Q4: Happy? No = depressive */}
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>4. {t("gds4")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g4: true }))} style={[styles.gdsBtn, gds.g4 === true && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, gds.g4 === true && { color: "#10B981" }]}>{t("gdsYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setGds(p => ({ ...p, g4: false }))} style={[styles.gdsBtn, gds.g4 === false && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, gds.g4 === false && { color: "#EF4444" }]}>{t("gdsNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {form.gdsScore !== "" && (
                <View style={styles.scoreBadge}>
                  <Ionicons name="calculator-outline" size={sc(18)} color="#EC4899" />
                  <Text style={styles.scoreText}>{t("gdsScore")}: {form.gdsScore}/4</Text>
                </View>
              )}
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={MOOD_STATUSES} value={form.moodStatus} onChange={(v) => updateForm("moodStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.moodNotes} onChangeText={(v) => updateForm("moodNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 7. Care Plan ───────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[6]} />
          {expanded === "carePlan" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("recommendations")}</Text>
              <TextInput style={[styles.input, styles.multiline, { minHeight: sc(80) }]} multiline value={form.careRecommendations} onChangeText={(v) => updateForm("careRecommendations", v)} placeholderTextColor="#bbb" />
              <Text style={styles.fieldLabel}>{t("followUp")} (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} value={form.followUpDate} onChangeText={(v) => updateForm("followUpDate", v)} placeholder="2026-04-15" placeholderTextColor="#bbb" />
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("referralNeeded")}</Text>
                <Switch value={form.referralNeeded} onValueChange={(v) => updateForm("referralNeeded", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              {form.referralNeeded && (
                <>
                  <Text style={styles.fieldLabel}>{t("referralDetails")}</Text>
                  <TextInput style={[styles.input, styles.multiline]} multiline value={form.referralDetails} onChangeText={(v) => updateForm("referralDetails", v)} placeholderTextColor="#bbb" />
                </>
              )}
            </View>
          )}
        </View>

        {/* ─── Previous assessments ───────────────── */}
        <View style={styles.historySection}>
          <View style={styles.historyTitleRow}>
            <Ionicons name="time-outline" size={sc(18)} color="#0E7C61" />
            <Text style={styles.historyTitle}>{t("history")}</Text>
            {history.length > 0 && (
              <View style={styles.historyCountBadge}>
                <Text style={styles.historyCountText}>{history.length}</Text>
              </View>
            )}
          </View>

          {loadingHistory ? (
            <ActivityIndicator color="#0E7C61" style={{ marginTop: sc(12) }} />
          ) : history.length === 0 ? (
            <View style={styles.historyEmptyBox}>
              <Ionicons name="clipboard-outline" size={sc(32)} color="#d1d5db" />
              <Text style={styles.historyEmpty}>{t("noHistory")}</Text>
            </View>
          ) : (
            history.slice(0, 6).map((a, i) => {
              const domainRows: { icon: string; color: string; label: string; status: string; score?: string }[] = [];
              if (a.cognitionStatus && a.cognitionStatus !== "Not Assessed")
                domainRows.push({ icon: "bulb-outline", color: "#6366F1", label: t("cognition"), status: sl(a.cognitionStatus), score: a.cognitionScore != null ? `${a.cognitionScore}/30` : undefined });
              if (a.locomotionStatus && a.locomotionStatus !== "Not Assessed")
                domainRows.push({ icon: "walk-outline", color: "#F59E0B", label: t("locomotion"), status: sl(a.locomotionStatus), score: a.tugTime != null ? `${a.tugTime}s TUG` : undefined });
              if (a.vitalityStatus && a.vitalityStatus !== "Not Assessed")
                domainRows.push({ icon: "nutrition-outline", color: "#10B981", label: t("vitality"), status: sl(a.vitalityStatus), score: a.mnaScore != null ? `MNA ${a.mnaScore}/14` : undefined });
              if (a.hearingLeft && a.hearingLeft !== "Not Assessed")
                domainRows.push({ icon: "ear-outline", color: "#3B82F6", label: t("hearing"), status: `L: ${sl(a.hearingLeft)} · R: ${sl(a.hearingRight || "Not Assessed")}` });
              if (a.visionLeft && a.visionLeft !== "Not Assessed")
                domainRows.push({ icon: "eye-outline", color: "#8B5CF6", label: t("vision"), status: `L: ${sl(a.visionLeft)} · R: ${sl(a.visionRight || "Not Assessed")}` });
              if (a.moodStatus && a.moodStatus !== "Not Assessed")
                domainRows.push({ icon: "happy-outline", color: "#EC4899", label: t("mood"), status: sl(a.moodStatus), score: a.gdsScore != null ? `GDS ${a.gdsScore}/4` : undefined });

              const statusColor = (s: string) =>
                s.includes("Normal") ? "#10B981" :
                s.includes("Mild") || s.includes("At Risk") || s.includes("Possible") ? "#F59E0B" :
                s.includes("Severe") || s.includes("Depression") || s.includes("Malnourished") ? "#EF4444" :
                "#6B7280";

              const fmtDate = (iso: string) => {
                try {
                  const d = new Date(iso);
                  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                } catch { return iso; }
              };

              return (
                <View key={a._id || i} style={styles.historyCard}>
                  {/* Card header */}
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardHeaderLeft}>
                      <View style={styles.historyIndexBadge}>
                        <Text style={styles.historyIndexText}>{history.length - i}</Text>
                      </View>
                      <View>
                        <Text style={styles.historyDateText}>{fmtDate(a.createdAt)}</Text>
                        <Text style={styles.historySubText}>
                          {domainRows.length} domain{domainRows.length !== 1 ? "s" : ""} assessed
                        </Text>
                      </View>
                    </View>
                    {a.referralNeeded && (
                      <View style={styles.referralBadge}>
                        <Ionicons name="arrow-forward-circle-outline" size={sc(13)} color="#DC2626" />
                        <Text style={styles.referralBadgeText}>Referral</Text>
                      </View>
                    )}
                  </View>

                  {/* Domain results */}
                  {domainRows.length > 0 && (
                    <View style={styles.domainResultGrid}>
                      {domainRows.map((d, di) => {
                        const sc2 = statusColor(d.status);
                        return (
                          <View key={di} style={styles.domainResultRow}>
                            <View style={[styles.domainResultIcon, { backgroundColor: d.color + "15" }]}>
                              <Ionicons name={d.icon as any} size={sc(15)} color={d.color} />
                            </View>
                            <View style={styles.domainResultText}>
                              <Text style={styles.domainResultLabel}>{d.label}</Text>
                              <Text style={[styles.domainResultStatus, { color: sc2 }]}>{d.status}</Text>
                            </View>
                            {d.score && (
                              <View style={[styles.domainResultScore, { backgroundColor: d.color + "12" }]}>
                                <Text style={[styles.domainResultScoreText, { color: d.color }]}>{d.score}</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {/* Vitals row */}
                  {(a.weight || a.height || a.bmi) && (
                    <View style={styles.vitalsRow}>
                      {a.weight && <View style={styles.vitalChip}><Text style={styles.vitalChipText}>⚖ {a.weight} kg</Text></View>}
                      {a.height && <View style={styles.vitalChip}><Text style={styles.vitalChipText}>↕ {a.height} cm</Text></View>}
                      {a.bmi && <View style={styles.vitalChip}><Text style={styles.vitalChipText}>BMI {a.bmi}</Text></View>}
                      {a.hearingAid && <View style={styles.vitalChip}><Text style={styles.vitalChipText}>🔉 Hearing Aid</Text></View>}
                      {a.glassesUsed && <View style={styles.vitalChip}><Text style={styles.vitalChipText}>👓 Glasses</Text></View>}
                    </View>
                  )}

                  {/* Care plan summary */}
                  {(a.careRecommendations || a.followUpDate) && (
                    <View style={styles.carePlanBox}>
                      <View style={styles.carePlanHeader}>
                        <Ionicons name="clipboard-outline" size={sc(13)} color="#0E7C61" />
                        <Text style={styles.carePlanTitle}>Care Plan</Text>
                      </View>
                      {a.careRecommendations ? (
                        <Text style={styles.carePlanText} numberOfLines={3}>{a.careRecommendations}</Text>
                      ) : null}
                      {a.followUpDate ? (
                        <View style={styles.followUpRow}>
                          <Ionicons name="calendar-outline" size={sc(12)} color="#0E7C61" />
                          <Text style={styles.followUpText}>Follow-up: {a.followUpDate}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* ─── Submit button ──────────────────────── */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
          <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.submitGradient}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={sc(22)} color="#fff" />
                <Text style={styles.submitText}>{t("submit")}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: sc(40) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingTop: Platform.OS === "ios" ? vs(54) : vs(42), paddingHorizontal: sc(16), paddingBottom: sc(16) },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { padding: sc(8), backgroundColor: "rgba(255,255,255,0.2)", borderRadius: sc(12) },
  headerCenter: { flex: 1, marginLeft: sc(12) },
  headerTitle: { color: "#fff", fontSize: sc(18), fontFamily: "Poppins-Bold" },
  headerPatient: { color: "rgba(255,255,255,0.85)", fontSize: sc(13), fontFamily: "Poppins-Regular" },
  headerLangBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: sc(10), paddingVertical: sc(5), borderRadius: sc(16), gap: sc(4) },
  headerLangText: { color: "#fff", fontSize: sc(12), fontFamily: "Poppins-SemiBold" },
  scrollContent: { padding: sc(16) },
  domainCard: { backgroundColor: "#fff", borderRadius: sc(16), marginBottom: sc(12), overflow: "hidden", ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 }, android: { elevation: 2 } }) },
  domainHeader: { flexDirection: "row", alignItems: "center", padding: sc(16), borderRadius: sc(16) },
  domainIcon: { width: sc(44), height: sc(44), borderRadius: sc(12), justifyContent: "center", alignItems: "center" },
  domainHeaderText: { flex: 1, marginLeft: sc(12), minWidth: 0 },
  domainTitle: { fontSize: sc(16), fontFamily: "Poppins-SemiBold", color: "#222", flexShrink: 1 },
  domainDesc: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#888", flexShrink: 1, lineHeight: sc(18) },
  domainBody: { paddingHorizontal: sc(16), paddingBottom: sc(16) },
  fieldLabel: { fontSize: sc(13), fontFamily: "Poppins-Medium", color: "#555", marginTop: sc(12), marginBottom: sc(6), flexShrink: 1, lineHeight: sc(20) },
  input: { backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e5e5e5", borderRadius: sc(10), paddingHorizontal: sc(14), paddingVertical: sc(10), fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#333" },
  multiline: { minHeight: sc(56), textAlignVertical: "top" },
  row: { flexDirection: "row", gap: sc(12) },
  halfField: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: sc(6), alignItems: "flex-start" },
  statusChip: { paddingHorizontal: sc(10), paddingVertical: sc(6), borderRadius: sc(8), borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fafafa", maxWidth: "100%", alignSelf: "flex-start" },
  statusChipText: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#777", flexShrink: 1, flexWrap: "wrap", textAlign: "center", lineHeight: sc(16) },
  switchRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: sc(12), gap: sc(12) },
  switchLabel: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#555", flex: 1, flexWrap: "wrap", lineHeight: sc(21) },

  // Interactive test styles
  testBox: { backgroundColor: "#F8FAFC", borderRadius: sc(12), padding: sc(14), borderWidth: 1, borderColor: "#E2E8F0" },
  testTitle: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#334155", marginBottom: sc(4), flexShrink: 1 },
  testInstr: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#64748B", lineHeight: sc(20), marginBottom: sc(12) },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: sc(8), paddingVertical: sc(12), borderRadius: sc(12), marginTop: sc(8), paddingHorizontal: sc(12) },
  actionBtnText: { color: "#fff", fontSize: sc(15), fontFamily: "Poppins-SemiBold", flexShrink: 1, textAlign: "center", lineHeight: sc(22) },
  optBtn: { flexDirection: "row", alignItems: "center", paddingVertical: sc(10), paddingHorizontal: sc(14), borderRadius: sc(10), borderWidth: 1.5, borderColor: "#d1d5db", backgroundColor: "#fafafa", marginBottom: sc(6), minWidth: 0, maxWidth: "100%", flexShrink: 1 },
  optBtnText: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#555", flexShrink: 1, flexWrap: "wrap", lineHeight: sc(21) },
  btnRow: { flexDirection: "row", flexWrap: "wrap", gap: sc(8) },

  // Word recall
  wordRow: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", gap: sc(10), marginTop: sc(12) },
  wordBadge: { backgroundColor: "#EEF2FF", borderRadius: sc(12), paddingHorizontal: sc(16), paddingVertical: sc(12), alignItems: "center", borderWidth: 1, borderColor: "#C7D2FE", minWidth: sc(80) },
  wordNum: { fontSize: sc(11), fontFamily: "Poppins-SemiBold", color: "#6366F1", marginBottom: sc(2) },
  wordText: { fontSize: sc(18), fontFamily: "Poppins-Bold", color: "#4338CA" },
  recallRow: { flexDirection: "row", gap: sc(8), marginTop: sc(8), flexWrap: "wrap" },
  recallBtn: { flex: 1, paddingVertical: sc(12), borderRadius: sc(10), borderWidth: 1.5, borderColor: "#d1d5db", alignItems: "center", backgroundColor: "#fafafa" },
  recallBtnText: { fontSize: sc(14), fontFamily: "Poppins-SemiBold", color: "#555", textAlign: "center", lineHeight: sc(20) },

  // TUG timer
  timerDisplay: { alignItems: "center", marginVertical: sc(16), backgroundColor: "#FFF7ED", borderRadius: sc(16), paddingVertical: sc(20), paddingHorizontal: sc(16), borderWidth: 1, borderColor: "#FED7AA" },
  timerNumber: { fontSize: sc(48), fontFamily: "Poppins-Bold", color: "#EA580C", fontVariant: ["tabular-nums"], includeFontPadding: false },
  timerUnit: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#9A3412", marginTop: sc(4) },
  timerRow: { flexDirection: "row", gap: sc(10), marginTop: sc(8), flexWrap: "wrap" },
  timerBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: sc(6), paddingVertical: sc(14), borderRadius: sc(12) },
  timerBtnText: { color: "#fff", fontSize: sc(15), fontFamily: "Poppins-SemiBold", flexShrink: 1, textAlign: "center", lineHeight: sc(22) },

  // MNA-SF questions
  questionBox: { marginBottom: sc(14), backgroundColor: "#fff", borderRadius: sc(10), padding: sc(12), borderWidth: 1, borderColor: "#E5E7EB" },
  questionText: { fontSize: sc(14), fontFamily: "Poppins-SemiBold", color: "#374151", marginBottom: sc(8), lineHeight: sc(22), flexShrink: 1 },

  // Hearing whisper
  whisperDisplay: { alignItems: "center", marginVertical: sc(12), backgroundColor: "#EFF6FF", borderRadius: sc(16), paddingVertical: sc(16), paddingHorizontal: sc(20), borderWidth: 1, borderColor: "#BFDBFE" },
  whisperLabel: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#2563EB", marginBottom: sc(4) },
  whisperNumber: { fontSize: sc(40), fontFamily: "Poppins-Bold", color: "#1E40AF" },

  // Vision finger count
  fingerDisplay: { alignItems: "center", marginVertical: sc(16), backgroundColor: "#F5F3FF", borderRadius: sc(16), paddingVertical: sc(20), paddingHorizontal: sc(24), borderWidth: 1, borderColor: "#DDD6FE" },
  fingerNumber: { fontSize: sc(64), fontFamily: "Poppins-Bold", color: "#7C3AED", includeFontPadding: false },
  fingerLabel: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#6D28D9", marginTop: sc(4) },

  // GDS-4
  gdsQuestion: { marginBottom: sc(14) },
  gdsQuestionText: { fontSize: sc(14), fontFamily: "Poppins-SemiBold", color: "#374151", marginBottom: sc(8), lineHeight: sc(22), flexShrink: 1 },
  gdsRow: { flexDirection: "row", gap: sc(10), flexWrap: "wrap" },
  gdsBtn: { flex: 1, paddingVertical: sc(12), borderRadius: sc(10), borderWidth: 1.5, borderColor: "#d1d5db", alignItems: "center", backgroundColor: "#fafafa" },
  gdsBtnText: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#555", textAlign: "center", lineHeight: sc(22) },

  // Score badge
  scoreBadge: { flexDirection: "row", alignItems: "center", gap: sc(8), marginTop: sc(12), backgroundColor: "#F0FDF4", borderRadius: sc(10), padding: sc(12), borderWidth: 1, borderColor: "#BBF7D0" },
  scoreText: { fontSize: sc(15), fontFamily: "Poppins-SemiBold", color: "#15803D" },

  // History
  historySection: { marginTop: sc(8), marginBottom: sc(16) },
  historyTitleRow: { flexDirection: "row", alignItems: "center", gap: sc(8), marginBottom: sc(12) },
  historyTitle: { fontSize: sc(16), fontFamily: "Poppins-SemiBold", color: "#333", flex: 1 },
  historyCountBadge: { backgroundColor: "#0E7C61", borderRadius: sc(10), paddingHorizontal: sc(8), paddingVertical: sc(2) },
  historyCountText: { color: "#fff", fontSize: sc(11), fontFamily: "Poppins-SemiBold" },
  historyEmptyBox: { alignItems: "center", paddingVertical: sc(24), gap: sc(8) },
  historyEmpty: { fontSize: sc(13), fontFamily: "Poppins-Regular", color: "#999" },

  historyCard: {
    backgroundColor: "#fff",
    borderRadius: sc(16),
    marginBottom: sc(12),
    overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  historyCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: sc(14), paddingBottom: sc(10), borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  historyCardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: sc(10) },
  historyIndexBadge: { width: sc(28), height: sc(28), borderRadius: sc(14), backgroundColor: "#0E7C61", justifyContent: "center", alignItems: "center" },
  historyIndexText: { color: "#fff", fontSize: sc(12), fontFamily: "Poppins-Bold" },
  historyDateText: { fontSize: sc(13), fontFamily: "Poppins-SemiBold", color: "#222" },
  historySubText: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#999", marginTop: 1 },
  referralBadge: { flexDirection: "row", alignItems: "center", gap: sc(4), backgroundColor: "#FEF2F2", paddingHorizontal: sc(8), paddingVertical: sc(3), borderRadius: sc(8) },
  referralBadgeText: { fontSize: sc(10), fontFamily: "Poppins-SemiBold", color: "#DC2626" },

  domainResultGrid: { paddingHorizontal: sc(12), paddingVertical: sc(8), gap: sc(2) },
  domainResultRow: { flexDirection: "row", alignItems: "center", paddingVertical: sc(6), gap: sc(10), borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  domainResultIcon: { width: sc(28), height: sc(28), borderRadius: sc(8), justifyContent: "center", alignItems: "center" },
  domainResultText: { flex: 1 },
  domainResultLabel: { fontSize: sc(11), fontFamily: "Poppins-Medium", color: "#888" },
  domainResultStatus: { fontSize: sc(13), fontFamily: "Poppins-SemiBold", marginTop: 1 },
  domainResultScore: { paddingHorizontal: sc(8), paddingVertical: sc(3), borderRadius: sc(8) },
  domainResultScoreText: { fontSize: sc(11), fontFamily: "Poppins-SemiBold" },

  vitalsRow: { flexDirection: "row", flexWrap: "wrap", gap: sc(6), paddingHorizontal: sc(12), paddingBottom: sc(10) },
  vitalChip: { backgroundColor: "#f3f4f6", paddingHorizontal: sc(10), paddingVertical: sc(4), borderRadius: sc(8) },
  vitalChipText: { fontSize: sc(11), fontFamily: "Poppins-Regular", color: "#555" },

  carePlanBox: { backgroundColor: "#f0faf6", marginHorizontal: sc(12), marginBottom: sc(12), borderRadius: sc(10), padding: sc(10), borderWidth: 1, borderColor: "#d1fae5" },
  carePlanHeader: { flexDirection: "row", alignItems: "center", gap: sc(5), marginBottom: sc(5) },
  carePlanTitle: { fontSize: sc(12), fontFamily: "Poppins-SemiBold", color: "#0E7C61" },
  carePlanText: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#374151", lineHeight: sc(18) },
  followUpRow: { flexDirection: "row", alignItems: "center", gap: sc(5), marginTop: sc(6) },
  followUpText: { fontSize: sc(12), fontFamily: "Poppins-Medium", color: "#0E7C61" },
  submitBtn: { marginTop: sc(8) },
  submitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: sc(8), paddingVertical: sc(16), borderRadius: sc(16) },
  submitText: { color: "#fff", fontSize: sc(17), fontFamily: "Poppins-Bold" },
});

export default PatientAssessment;
