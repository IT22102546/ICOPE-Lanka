import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import useAuthStore from "@/stores/authStore";

const API = process.env.EXPO_PUBLIC_API_KEY;
const { width: screenWidth } = Dimensions.get("window");

// ── Bilingual ────────────────────────────────────────────────────
const TXT: Record<string, { en: string; si: string }> = {
  brand:           { en: "ICOPE Lanka", si: "ICOPE Lanka" },
  assessment:      { en: "ICOPE Assessment", si: "ICOPE තක්සේරුව" },
  cognition:       { en: "Cognition", si: "සංජානන" },
  cognitionDesc:   { en: "MMSE / MoCA brief screening", si: "MMSE / MoCA කෙටි පරීක්ෂණය" },
  locomotion:      { en: "Locomotion", si: "චලනය" },
  locomotionDesc:  { en: "TUG test & gait assessment", si: "TUG පරීක්ෂණය සහ походка තක්සේරුව" },
  vitality:        { en: "Vitality / Nutrition", si: "ජීවනකාරිත්වය / පෝෂණය" },
  vitalityDesc:    { en: "MNA-SF nutritional screening", si: "MNA-SF පෝෂණ පරීක්ෂණය" },
  hearing:         { en: "Hearing", si: "ශ්‍රවණය" },
  hearingDesc:     { en: "Whisper test & audiometry", si: "Whisper පරීක්ෂණය" },
  vision:          { en: "Vision", si: "දෘෂ්ටි" },
  visionDesc:      { en: "Snellen chart & near vision", si: "Snellen chart සහ සමීප දෘෂ්ටිය" },
  mood:            { en: "Mood / Depression", si: "මනෝභාවය / මානසික අවපීඩනය" },
  moodDesc:        { en: "GDS-4 screening", si: "GDS-4 පරීක්ෂණය" },
  carePlan:        { en: "Care Plan", si: "සත්කාර සැලැස්ම" },
  recommendations: { en: "Recommendations", si: "නිර්දේශ" },
  followUp:        { en: "Follow-up Date", si: "පසු විපරම් දිනය" },
  referralNeeded:  { en: "Referral Needed", si: "යොමු කිරීම අවශ්‍යයි" },
  referralDetails: { en: "Referral Details", si: "යොමු කිරීමේ විස්තර" },
  submit:          { en: "Submit Assessment", si: "තක්සේරුව ඉදිරිපත් කරන්න" },
  submitting:      { en: "Submitting...", si: "ඉදිරිපත් කරමින්..." },
  success:         { en: "Assessment saved successfully!", si: "තක්සේරුව සාර්ථකව සුරකින ලදී!" },
  error:           { en: "Failed to save assessment", si: "තක්සේරුව සුරැකීමට අසමත් විය" },
  score:           { en: "Score", si: "ලකුණ" },
  status:          { en: "Status", si: "තත්ත්වය" },
  notes:           { en: "Notes", si: "සටහන්" },
  tugTime:         { en: "TUG Time (seconds)", si: "TUG කාලය (තත්පර)" },
  walkingAid:      { en: "Walking Aid", si: "ඇවිදීමේ උපකරණය" },
  weight:          { en: "Weight (kg)", si: "බර (kg)" },
  height:          { en: "Height (cm)", si: "උස (cm)" },
  bmi:             { en: "BMI", si: "BMI" },
  left:            { en: "Left", si: "වම" },
  right:           { en: "Right", si: "දකුණ" },
  hearingAid:      { en: "Uses Hearing Aid", si: "ශ්‍රවණ උපකරණ භාවිතා කරයි" },
  glasses:         { en: "Uses Glasses", si: "කණ්ණාඩි භාවිතා කරයි" },
  history:         { en: "Previous Assessments", si: "පෙර තක්සේරු" },
  noHistory:       { en: "No previous assessments", si: "පෙර තක්සේරු නැත" },
  back:            { en: "Back", si: "ආපසු" },
};

// ── Status options per domain ────────────────────────────────────
const COGNITION_STATUSES = ["Not Assessed", "Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment"];
const LOCOMOTION_STATUSES = ["Not Assessed", "Normal", "Mild Limitation", "Moderate Limitation", "Severe Limitation"];
const VITALITY_STATUSES = ["Not Assessed", "Normal", "At Risk", "Malnourished"];
const HEARING_STATUSES = ["Not Assessed", "Normal", "Mild Loss", "Moderate Loss", "Severe Loss"];
const VISION_STATUSES = ["Not Assessed", "Normal", "Mild Impairment", "Moderate Impairment", "Severe Impairment"];
const MOOD_STATUSES = ["Not Assessed", "Normal", "Possible Depression", "Depression"];

type DomainKey = "cognition" | "locomotion" | "vitality" | "hearing" | "vision" | "mood" | "carePlan";

const DOMAIN_CONFIG: { key: DomainKey; icon: string; color: string }[] = [
  { key: "cognition",  icon: "brain-outline",    color: "#6366F1" },
  { key: "locomotion", icon: "walk-outline",      color: "#F59E0B" },
  { key: "vitality",   icon: "nutrition-outline",  color: "#10B981" },
  { key: "hearing",    icon: "ear-outline",        color: "#3B82F6" },
  { key: "vision",     icon: "eye-outline",        color: "#8B5CF6" },
  { key: "mood",       icon: "happy-outline",      color: "#EC4899" },
  { key: "carePlan",   icon: "clipboard-outline",  color: "#0E7C61" },
];

const PatientAssessment = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId: string; patientName: string }>();
  const { getAccessToken } = useAuthStore();
  const [lang, setLang] = useState<"en" | "si">("en");
  const t = (key: string) => TXT[key]?.[lang] ?? key;

  const [expanded, setExpanded] = useState<DomainKey | null>("cognition");
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // ── Form state ──────────────────────────────────────────────────
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

  // ── Status chip selector ────────────────────────────────────────
  const StatusChips = ({ statuses, value, onChange }: { statuses: string[]; value: string; onChange: (v: string) => void }) => (
    <View style={styles.chipRow}>
      {statuses.map((s) => {
        const isActive = value === s;
        const chipColor = s === "Not Assessed" ? "#9CA3AF" : s.includes("Normal") ? "#10B981" : s.includes("Mild") || s.includes("At Risk") || s.includes("Possible") ? "#F59E0B" : "#EF4444";
        return (
          <TouchableOpacity key={s} onPress={() => onChange(s)} style={[styles.statusChip, isActive && { backgroundColor: chipColor + "20", borderColor: chipColor }]}>
            <Text style={[styles.statusChipText, isActive && { color: chipColor, fontFamily: "Poppins-SemiBold" }]}>{s}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── Accordion header ────────────────────────────────────────────
  const DomainHeader = ({ domain }: { domain: typeof DOMAIN_CONFIG[0] }) => {
    const isOpen = expanded === domain.key;
    return (
      <TouchableOpacity style={[styles.domainHeader, isOpen && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} onPress={() => setExpanded(isOpen ? null : domain.key)} activeOpacity={0.7}>
        <View style={[styles.domainIcon, { backgroundColor: domain.color + "15" }]}>
          <Ionicons name={domain.icon as any} size={22} color={domain.color} />
        </View>
        <View style={styles.domainHeaderText}>
          <Text style={styles.domainTitle}>{t(domain.key)}</Text>
          <Text style={styles.domainDesc}>{t(domain.key + "Desc")}</Text>
        </View>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t("assessment")}</Text>
            <Text style={styles.headerPatient}>{params.patientName || ""}</Text>
          </View>
          <TouchableOpacity onPress={() => setLang(lang === "en" ? "si" : "en")} style={styles.headerLangBtn}>
            <Text style={styles.headerLangText}>{lang === "en" ? "සිං" : "EN"}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ─── Cognition ──────────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[0]} />
          {expanded === "cognition" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("score")} (MMSE 0-30)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.cognitionScore} onChangeText={(v) => updateForm("cognitionScore", v)} placeholder="0-30" placeholderTextColor="#bbb" />
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={COGNITION_STATUSES} value={form.cognitionStatus} onChange={(v) => updateForm("cognitionStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.cognitionNotes} onChangeText={(v) => updateForm("cognitionNotes", v)} placeholder={t("notes")} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Locomotion ─────────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[1]} />
          {expanded === "locomotion" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("tugTime")}</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.tugTime} onChangeText={(v) => updateForm("tugTime", v)} placeholder="seconds" placeholderTextColor="#bbb" />
              <Text style={styles.fieldLabel}>{t("walkingAid")}</Text>
              <TextInput style={styles.input} value={form.walkingAid} onChangeText={(v) => updateForm("walkingAid", v)} placeholder={t("walkingAid")} placeholderTextColor="#bbb" />
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={LOCOMOTION_STATUSES} value={form.locomotionStatus} onChange={(v) => updateForm("locomotionStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.locomotionNotes} onChangeText={(v) => updateForm("locomotionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Vitality / Nutrition ───────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[2]} />
          {expanded === "vitality" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("score")} (MNA-SF 0-14)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.mnaScore} onChangeText={(v) => updateForm("mnaScore", v)} placeholder="0-14" placeholderTextColor="#bbb" />
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
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={VITALITY_STATUSES} value={form.vitalityStatus} onChange={(v) => updateForm("vitalityStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.vitalityNotes} onChangeText={(v) => updateForm("vitalityNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Hearing ────────────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[3]} />
          {expanded === "hearing" && (
            <View style={styles.domainBody}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("left")}</Text>
                  <StatusChips statuses={HEARING_STATUSES} value={form.hearingLeft} onChange={(v) => updateForm("hearingLeft", v)} />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("right")}</Text>
                  <StatusChips statuses={HEARING_STATUSES} value={form.hearingRight} onChange={(v) => updateForm("hearingRight", v)} />
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("hearingAid")}</Text>
                <Switch value={form.hearingAid} onValueChange={(v) => updateForm("hearingAid", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.hearingNotes} onChangeText={(v) => updateForm("hearingNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Vision ─────────────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[4]} />
          {expanded === "vision" && (
            <View style={styles.domainBody}>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("left")}</Text>
                  <StatusChips statuses={VISION_STATUSES} value={form.visionLeft} onChange={(v) => updateForm("visionLeft", v)} />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.fieldLabel}>{t("right")}</Text>
                  <StatusChips statuses={VISION_STATUSES} value={form.visionRight} onChange={(v) => updateForm("visionRight", v)} />
                </View>
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t("glasses")}</Text>
                <Switch value={form.glassesUsed} onValueChange={(v) => updateForm("glassesUsed", v)} trackColor={{ true: "#0E7C61" }} />
              </View>
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.visionNotes} onChangeText={(v) => updateForm("visionNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Mood / Depression ──────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[5]} />
          {expanded === "mood" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("score")} (GDS 0-15)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={form.gdsScore} onChangeText={(v) => updateForm("gdsScore", v)} placeholder="0-15" placeholderTextColor="#bbb" />
              <Text style={styles.fieldLabel}>{t("status")}</Text>
              <StatusChips statuses={MOOD_STATUSES} value={form.moodStatus} onChange={(v) => updateForm("moodStatus", v)} />
              <Text style={styles.fieldLabel}>{t("notes")}</Text>
              <TextInput style={[styles.input, styles.multiline]} multiline value={form.moodNotes} onChangeText={(v) => updateForm("moodNotes", v)} placeholderTextColor="#bbb" />
            </View>
          )}
        </View>

        {/* ─── Care Plan ──────────────────────────── */}
        <View style={styles.domainCard}>
          <DomainHeader domain={DOMAIN_CONFIG[6]} />
          {expanded === "carePlan" && (
            <View style={styles.domainBody}>
              <Text style={styles.fieldLabel}>{t("recommendations")}</Text>
              <TextInput style={[styles.input, styles.multiline, { minHeight: 80 }]} multiline value={form.careRecommendations} onChangeText={(v) => updateForm("careRecommendations", v)} placeholderTextColor="#bbb" />
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
          <Text style={styles.historyTitle}>{t("history")}</Text>
          {loadingHistory ? (
            <ActivityIndicator color="#0E7C61" style={{ marginTop: 12 }} />
          ) : history.length === 0 ? (
            <Text style={styles.historyEmpty}>{t("noHistory")}</Text>
          ) : (
            history.slice(0, 5).map((a, i) => (
              <View key={a._id || i} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Ionicons name="calendar-outline" size={14} color="#0E7C61" />
                  <Text style={styles.historyDate}>{new Date(a.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.historyChipRow}>
                  {a.cognitionStatus && a.cognitionStatus !== "Not Assessed" && <View style={styles.historyChip}><Text style={styles.historyChipText}>Cognition: {a.cognitionStatus}</Text></View>}
                  {a.locomotionStatus && a.locomotionStatus !== "Not Assessed" && <View style={styles.historyChip}><Text style={styles.historyChipText}>Locomotion: {a.locomotionStatus}</Text></View>}
                  {a.vitalityStatus && a.vitalityStatus !== "Not Assessed" && <View style={styles.historyChip}><Text style={styles.historyChipText}>Vitality: {a.vitalityStatus}</Text></View>}
                  {a.moodStatus && a.moodStatus !== "Not Assessed" && <View style={styles.historyChip}><Text style={styles.historyChipText}>Mood: {a.moodStatus}</Text></View>}
                </View>
              </View>
            ))
          )}
        </View>

        {/* ─── Submit button ──────────────────────── */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
          <LinearGradient colors={["#0E7C61", "#14A87D"]} style={styles.submitGradient}>
            {submitting ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.submitText}>{t("submit")}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  backBtn: { padding: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { color: "#fff", fontSize: 18, fontFamily: "Poppins-Bold" },
  headerPatient: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Poppins-Regular" },
  headerLangBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16 },
  headerLangText: { color: "#fff", fontSize: 12, fontFamily: "Poppins-SemiBold" },
  scrollContent: { padding: 16 },
  domainCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2 },
  domainHeader: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16 },
  domainIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  domainHeaderText: { flex: 1, marginLeft: 12 },
  domainTitle: { fontSize: 16, fontFamily: "Poppins-SemiBold", color: "#222" },
  domainDesc: { fontSize: 12, fontFamily: "Poppins-Regular", color: "#888" },
  domainBody: { paddingHorizontal: 16, paddingBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#555", marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Poppins-Regular", color: "#333" },
  multiline: { minHeight: 56, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#e5e5e5", backgroundColor: "#fafafa" },
  statusChipText: { fontSize: 11, fontFamily: "Poppins-Regular", color: "#777" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  switchLabel: { fontSize: 14, fontFamily: "Poppins-Regular", color: "#555" },
  historySection: { marginTop: 8, marginBottom: 16 },
  historyTitle: { fontSize: 16, fontFamily: "Poppins-SemiBold", color: "#333", marginBottom: 8 },
  historyEmpty: { fontSize: 13, fontFamily: "Poppins-Regular", color: "#999" },
  historyCard: { backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: "#0E7C61" },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  historyDate: { fontSize: 13, fontFamily: "Poppins-Medium", color: "#0E7C61" },
  historyChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  historyChip: { backgroundColor: "#E8F5E9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  historyChipText: { fontSize: 10, fontFamily: "Poppins-Medium", color: "#0E7C61" },
  submitBtn: { marginTop: 8 },
  submitGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 16 },
  submitText: { color: "#fff", fontSize: 17, fontFamily: "Poppins-Bold" },
});

export default PatientAssessment;
