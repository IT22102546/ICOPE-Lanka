import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";

export default function ExamFinished() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { currentUser, accessToken, isSignedIn } = useAuthStore();

  /* -------------------- Params -------------------- */
  const examId = params.examId as string;
  const examTitle = (params.examTitle as string) || "Exam";
  const grade = (params.grade as string) || "";
  const subject = (params.subject as string) || "";
  const attemptId = params.attemptId as string;
  const paramScore = Number(params.score) || 0;
  const paramMaxScore = Number(params.maxScore) || 100;
  const paramPercentage = Number(params.percentage) || 0;
  const paramPassed = params.passed === 'true';
  const paramTotalQuestions = parseInt(params.totalQuestions as string) || 0;
  const paramAnsweredQuestions = parseInt(params.answeredQuestions as string) || 0;
  const paramIsAutoSubmit = params.isAutoSubmit === 'true';

  /* -------------------- State -------------------- */
  const [loading, setLoading] = useState(true);
  const [rankingData, setRankingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  /* -------------------- API Helper -------------------- */
  const makeAuthenticatedRequest = async (endpoint: string) => {
    try {
      let response = await apiFetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        const refreshed = await useAuthStore.getState().refreshTokens();
        if (!refreshed) throw new Error("Authentication failed");

        const newToken = useAuthStore.getState().accessToken;
        response = await apiFetch(endpoint, {
          headers: {
            Authorization: `Bearer ${newToken}`,
          },
        });
      }

      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error("API error:", err);
      return null;
    }
  };

  /* -------------------- Fetch Ranking -------------------- */
  const fetchRankingData = async () => {
    try {
      if (!isSignedIn || !accessToken) {
        Alert.alert("Login required", "Please login to view results");
        return;
      }

      setLoading(true);
      setError(null);

      const data = await makeAuthenticatedRequest(
        `/api/v1/exams/${examId}/rankings`
      );

      setRankingData(
        data ?? { rankings: [], summary: { totalRanked: 0 } }
      );
    } catch {
      setError("Failed to load ranking data");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    if (!examId) {
      setError("No exam selected");
      setLoading(false);
      return;
    }

    fetchRankingData();
  }, [examId]);

  /* -------------------- User Ranking -------------------- */
  const userRanking = rankingData?.rankings?.find(
    (r: any) => r.studentId === currentUser?.id
  );

  /* -------------------- Final Score Logic -------------------- */
  const finalScore = paramScore > 0 ? paramScore : userRanking?.score ?? 0;
  const finalPercentage = paramPercentage > 0 ? paramPercentage : userRanking?.percentage ?? 0;
  const finalMaxScore = paramMaxScore > 0 ? paramMaxScore : 100;
  const isPass = paramPassed !== undefined ? paramPassed : finalPercentage >= 40;
  const isAutoSubmit = paramIsAutoSubmit;
  const totalQuestions = paramTotalQuestions;
  const answeredQuestions = paramAnsweredQuestions;

  const hasRankings = rankingData?.rankings?.length > 0;

  /* -------------------- Handlers -------------------- */
  const handleViewRanking = () => {
    if (!rankingData?.rankings?.length) {
      Alert.alert("No rankings available");
      return;
    }

    router.push({
      pathname: "/(root)/(screens)/ExamRanking",
      params: {
        examId,
        examTitle,
        grade,
        subject,
        score: finalScore.toString(),
        maxScore: finalMaxScore.toString(),
        rankingData: JSON.stringify(rankingData),
      },
    });
  };

  const handleViewCorrectedPaper = () => {
    if (!examId) {
      Alert.alert("Error", "Cannot view corrected paper without exam ID");
      return;
    }
    
    router.push({
      pathname: '/(root)/(screens)/CorrectionSheet',
      params: { 
        examId, 
        examTitle,
        grade,
        subject,
        score: finalScore.toString(),
        maxScore: finalMaxScore.toString(),
        percentage: finalPercentage.toString(),
        totalQuestions: totalQuestions.toString(),
        answeredQuestions: answeredQuestions.toString(),
        isPass: isPass.toString(),
        attemptId: attemptId,
        answers: params.answers, 
        questions: params.questions,
      }
    });
  };

  const handleBackToHome = () => {
    router.replace("/(root)/(tabs)/home");
  };

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={60} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRankingData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Main Content Card */}
        <View style={styles.examCard}>
          {/* Exam Title and Grade */}
          <View style={styles.titleSection}>
            <Text style={styles.examTitle}>{examTitle}</Text>
            <Text style={styles.examGrade}>
              {grade} • {subject}
            </Text>
          </View>

          {/* Completed Badge */}
          <View style={styles.completedBadge}>
            <MaterialIcons name="check-circle" size={16} color="#28A745" />
            <Text style={styles.completedText}>Completed</Text>
          </View>

          {/* Auto Submit Notification */}
          {isAutoSubmit && (
            <View style={styles.autoSubmitBadge}>
              <MaterialIcons name="timer" size={16} color="#FF6B35" />
              <Text style={styles.autoSubmitText}>Auto Submitted (Time Up)</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.description}>
            {params.description || 
              "Algebra is a branch of mathematics that deals with abstract systems known as algebraic structures, and the manipulation of expressions within those systems."}
          </Text>

          {/* Options Section */}
          <View style={styles.optionsSection}>

            {/* Your Marks Section */}
            <View style={styles.marksSection}>
              <Text style={styles.marksLabel}>Your Marks</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreText}>{finalScore}/{finalMaxScore}</Text>
              </View>
              <View style={styles.ratingContainer}>
                <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {finalPercentage >= 90 ? "Outstanding!" : 
                   finalPercentage >= 80 ? "Excellent Work" : 
                   finalPercentage >= 70 ? "Great Job" : 
                   finalPercentage >= 60 ? "Good Effort" : 
                   finalPercentage >= 40 ? "Passed" : "Keep Trying"}
                </Text>
              </View>
            </View>
          </View>

          {/* Performance Summary */}
          <View style={styles.performanceSummary}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{finalPercentage.toFixed(1)}%</Text>
                <Text style={styles.summaryLabel}>Score</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryItem}>
                <MaterialIcons 
                  name={isPass ? "check-circle" : "cancel"} 
                  size={20} 
                  color={isPass ? "#28A745" : "#FF4444"} 
                />
                <Text style={[
                  styles.summaryValue, 
                  { color: isPass ? "#28A745" : "#FF4444" }
                ]}>
                  {isPass ? "Passed" : "Failed"}
                </Text>
                <Text style={styles.summaryLabel}>Status</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
            </View>

            {/* View Ranking Option - Only show if ranking is available */}
            {hasRankings && (
              <TouchableOpacity
                style={styles.rankingOption}
                onPress={handleViewRanking}
              >
                <View style={styles.rankingOptionContent}>
                  <MaterialIcons name="leaderboard" size={20} color="#28A745" />
                  <Text style={styles.rankingOptionText}>View Ranking</Text>
                  {userRanking && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>
                        #{userRanking.islandRank || userRanking.districtRank || "N/A"}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.homeButton}
              onPress={handleBackToHome}
            >
              <MaterialIcons name="home" size={20} color="#0057FF" />
              <Text style={styles.homeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Info Box */}
        <View style={styles.bottomInfoBox}>
          <MaterialIcons name="info" size={24} color="#0057FF" />
          <Text style={styles.bottomInfoText}>
            {hasRankings 
              ? "You can review your answers and see the correct solutions in the corrected paper."
              : "Results are being processed. Check back later for detailed analysis."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F4F9",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F4F9",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#0057FF",
    borderRadius: 8,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: "#6c757d",
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  /* Exam Card */
  examCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },

  /* Title Section */
  titleSection: {
    marginBottom: 10,
  },
  examTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  examGrade: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },

  /* Completed Badge */
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  completedText: {
    color: "#28A745",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },

  /* Auto Submit Badge */
  autoSubmitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 15,
  },
  autoSubmitText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 15,
  },

  /* Description */
  description: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 25,
  },

  /* Options Section */
  optionsSection: {
    marginBottom: 25,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    margin: 10,
    borderColor: "#0057FF",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginLeft: 12,
  },

  /* Marks Section */
  marksSection: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
  },
  marksLabel: {
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    marginBottom: 10,
  },
  scoreContainer: {
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#0057FF",
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingText: {
    fontSize: 16,
    color: "#FB8C00",
    fontWeight: "600",
  },

  /* Performance Summary */
  performanceSummary: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 20,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 6,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#DDD",
  },

  /* Ranking Option */
  rankingOption: {
    marginBottom: 15,
  },
  rankingOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 12,
    borderColor: "#28A745",
    borderWidth: 0.5,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    marginLeft: 12,
    marginRight: 8,
  },
  rankBadge: {
    backgroundColor: "#28A745",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rankBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  /* Action Buttons */
  homeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEFF",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  homeText: {
    color: "#0057FF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Bottom Info Box */
  bottomInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EEFF",
    padding: 15,
    borderRadius: 12,
    gap: 12,
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 14,
    color: "#0057FF",
    lineHeight: 20,
  },
});