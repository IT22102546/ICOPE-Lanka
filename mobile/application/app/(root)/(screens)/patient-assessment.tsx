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

const API = process.env.EXPO_PUBLIC_API_URL;
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
  locomotionDesc:  { en: "Chair rise test", si: "පුටු නැගිටීමේ පරීක්ෂණය" },
  vitality:        { en: "Vitality / Nutrition", si: "ජීවනකාරිත්වය / පෝෂණය" },
  vitalityDesc:    { en: "Weight loss & appetite screening", si: "බර අඩුවීම සහ ආහාර රුචිය පරීක්ෂණය" },
  hearing:         { en: "Hearing", si: "ශ්‍රවණය" },
  hearingDesc:     { en: "Whisper / Audiometry test", si: "Whisper / ශ්‍රවණ පරීක්ෂණය" },
  vision:          { en: "Vision", si: "දෘෂ්ටි" },
  visionDesc:      { en: "External eye check & visual acuity", si: "බාහිර ඇස් පරීක්ෂාව සහ දෘශ්‍ය තීව්‍රතාව" },
  mood:            { en: "Mood / Depression", si: "මනෝභාවය / මානසික අවපීඩනය" },
  moodDesc:        { en: "Depressive symptoms screening", si: "අවපීඩන රෝග ලක්ෂණ පරීක්ෂණය" },
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

  // locomotion – chair rise
  chairRiseTest:  { en: "Chair Rise Test", si: "පුටු නැගිටීමේ පරීක්ෂණය" },
  chairRiseInstr: { en: "Ask the patient to rise from a chair 5 times without using arms. Did they complete 5 rises within 14 seconds?", si: "රෝගියාට අත් නොගෙන පුටුවෙන් 5 වරක් නැගිටීමට කියන්න. ඔවුන් තත්පර 14 ක් ඇතුළත 5 වරක් නැගිටිය හැකිද?" },
  yes:            { en: "Yes – Completed", si: "ඔව් – සම්පූර්ණ කළා" },
  no:             { en: "No – Could not complete", si: "නැත – සම්පූර්ණ කළ නොහැකි" },

  // vitality – weight loss & appetite
  weightLossQ:    { en: "Weight loss: Have you unintentionally lost more than 3 kg over the last 3 months?", si: "බර අඩුවීම: පසුගිය මාස 3 තුළ ඔබ අනිච්ඡාවෙන් 3 kg ට වඩා බර අඩු වූවාද?" },
  appetiteLossQ:  { en: "Appetite loss: Have you experienced loss of appetite?", si: "ආහාර රුචිය: ඔබට ආහාර රුචිය නැතිව ගිය බවක් දැනෙනවාද?" },

  // hearing
  hearingTest:    { en: "Whisper Test / Screening Audiometry / Digits-triplet-in-noise", si: "Whisper / ශ්‍රවණ පරීක්ෂණය" },
  hearingInstr:   { en: "Stand behind the patient at arm's length. Whisper the number below. Ask what they heard.", si: "රෝගියාගේ පිටුපසින් අතේ දිගින් සිටින්න. පහත අංකය මෘදු ලෙස කියා ඔවුන්ට ඇසුණ දේ අසන්න." },
  whisperNum:     { en: "Whisper this number:", si: "මෙම අංකය මෘදු ලෙස කියන්න:" },
  hearPass:       { en: "Pass", si: "සමත්" },
  hearFail:       { en: "Fail", si: "අසමත්" },
  hearingAid:     { en: "Uses Hearing Aid", si: "ශ්‍රවණ උපකරණ භාවිතා කරයි" },

  // vision
  extEyeCheck:    { en: "1. External Eye Check", si: "1. බාහිර ඇස් පරීක්ෂාව" },
  visualAcuity:   { en: "2. Visual Acuity Test (WHO chart)", si: "2. දෘශ්‍ය තීව්‍රතා පරීක්ෂාව (WHO)" },
  distVision:     { en: "Distance vision (6/12 for each eye)", si: "දුර දෘෂ්ටිය (6/12 සෑම ඇසකටම)" },
  nearVision:     { en: "Near vision (N6 for both eyes)", si: "ළඟ දෘෂ්ටිය (N6 දෙකු ඇසටම)" },
  visionPass:     { en: "Pass", si: "සමත්" },
  visionFail:     { en: "Fail", si: "අසමත්" },
  glasses:        { en: "Uses Glasses/Spectacles", si: "කණ්ණාඩි භාවිතා කරයි" },

  // mood – 2 questions
  moodTest:       { en: "Depressive Symptoms Screening", si: "අවපීඩන රෝග ලක්ෂණ පරීක්ෂණය" },
  moodInstr:      { en: "Over the past 2 weeks, have you been bothered by either of the following?", si: "පසුගිය සති 2 තුළ පහත දේ ගැන ඔබට කරදර ඇතිද?" },
  moodQ1:         { en: "Feeling down, depressed or hopeless?", si: "කලකිරීමෙන්, ශෝකයෙන් හෝ බලාපොරොත්තු රහිතව?" },
  moodQ2:         { en: "Little interest or pleasure in doing things?", si: "දේවල් කිරීමේ රුචිය හෝ සතුට අඩු?" },
  moodYes:        { en: "Yes", si: "ඔව්" },
  moodNo:         { en: "No", si: "නැහැ" },

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
  const [showHistoryOnly, setShowHistoryOnly] = useState(false);

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

  // Locomotion: chair rise test
  const [chairRisePass, setChairRisePass] = useState<boolean | null>(null);

  // Locomotion: timer (14 seconds)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMs, setTimerMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStart = useRef(0);

  // Vitality: weight loss + appetite loss
  const [weightLoss, setWeightLoss] = useState<boolean | null>(null);
  const [appetiteLoss, setAppetiteLoss] = useState<boolean | null>(null);

  // Hearing: whisper test pass/fail
  const [whisperNum] = useState(() => Math.floor(Math.random() * 90) + 10);
  const [hearingPass, setHearingPass] = useState<boolean | null>(null);

  // Vision: letter E with angles
  const visionAngles = [0, 90, 270, 180];  // degrees: up, right, down, left
  const [visionAngleIdx, setVisionAngleIdx] = useState(0);
  const [visionResults, setVisionResults] = useState<boolean[]>([]);

  // Mood: 2 questions
  const [moodQ1, setMoodQ1] = useState<boolean | null>(null);
  const [moodQ2, setMoodQ2] = useState<boolean | null>(null);

  // ── Auto-calc: cognition ───────────────────────────────────────
  useEffect(() => {
    if (wordsRecalled !== null && orientationCorrect !== null) {
      const totalScore = wordsRecalled + (orientationCorrect ? 1 : 0);
      updateForm("cognitionScore", `${totalScore}/4`);
      if (totalScore === 4)      updateForm("cognitionStatus", "Normal");
      else if (totalScore === 3) updateForm("cognitionStatus", "Mild Impairment");
      else if (totalScore >= 1)  updateForm("cognitionStatus", "Moderate Impairment");
      else                       updateForm("cognitionStatus", "Severe Impairment");
    }
  }, [wordsRecalled, orientationCorrect]);

  // ── Auto-calc: locomotion ─────────────────────────────────────
  useEffect(() => {
    if (chairRisePass !== null) {
      updateForm("locomotionStatus", chairRisePass ? "Normal" : "Limitation");
    }
  }, [chairRisePass]);

  // ── Chair rise timer controls ──────────────────────────────────
  const startChairRiseTimer = useCallback(() => {
    setTimerMs(0);
    setTimerRunning(true);
    Vibration.vibrate(100);
    timerStart.current = Date.now();
    timerRef.current = setInterval(() => setTimerMs(Date.now() - timerStart.current), 100);
  }, []);

  const stopChairRiseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    Vibration.vibrate(200);
  }, []);

  const resetChairRiseTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerMs(0);
    updateForm("locomotionStatus", "Not Assessed");
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Auto-calc: vitality ────────────────────────────────────────
  useEffect(() => {
    if (weightLoss !== null && appetiteLoss !== null) {
      updateForm("vitalityStatus", (!weightLoss && !appetiteLoss) ? "Normal" : "At Risk");
    }
  }, [weightLoss, appetiteLoss]);

  // ── Auto-calc: hearing ─────────────────────────────────────────
  useEffect(() => {
    if (hearingPass !== null) {
      updateForm("hearingLeft", hearingPass ? "Normal" : "Hearing Loss");
      updateForm("hearingRight", hearingPass ? "Normal" : "Hearing Loss");
    }
  }, [hearingPass]);

  // ── Auto-calc: vision ──────────────────────────────────────────
  useEffect(() => {
    if (visionResults.length >= 4) {
      const pass = visionResults.slice(0, 4).filter(Boolean).length >= 3;
      updateForm("visionLeft", pass ? "Normal" : "Impairment");
      updateForm("visionRight", pass ? "Normal" : "Impairment");
    }
  }, [visionResults]);

  // ── Auto-calc: mood ────────────────────────────────────────────
  useEffect(() => {
    if (moodQ1 !== null && moodQ2 !== null) {
      updateForm("moodStatus", (!moodQ1 && !moodQ2) ? "Normal" : "Possible Depression");
    }
  }, [moodQ1, moodQ2]);

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
      if (form.cognitionScore) body.cognitionScore = form.cognitionScore;
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

  const RadioBtn = ({ label, sel, onPress, color = "#6366F1" }: { label: string; sel: boolean; onPress: () => void; color?: string }) => (
    <TouchableOpacity onPress={onPress} style={styles.radioRow} activeOpacity={0.7}>
      <View style={[styles.radioOuter, sel && { borderColor: color }]}>
        {sel && <View style={[styles.radioInner, { backgroundColor: color }]} />}
      </View>
      <Text style={[styles.radioLabel, sel && { color, fontFamily: "Poppins-SemiBold" }]}>{label}</Text>
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
            <Text style={styles.headerTitle}>{showHistoryOnly ? "Assessment History" : t("assessment")}</Text>
            <Text style={styles.headerPatient}>{params.patientName || ""}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: sc(8) }}>
            {!showHistoryOnly && (
              <TouchableOpacity onPress={() => setShowHistoryOnly(true)} style={styles.headerLangBtn}>
                <Ionicons name="time-outline" size={sc(18)} color="#fff" />
                <Text style={styles.headerLangText}>History</Text>
              </TouchableOpacity>
            )}
            {showHistoryOnly && (
              <TouchableOpacity onPress={() => setShowHistoryOnly(false)} style={styles.headerLangBtn}>
                <Ionicons name="add-circle-outline" size={sc(18)} color="#fff" />
                <Text style={styles.headerLangText}>New</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.headerLangBtn}>
              <Ionicons name="language-outline" size={sc(18)} color="#fff" />
              <Text style={styles.headerLangText}>{lang === "en" ? "සිං" : "EN"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {!showHistoryOnly ? (
          <>
            {/* ─── Assessment Form ───────────────────────── */}
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
                        <TouchableOpacity key={n} style={[styles.recallBtn, wordsRecalled === n && { backgroundColor: n === 3 ? "#10B981" : "#EF4444", borderColor: n === 3 ? "#10B981" : "#EF4444" }]} onPress={() => setWordsRecalled(n)}>
                          <Text style={[styles.recallBtnText, wordsRecalled === n && { color: "#fff" }]}>{n} {t("of3")}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.fieldLabel, { marginTop: sc(8) }]}>Result:</Text>
                    <Text style={[styles.scoreText, { color: wordsRecalled! > 0 ? "#10B981" : "#EF4444" }]}>{wordsRecalled} / 3 words recalled = {wordsRecalled} points</Text>
                  </>
                )}
              </View>

              {/* Orientation in Time and Space */}
              <View style={[styles.testBox, { marginTop: sc(12) }]}>
                <Text style={styles.testTitle}>{t("orientationTest")}</Text>
                <Text style={styles.testInstr}>{t("orientationInstr")}</Text>
                <RadioBtn label={t("yesCorrect")} sel={orientationCorrect === true} onPress={() => setOrientationCorrect(true)} color="#10B981" />
                <RadioBtn label={t("noWrong")} sel={orientationCorrect === false} onPress={() => setOrientationCorrect(false)} color="#EF4444" />
              </View>

              {form.cognitionScore !== "" && (
                <View style={styles.scoreBadge}>
                  <Ionicons name="calculator-outline" size={sc(18)} color="#6366F1" />
                  <Text style={styles.scoreText}>Score: {form.cognitionScore} (Word Recall + Orientation)</Text>
                </View>
              )}
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <RadioBtn label="Pass (4/4)" sel={form.cognitionStatus === "Normal"} onPress={() => updateForm("cognitionStatus", "Normal")} color="#10B981" />
              <RadioBtn label="Fail (<4/4)" sel={form.cognitionStatus === "Impaired"} onPress={() => updateForm("cognitionStatus", "Impaired")} color="#EF4444" />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.cognitionNotes} onChangeText={(v) => updateForm("cognitionNotes", v)} placeholder={t("notes")} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 2. Locomotion (Chair Rise Test) ──────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[1]} />
          {expanded === "locomotion" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("chairRiseTest")}</Text>
                <Text style={styles.testInstr}>{t("chairRiseInstr")}</Text>
                <View style={styles.timerDisplay}>
                  <Text style={styles.timerNumber}>{(timerMs / 1000).toFixed(1)}</Text>
                  <Text style={styles.timerUnit}>seconds</Text>
                </View>
                <View style={styles.timerRow}>
                  {!timerRunning ? (
                    <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#10B981" }]} onPress={startChairRiseTimer}>
                      <Ionicons name="play" size={sc(22)} color="#fff" />
                      <Text style={styles.timerBtnText}>Start Timer</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#EF4444" }]} onPress={stopChairRiseTimer}>
                      <Ionicons name="stop" size={sc(22)} color="#fff" />
                      <Text style={styles.timerBtnText}>Stop Timer</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.timerBtn, { backgroundColor: "#6B7280" }]} onPress={resetChairRiseTimer}>
                    <Ionicons name="refresh" size={sc(20)} color="#fff" />
                    <Text style={styles.timerBtnText}>Reset</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {timerMs > 0 && (
                <View style={styles.scoreBadge}>
                  <Ionicons name="stopwatch-outline" size={sc(18)} color="#F59E0B" />
                  <Text style={styles.scoreText}>Time: {(timerMs / 1000).toFixed(1)}s {timerMs / 1000 <= 14 ? "✓ Pass" : "✗ Fail"}</Text>
                </View>
              )}
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <RadioBtn label="Pass" sel={form.locomotionStatus === "Normal"} onPress={() => updateForm("locomotionStatus", "Normal")} color="#10B981" />
              <RadioBtn label="Fail" sel={form.locomotionStatus === "Limitation"} onPress={() => updateForm("locomotionStatus", "Limitation")} color="#EF4444" />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.locomotionNotes} onChangeText={(v) => updateForm("locomotionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 3. Vitality / Nutrition ───── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[2]} />
          {expanded === "vitality" && (
            <View style={styles.domainBody}>
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("weightLossQ")}</Text>
                <RadioBtn label="Yes" sel={weightLoss === true} onPress={() => setWeightLoss(true)} color="#EF4444" />
                <RadioBtn label="No" sel={weightLoss === false} onPress={() => setWeightLoss(false)} color="#10B981" />
              </View>
              <View style={styles.questionBox}>
                <Text style={styles.questionText}>{t("appetiteLossQ")}</Text>
                <RadioBtn label="Yes" sel={appetiteLoss === true} onPress={() => setAppetiteLoss(true)} color="#EF4444" />
                <RadioBtn label="No" sel={appetiteLoss === false} onPress={() => setAppetiteLoss(false)} color="#10B981" />
              </View>
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <RadioBtn label="Pass" sel={form.vitalityStatus === "Normal"} onPress={() => updateForm("vitalityStatus", "Normal")} color="#10B981" />
              <RadioBtn label="Fail" sel={form.vitalityStatus === "At Risk"} onPress={() => updateForm("vitalityStatus", "At Risk")} color="#EF4444" />
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
                <RadioBtn label="Pass" sel={hearingPass === true} onPress={() => setHearingPass(true)} color="#10B981" />
                <RadioBtn label="Fail" sel={hearingPass === false} onPress={() => setHearingPass(false)} color="#EF4444" />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("hearingAid")}</Text>
                <Switch value={form.hearingAid} onValueChange={(v) => updateForm("hearingAid", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <RadioBtn label="Pass" sel={form.hearingLeft === "Normal"} onPress={() => { updateForm("hearingLeft", "Normal"); updateForm("hearingRight", "Normal"); }} color="#10B981" />
              <RadioBtn label="Fail" sel={form.hearingLeft === "Hearing Loss"} onPress={() => { updateForm("hearingLeft", "Hearing Loss"); updateForm("hearingRight", "Hearing Loss"); }} color="#EF4444" />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.hearingNotes} onChangeText={(v) => updateForm("hearingNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 5. Vision (Letter E Angles Test) ────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[4]} />
          {expanded === "vision" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>Visual Acuity Test – Letter E</Text>
                <Text style={styles.testInstr}>Can the patient see the letter E in the correct orientation? Test both eyes together.</Text>

                {/* Letter E with rotation */}
                <View style={styles.letterDisplay}>
                  <Text style={[styles.letterText, { transform: [{ rotate: `${visionAngles[visionAngleIdx]}deg` }] }]}>E</Text>
                  <Text style={styles.letterCounter}>{visionAngleIdx + 1}/4</Text>
                </View>

                {/* Can you see this orientation? */}
                {visionResults.length < 4 ? (
                  <>
                    <Text style={styles.fieldLabel}>Can you see the letter E in this direction?</Text>
                    <View style={styles.row}>
                      <TouchableOpacity
                        style={[styles.yesNoBtn, { backgroundColor: "#10B98120", borderColor: "#10B981" }]}
                        onPress={() => { setVisionResults([...visionResults, true]); if (visionAngleIdx < 3) setVisionAngleIdx(visionAngleIdx + 1); }}
                      >
                        <Text style={{ color: "#10B981", fontFamily: "Poppins-SemiBold", fontSize: sc(16) }}>Yes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.yesNoBtn, { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}
                        onPress={() => { setVisionResults([...visionResults, false]); if (visionAngleIdx < 3) setVisionAngleIdx(visionAngleIdx + 1); }}
                      >
                        <Text style={{ color: "#EF4444", fontFamily: "Poppins-SemiBold", fontSize: sc(16) }}>No</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.fieldLabel, { marginTop: sc(8) }]}>{visionResults.length}/4 orientations tested</Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.scoreText, { marginTop: sc(8), color: visionResults.filter(Boolean).length >= 3 ? "#10B981" : "#EF4444" }]}>
                      {visionResults.filter(Boolean).length >= 3 ? "✓ Pass – 3 or more correct" : "✗ Fail – fewer than 3 correct"} ({visionResults.filter(Boolean).length}/4)
                    </Text>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "#6B7280", marginTop: sc(8) }]} onPress={() => { setVisionResults([]); setVisionAngleIdx(0); }}>
                      <Ionicons name="refresh" size={sc(18)} color="#fff" />
                      <Text style={styles.actionBtnText}>Reset Test</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Uses Glasses/Spectacles</Text>
                <Switch value={form.glassesUsed} onValueChange={(v) => updateForm("glassesUsed", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <RadioBtn label="Pass – Normal" sel={form.visionLeft === "Normal"} onPress={() => { updateForm("visionLeft", "Normal"); updateForm("visionRight", "Normal"); }} color="#10B981" />
              <RadioBtn label="Fail – Impairment" sel={form.visionLeft === "Impairment"} onPress={() => { updateForm("visionLeft", "Impairment"); updateForm("visionRight", "Impairment"); }} color="#EF4444" />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.visionNotes} onChangeText={(v) => updateForm("visionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── 6. Mood / Depression ───────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[5]} />
          {expanded === "mood" && (
            <View style={styles.domainBody}>
              <View style={styles.testBox}>
                <Text style={styles.testTitle}>{t("moodTest")}</Text>
                <Text style={styles.testInstr}>{t("moodInstr")}</Text>
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>1. {t("moodQ1")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setMoodQ1(true)} style={[styles.gdsBtn, moodQ1 === true && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, moodQ1 === true && { color: "#EF4444" }]}>{t("moodYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMoodQ1(false)} style={[styles.gdsBtn, moodQ1 === false && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, moodQ1 === false && { color: "#10B981" }]}>{t("moodNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.gdsQuestion}>
                  <Text style={styles.gdsQuestionText}>2. {t("moodQ2")}</Text>
                  <View style={styles.gdsRow}>
                    <TouchableOpacity onPress={() => setMoodQ2(true)} style={[styles.gdsBtn, moodQ2 === true && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}>
                      <Text style={[styles.gdsBtnText, moodQ2 === true && { color: "#EF4444" }]}>{t("moodYes")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setMoodQ2(false)} style={[styles.gdsBtn, moodQ2 === false && { backgroundColor: "#10B98120", borderColor: "#10B981" }]}>
                      <Text style={[styles.gdsBtnText, moodQ2 === false && { color: "#10B981" }]}>{t("moodNo")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
          </>
        ) : (
          <>
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
              const fmtDate = (iso: string) => {
                try {
                  const d = new Date(iso);
                  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                } catch { return iso; }
              };

              const statusColor = (s: string) =>
                s.includes("Pass") ? "#10B981" :
                s.includes("Fail") ? "#EF4444" :
                s.includes("Normal") ? "#10B981" :
                s.includes("Mild") || s.includes("At Risk") || s.includes("Possible") ? "#F59E0B" :
                s.includes("Severe") || s.includes("Depression") || s.includes("Malnourished") ? "#EF4444" :
                "#6B7280";

              const DetailRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={[styles.detailValue, { color: valueColor || "#0E7C61" }]}>{value}</Text>
                </View>
              );

              return (
                <View key={a._id || i} style={styles.historyCard}>
                  {/* Header */}
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardHeaderLeft}>
                      <View style={styles.historyIndexBadge}>
                        <Text style={styles.historyIndexText}>{history.length - i}</Text>
                      </View>
                      <View>
                        <Text style={styles.historyDateText}>{fmtDate(a.createdAt)}</Text>
                        <Text style={styles.historySubText}>
                          Assessment {history.length - i}
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

                  {/* Cognition */}
                  {a.cognitionStatus && a.cognitionStatus !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="bulb-outline" size={sc(18)} color="#6366F1" />
                        <Text style={styles.sectionTitle}>{t("cognition")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.cognitionStatus) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.cognitionStatus) }]}>{sl(a.cognitionStatus)}</Text>
                        </View>
                      </View>
                      {a.cognitionScore && <DetailRow label="Score" value={a.cognitionScore} valueColor="#6366F1" />}
                      {a.cognitionStatus && <DetailRow label="Status" value={sl(a.cognitionStatus)} />}
                      {a.cognitionNotes && <DetailRow label="Notes" value={a.cognitionNotes} />}
                    </View>
                  )}

                  {/* Locomotion */}
                  {a.locomotionStatus && a.locomotionStatus !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="walk-outline" size={sc(18)} color="#F59E0B" />
                        <Text style={styles.sectionTitle}>{t("locomotion")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.locomotionStatus) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.locomotionStatus) }]}>{sl(a.locomotionStatus)}</Text>
                        </View>
                      </View>
                      {a.tugTime && <DetailRow label="TUG Time" value={`${a.tugTime}s`} valueColor="#F59E0B" />}
                      {a.walkingAid && <DetailRow label="Walking Aid" value={a.walkingAid} />}
                      {a.locomotionStatus && <DetailRow label="Status" value={sl(a.locomotionStatus)} />}
                      {a.locomotionNotes && <DetailRow label="Notes" value={a.locomotionNotes} />}
                    </View>
                  )}

                  {/* Vitality */}
                  {a.vitalityStatus && a.vitalityStatus !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="nutrition-outline" size={sc(18)} color="#10B981" />
                        <Text style={styles.sectionTitle}>{t("vitality")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.vitalityStatus) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.vitalityStatus) }]}>{sl(a.vitalityStatus)}</Text>
                        </View>
                      </View>
                      {a.mnaScore && <DetailRow label="MNA Score" value={`${a.mnaScore}/14`} valueColor="#10B981" />}
                      {a.weight && <DetailRow label="Weight" value={`${a.weight} kg`} />}
                      {a.height && <DetailRow label="Height" value={`${a.height} cm`} />}
                      {a.bmi && <DetailRow label="BMI" value={a.bmi.toString()} />}
                      {a.vitalityStatus && <DetailRow label="Status" value={sl(a.vitalityStatus)} />}
                      {a.vitalityNotes && <DetailRow label="Notes" value={a.vitalityNotes} />}
                    </View>
                  )}

                  {/* Hearing */}
                  {a.hearingLeft && a.hearingLeft !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="ear-outline" size={sc(18)} color="#3B82F6" />
                        <Text style={styles.sectionTitle}>{t("hearing")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.hearingLeft || a.hearingRight) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.hearingLeft || a.hearingRight) }]}>{sl(a.hearingLeft)}</Text>
                        </View>
                      </View>
                      {a.hearingLeft && <DetailRow label="Left Ear" value={sl(a.hearingLeft)} valueColor={statusColor(a.hearingLeft)} />}
                      {a.hearingRight && <DetailRow label="Right Ear" value={sl(a.hearingRight)} valueColor={statusColor(a.hearingRight)} />}
                      {a.hearingAid && <DetailRow label="Hearing Aid" value="Yes" valueColor="#0E7C61" />}
                      {a.hearingNotes && <DetailRow label="Notes" value={a.hearingNotes} />}
                    </View>
                  )}

                  {/* Vision */}
                  {a.visionLeft && a.visionLeft !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="eye-outline" size={sc(18)} color="#8B5CF6" />
                        <Text style={styles.sectionTitle}>{t("vision")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.visionLeft || a.visionRight) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.visionLeft || a.visionRight) }]}>{sl(a.visionLeft)}</Text>
                        </View>
                      </View>
                      {a.visionLeft && <DetailRow label="Left Eye" value={sl(a.visionLeft)} valueColor={statusColor(a.visionLeft)} />}
                      {a.visionRight && <DetailRow label="Right Eye" value={sl(a.visionRight)} valueColor={statusColor(a.visionRight)} />}
                      {a.glassesUsed && <DetailRow label="Glasses Used" value="Yes" valueColor="#0E7C61" />}
                      {a.visionNotes && <DetailRow label="Notes" value={a.visionNotes} />}
                    </View>
                  )}

                  {/* Mood */}
                  {a.moodStatus && a.moodStatus !== "Not Assessed" && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="happy-outline" size={sc(18)} color="#EC4899" />
                        <Text style={styles.sectionTitle}>{t("mood")}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(a.moodStatus) + "20" }]}>
                          <Text style={[styles.statusBadgeText, { color: statusColor(a.moodStatus) }]}>{sl(a.moodStatus)}</Text>
                        </View>
                      </View>
                      {a.gdsScore && <DetailRow label="GDS Score" value={`${a.gdsScore}/4`} valueColor="#EC4899" />}
                      {a.moodStatus && <DetailRow label="Status" value={sl(a.moodStatus)} />}
                      {a.moodNotes && <DetailRow label="Notes" value={a.moodNotes} />}
                    </View>
                  )}

                  {/* Referral */}
                  {a.referralNeeded && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="alert-circle-outline" size={sc(18)} color="#DC2626" />
                        <Text style={styles.sectionTitle}>Referral</Text>
                      </View>
                      <DetailRow label="Referral Needed" value="Yes" valueColor="#DC2626" />
                      {a.referralDetails && <DetailRow label="Details" value={a.referralDetails} />}
                    </View>
                  )}

                  {/* Care Plan */}
                  {(a.careRecommendations || a.followUpDate) && (
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="clipboard-outline" size={sc(18)} color="#0E7C61" />
                        <Text style={styles.sectionTitle}>Care Plan</Text>
                      </View>
                      {a.careRecommendations && (
                        <View style={styles.carePlanBox}>
                          <Text style={styles.carePlanLabel}>Recommendations</Text>
                          <Text style={styles.carePlanText}>{a.careRecommendations}</Text>
                        </View>
                      )}
                      {a.followUpDate && <DetailRow label="Follow-up Date" value={a.followUpDate} />}
                      {a.referralNeeded && <DetailRow label="Referral Required" value="Yes" valueColor="#DC2626" />}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        </>
        )}

        {/* ─── Submit button ──────────────────────── */}
        {!showHistoryOnly && (
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
        )}

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
  radioRow: { flexDirection: "row", alignItems: "center", paddingVertical: sc(8), paddingHorizontal: sc(4) },
  radioOuter: { width: sc(20), height: sc(20), borderRadius: sc(10), borderWidth: 2, borderColor: "#ccc", alignItems: "center", justifyContent: "center", marginRight: sc(10) },
  radioInner: { width: sc(10), height: sc(10), borderRadius: sc(5) },
  radioLabel: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#374151" },
  eyeTabRow: { flexDirection: "row", gap: sc(8), marginVertical: sc(10) },
  eyeTab: { flex: 1, paddingVertical: sc(10), paddingHorizontal: sc(12), borderRadius: sc(8), borderWidth: 2, borderColor: "#ddd", alignItems: "center" },
  eyeTabText: { fontSize: sc(13), fontFamily: "Poppins-SemiBold", color: "#666" },
  letterDisplay: { backgroundColor: "#f5f5f5", borderRadius: sc(12), paddingVertical: sc(40), paddingHorizontal: sc(20), alignItems: "center", marginVertical: sc(16), minHeight: sc(200), justifyContent: "center" },
  letterText: { fontSize: sc(120), fontFamily: "Poppins-Bold", color: "#1f2937" },
  letterCounter: { fontSize: sc(14), fontFamily: "Poppins-Regular", color: "#999", marginTop: sc(8) },
  yesNoBtn: { flex: 1, paddingVertical: sc(12), borderRadius: sc(8), borderWidth: 2, alignItems: "center" },

  // Detail section styles
  detailSection: { borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingVertical: sc(12), paddingHorizontal: sc(14) },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: sc(8), marginBottom: sc(10) },
  sectionTitle: { flex: 1, fontSize: sc(13), fontFamily: "Poppins-SemiBold", color: "#222" },
  statusBadge: { paddingHorizontal: sc(8), paddingVertical: sc(3), borderRadius: sc(6) },
  statusBadgeText: { fontSize: sc(11), fontFamily: "Poppins-SemiBold" },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: sc(6), gap: sc(8) },
  detailLabel: { fontSize: sc(12), fontFamily: "Poppins-Regular", color: "#666", flex: 1 },
  detailValue: { fontSize: sc(13), fontFamily: "Poppins-SemiBold", textAlign: "right" },
  carePlanLabel: { fontSize: sc(12), fontFamily: "Poppins-SemiBold", color: "#0E7C61", marginBottom: sc(6) },
});

export default PatientAssessment;
