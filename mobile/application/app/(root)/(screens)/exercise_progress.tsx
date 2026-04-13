import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import useAuthStore from "@/stores/authStore";
import { apiFetch } from "@/utils/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 36 : 44;

const extractData = (payload: any) =>
  payload?.success && payload?.data ? payload.data : payload;

type ProgressTracker = {
  startProgress?: number;
  currentProgress?: number;
  playTimeMinutes?: number;
  fingerProgress?: number;
  wristProgress?: number;
  elbowProgress?: number;
  shoulderProgress?: number;
};

type ChildData = {
  id: string;
  firstName?: string;
  lastName?: string;
  exerciseFingers?: boolean;
  exerciseWrist?: boolean;
  exerciseElbow?: boolean;
  exerciseShoulder?: boolean;
  playTimeMinutes?: number;
  playHours?: number;
  progressTracker?: ProgressTracker;
};

const EXERCISE_DETAILS: {
  key: string;
  flag: keyof ChildData;
  progressKey: keyof ProgressTracker;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  emoji: string;
  color: string;
  gradient: [string, string];
  lightGradient: [string, string];
  bg: string;
  description: string;
}[] = [
  {
    key: "fingers",
    flag: "exerciseFingers",
    progressKey: "fingerProgress",
    label: "Fingers",
    icon: "hand-left-outline",
    emoji: "\u{1F44C}",
    color: "#6366F1",
    gradient: ["#6366F1", "#818CF8"],
    lightGradient: ["#eef2ff", "#e0e7ff"],
    bg: "#eef2ff",
    description: "Fine motor skills & finger dexterity",
  },
  {
    key: "wrist",
    flag: "exerciseWrist",
    progressKey: "wristProgress",
    label: "Wrist",
    icon: "hand-right-outline",
    emoji: "\u{1F4AA}",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#a78bfa"],
    lightGradient: ["#f5f3ff", "#ede9fe"],
    bg: "#f5f3ff",
    description: "Wrist flexibility & range of motion",
  },
  {
    key: "elbow",
    flag: "exerciseElbow",
    progressKey: "elbowProgress",
    label: "Elbow",
    icon: "fitness-outline",
    emoji: "\u{1F3CB}\u{FE0F}",
    color: "#f59e0b",
    gradient: ["#f59e0b", "#fbbf24"],
    lightGradient: ["#fffbeb", "#fef3c7"],
    bg: "#fffbeb",
    description: "Elbow joint strengthening & movement",
  },
  {
    key: "shoulder",
    flag: "exerciseShoulder",
    progressKey: "shoulderProgress",
    label: "Shoulder",
    icon: "body-outline",
    emoji: "\u{1F9D8}",
    color: "#ec4899",
    gradient: ["#ec4899", "#f472b6"],
    lightGradient: ["#fdf2f8", "#fce7f3"],
    bg: "#fdf2f8",
    description: "Shoulder mobility & rehabilitation",
  },
];

/* ---------- Circular Progress Ring (pure RN, no SVG) ---------- */
const RING_SIZE = 120;
const DOT_COUNT = 36;
const DOT_RADIUS = 4;

const CircleProgress = ({
  progress,
  size = RING_SIZE,
  color = "#34d399",
  trackColor = "rgba(255,255,255,0.15)",
}: {
  progress: number;
  size?: number;
  color?: string;
  trackColor?: string;
}) => {
  const clamped = Math.min(100, Math.max(0, progress));
  const filledDots = Math.round((clamped / 100) * DOT_COUNT);
  const center = size / 2;
  const radius = (size - DOT_RADIUS * 2) / 2;

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: DOT_COUNT }).map((_, i) => {
        const angle = (i / DOT_COUNT) * 2 * Math.PI - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - DOT_RADIUS;
        const y = center + radius * Math.sin(angle) - DOT_RADIUS;
        const filled = i < filledDots;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: DOT_RADIUS * 2,
              height: DOT_RADIUS * 2,
              borderRadius: DOT_RADIUS,
              backgroundColor: filled ? color : trackColor,
            }}
          />
        );
      })}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "800",
            color: "#fff",
            fontFamily: "Poppins-Bold",
          }}
        >
          {clamped.toFixed(0)}%
        </Text>
        <Text
          style={{
            fontSize: 11,
            color: "#c7d2fe",
            fontFamily: "Poppins-Regular",
            marginTop: -2,
          }}
        >
          Overall
        </Text>
      </View>
    </View>
  );
};

/* ---------- Gradient Progress Bar ---------- */
const ProgressBar = ({
  progress,
  colors,
  height = 8,
  trackColor = "#e2e8f0",
}: {
  progress: number;
  colors: [string, string];
  height?: number;
  trackColor?: string;
}) => {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: height / 2,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          height,
          borderRadius: height / 2,
          width: `${clamped}%` as any,
        }}
      />
    </View>
  );
};

/* ================================================================ */
const ExerciseProgressScreen = () => {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const router = useRouter();
  const { currentUser, isSignedIn } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childData, setChildData] = useState<ChildData | null>(null);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (!isSignedIn || !currentUser) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await apiFetch("/api/v1/users/my-children", {
          method: "GET",
        });
        if (res?.ok) {
          const json = await res.json();
          const rows: ChildData[] = extractData(json) || [];
          if (Array.isArray(rows)) {
            const match = childId
              ? rows.find((c) => c.id === childId) || rows[0]
              : rows[0];
            if (match) setChildData(match);
          }
        }
      } catch {
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [childId, currentUser, isSignedIn],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tracker = childData?.progressTracker;
  const startProg = tracker?.startProgress ?? 0;
  const currentProg = tracker?.currentProgress ?? 0;
  const overallProgress = Math.min(100, Math.max(0, currentProg));
  const improvement = currentProg - startProg;
  const enabledExercises = EXERCISE_DETAILS.filter(
    (ex) => !!(childData as any)?.[ex.flag],
  );
  const childName = childData
    ? `${childData.firstName || ""} ${childData.lastName || ""}`.trim()
    : "";

  /* ---------- loading / empty ---------- */
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }
  if (!childData || enabledExercises.length === 0) {
    return (
      <View style={s.center}>
        <View style={s.emptyIcon}>
          <Ionicons name="barbell-outline" size={44} color="#a5b4fc" />
        </View>
        <Text style={s.emptyTitle}>No Exercises Yet</Text>
        <Text style={s.emptySub}>
          Exercises will appear here once assigned by your physiotherapist.
        </Text>
      </View>
    );
  }

  /* ---------- main render ---------- */
  return (
    <View style={s.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={["#6366F1"]}
            tintColor="#6366F1"
          />
        }
      >
        {/* ========== Hero Header ========== */}
        <LinearGradient
          colors={["#312e81", "#4338CA", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.hero}
        >
          {/* decorative circles */}
          <View style={s.decor1} />
          <View style={s.decor2} />
          <View style={s.decor3} />

          {/* back button row */}
          <View style={s.heroNav}>
            <View
              style={s.backBtn}
              onTouchEnd={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </View>
            <Text style={s.heroNavTitle}>Exercise Progress</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={s.heroTitle}>
            {childName ? `${childName}'s Progress` : "Progress Overview"}
          </Text>

          <View style={s.heroRow}>
            <CircleProgress progress={overallProgress} />

            <View style={s.heroStats}>
              {/* stat cards */}
              <View style={s.statCard}>
                <Ionicons name="flag-outline" size={14} color="#a5b4fc" />
                <Text style={s.statLabel}>Start</Text>
                <Text style={s.statValue}>{startProg.toFixed(1)}%</Text>
              </View>
              <View style={s.statCard}>
                <Ionicons name="pulse-outline" size={14} color="#67e8f9" />
                <Text style={s.statLabel}>Current</Text>
                <Text style={[s.statValue, { color: "#67e8f9" }]}>
                  {currentProg.toFixed(1)}%
                </Text>
              </View>
              <View style={s.statCard}>
                <Ionicons
                  name={
                    improvement >= 0
                      ? "trending-up-outline"
                      : "trending-down-outline"
                  }
                  size={14}
                  color={improvement >= 0 ? "#34d399" : "#f87171"}
                />
                <Text style={s.statLabel}>Change</Text>
                <Text
                  style={[
                    s.statValue,
                    { color: improvement >= 0 ? "#34d399" : "#f87171" },
                  ]}
                >
                  {improvement >= 0 ? "+" : ""}
                  {improvement.toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          {/* play-time pill */}
          {(childData.playTimeMinutes ?? 0) > 0 && (
            <View style={s.playPill}>
              <Ionicons name="game-controller-outline" size={14} color="#c7d2fe" />
              <Text style={s.playPillText}>
                Play time: {childData.playHours ?? 0}h{" "}
                {childData.playTimeMinutes ?? 0}m
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* ========== Exercise Cards ========== */}
        <View style={s.body}>
          <View style={s.sectionHeader}>
            <Ionicons name="layers-outline" size={18} color="#4338CA" />
            <Text style={s.sectionTitle}>Exercise Breakdown</Text>
          </View>

          {enabledExercises.map((ex) => {
            const pct =
              (tracker as any)?.[ex.progressKey] ?? currentProg;
            const exImp = pct - startProg;
            const clamped = Math.min(100, Math.max(0, pct));

            return (
              <View key={ex.key} style={s.card}>
                {/* gradient stripe at the top */}
                <LinearGradient
                  colors={ex.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.cardStripe}
                />

                {/* card body */}
                <LinearGradient
                  colors={ex.lightGradient}
                  style={s.cardBody}
                >
                  {/* Top row: emoji + label + percentage */}
                  <View style={s.cardTop}>
                    <View style={[s.cardIconWrap, { backgroundColor: ex.color + "18" }]}>
                      <Text style={s.cardEmoji}>{ex.emoji}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.cardLabel}>{ex.label}</Text>
                      <Text style={s.cardDesc}>{ex.description}</Text>
                    </View>
                    <View style={[s.pctBadge, { backgroundColor: ex.color + "18" }]}>
                      <Text style={[s.pctBadgeText, { color: ex.color }]}>
                        {clamped.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* progress bar */}
                  <View style={{ marginTop: 14, marginBottom: 12 }}>
                    <ProgressBar
                      progress={clamped}
                      colors={ex.gradient}
                      height={10}
                      trackColor={ex.color + "20"}
                    />
                  </View>

                  {/* metrics row */}
                  <View style={s.metricsRow}>
                    <View style={s.metricChip}>
                      <View style={[s.metricDot, { backgroundColor: "#94a3b8" }]} />
                      <Text style={s.metricChipLabel}>Start</Text>
                      <Text style={s.metricChipValue}>{startProg.toFixed(1)}%</Text>
                    </View>
                    <View style={s.metricChip}>
                      <View style={[s.metricDot, { backgroundColor: ex.color }]} />
                      <Text style={s.metricChipLabel}>Current</Text>
                      <Text style={[s.metricChipValue, { color: ex.color }]}>
                        {clamped.toFixed(1)}%
                      </Text>
                    </View>
                    <View style={s.metricChip}>
                      <Ionicons
                        name={exImp >= 0 ? "arrow-up" : "arrow-down"}
                        size={10}
                        color={exImp >= 0 ? "#10b981" : "#ef4444"}
                      />
                      <Text style={s.metricChipLabel}>Change</Text>
                      <Text
                        style={[
                          s.metricChipValue,
                          { color: exImp >= 0 ? "#10b981" : "#ef4444" },
                        ]}
                      >
                        {exImp >= 0 ? "+" : ""}
                        {exImp.toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                  {/* Active badge */}
                  <View style={s.activeBadge}>
                    <View style={[s.activeDot, { backgroundColor: ex.color }]} />
                    <Text style={[s.activeText, { color: ex.color }]}>
                      Active Exercise
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {/* ========== Summary Card ========== */}
          <View style={s.summaryWrap}>
            <LinearGradient
              colors={["#ecfdf5", "#d1fae5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.summaryCard}
            >
              <View style={s.summaryIconWrap}>
                <Ionicons name="ribbon-outline" size={22} color="#10b981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.summaryTitle}>Progress Summary</Text>
                <Text style={s.summaryText}>
                  {enabledExercises.length} active exercise
                  {enabledExercises.length > 1 ? "s" : ""}
                  {improvement > 0
                    ? ` \u2022 ${improvement.toFixed(1)}% improvement`
                    : " \u2022 Keep going!"}
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* ========== Daily Tip ========== */}
          <View style={s.tipWrap}>
            <LinearGradient
              colors={["#faf5ff", "#f3e8ff"]}
              style={s.tipCard}
            >
              <View style={s.tipIconWrap}>
                <LinearGradient colors={["#8b5cf6", "#a78bfa"]} style={s.tipIconGrad}>
                  <Ionicons name="bulb-outline" size={18} color="#fff" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle}>Daily Tip</Text>
                <Text style={s.tipText}>
                  Consistent practice of 15-20 minutes daily leads to the best
                  long-term results. Small steps add up!
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ================================================================ */
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f1f5f9" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 32,
  },

  /* empty */
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  emptySub: {
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 6,
    fontFamily: "Poppins-Regular",
    lineHeight: 20,
  },

  /* hero */
  hero: {
    paddingTop: STATUS_BAR_HEIGHT + 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
    overflow: "hidden",
  },
  decor1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    top: -60,
    right: -50,
  },
  decor2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -30,
    left: -30,
  },
  decor3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.03)",
    top: 60,
    left: SCREEN_WIDTH * 0.4,
  },
  heroNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroNavTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Poppins-Bold",
    marginBottom: 18,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  heroStats: { flex: 1, gap: 8 },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  statLabel: {
    flex: 1,
    fontSize: 11,
    color: "#c7d2fe",
    fontFamily: "Poppins-Regular",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Poppins-Bold",
  },
  playPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  playPillText: {
    fontSize: 12,
    color: "#c7d2fe",
    fontFamily: "Poppins-Regular",
  },

  /* body */
  body: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },

  /* exercise card */
  card: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    // shadow
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardStripe: { height: 5 },
  cardBody: {
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardEmoji: { fontSize: 22 },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },
  cardDesc: {
    fontSize: 11,
    color: "#64748b",
    fontFamily: "Poppins-Regular",
    marginTop: 1,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pctBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "Poppins-Bold",
  },

  /* metrics */
  metricsRow: {
    flexDirection: "row",
    gap: 8,
  },
  metricChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  metricDot: { width: 6, height: 6, borderRadius: 3 },
  metricChipLabel: {
    fontSize: 9,
    color: "#94a3b8",
    fontFamily: "Poppins-Regular",
    flex: 1,
  },
  metricChipValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e293b",
    fontFamily: "Poppins-Bold",
  },

  /* active badge */
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    alignSelf: "flex-start",
  },
  activeDot: { width: 7, height: 7, borderRadius: 4 },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Poppins-Regular",
  },

  /* summary */
  summaryWrap: { marginTop: 6 },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    gap: 12,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065f46",
    fontFamily: "Poppins-Bold",
  },
  summaryText: {
    fontSize: 12,
    color: "#047857",
    fontFamily: "Poppins-Regular",
    marginTop: 2,
  },

  /* daily tip */
  tipWrap: { marginTop: 14 },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ddd6fe",
    gap: 12,
  },
  tipIconWrap: { width: 36, height: 36, borderRadius: 10, overflow: "hidden" },
  tipIconGrad: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5b21b6",
    fontFamily: "Poppins-Bold",
  },
  tipText: {
    fontSize: 11,
    color: "#7c3aed",
    fontFamily: "Poppins-Regular",
    marginTop: 2,
    lineHeight: 16,
  },
});

export default ExerciseProgressScreen;
