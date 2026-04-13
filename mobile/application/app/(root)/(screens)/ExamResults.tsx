import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import { images } from "@/constants";

export default function ExamResults() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parse all parameters
  const score = parseInt(params.score as string) || 0;
  const maxScore = parseInt(params.maxScore as string) || 100;
  const totalQuestions = parseInt(params.totalQuestions as string) || 0;
  const answeredQuestions = parseInt(params.answeredQuestions as string) || 0;
  const percentage = parseFloat(params.percentage as string) || 0;
  const passed = params.passed === 'true';
  const examId = params.examId as string;
  const examTitle = params.examTitle as string || 'Exam';
  const isAutoSubmit = params.isAutoSubmit === 'true';
  const useBackendAPI = params.useBackendAPI === 'true';
  const attemptId = params.attemptId as string;

  // Calculate values
  const calculatedPercentage = percentage > 0 ? percentage : (score / maxScore) * 100;
  const isPass = passed !== undefined ? passed : calculatedPercentage >= 40;
  const passingScore = Math.ceil(maxScore * 0.4);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Indicator */}
        {isAutoSubmit && (
          <View style={styles.autoSubmitBadge}>
            <MaterialIcons name="timer" size={16} color="#FF6B35" />
            <Text style={styles.autoSubmitText}>Auto Submitted</Text>
          </View>
        )}

        {/* Main Titles */}
        <Text style={styles.wellDone}>
          {isPass ? "Well-done" : "Keep Trying"}
        </Text>
        <Text style={styles.subText}>
          You have completed your test
        </Text>

        {/* Score Circle */}
        <View style={styles.circleWrapper}>
          <View style={[
            styles.scoreCircle,
            { borderColor: isPass ? "#28A745" : "#FF4444" }
          ]}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>
              {score}/{maxScore}
            </Text>
            <Text style={[
              styles.percentageText,
              { color: isPass ? "#28A745" : "#FF4444" }
            ]}>
              {calculatedPercentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Result Details
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[
                styles.detailValue,
                { color: isPass ? "#28A745" : "#FF4444" }
              ]}>
                {isPass ? "Passed ✓" : "Failed ✗"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Questions</Text>
              <Text style={styles.detailValue}>
                {answeredQuestions}/{totalQuestions}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Percentage</Text>
              <Text style={[
                styles.detailValue,
                { color: calculatedPercentage >= 40 ? "#28A745" : "#FF4444" }
              ]}>
                {calculatedPercentage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Passing Marks</Text>
              <Text style={styles.detailValue}>
                {passingScore}/{maxScore}
              </Text>
            </View>
          </View>
        </View> */}

        {/* Congratulations Message */}
        <Text style={styles.congratsTitle}>
          {isPass ? "Congratulation" : "Don't Give Up"}
        </Text>
        <Text style={styles.subTextBlue}>
          {isPass ? "You Are Doing Amazing!" : "Practice Makes Perfect!"}
        </Text>

        {/* Image */}
        <Image
          source={images.results}
          style={styles.resultImage}
        />

        {/* Buttons */}
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            // Navigate to corrected paper
            router.push({
              pathname: '/(root)/(screens)/CorrectionSheet',
              params: { 
                examId, 
                examTitle,
                score: score.toString(),
                maxScore: maxScore.toString(),
                percentage: calculatedPercentage.toFixed(2),
                totalQuestions: totalQuestions.toString(),
                answeredQuestions: answeredQuestions.toString(),
                isPass: isPass.toString(),
                attemptId: attemptId,
                answers: params.answers, 
              }
            });
          }}
        >
          <MaterialIcons name="visibility" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryText}>View Corrected Paper</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/home")}
          style={styles.secondaryButton}
        >
          <MaterialIcons name="home" size={20} color="#555" style={{ marginRight: 8 }} />
          <Text style={styles.secondaryText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------- STYLES ----------------------

const PRIMARY = "#0057FF";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    alignItems: "center",
    paddingVertical: 20,
  },
  autoSubmitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  autoSubmitText: {
    fontSize: 14,
    color: "#FF6B35",
    fontWeight: "600",
    marginLeft: 6,
  },
  wellDone: {
    fontSize: 26,
    color: PRIMARY,
    fontWeight: "700",
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
  },

  // -------- Circle Score UI --------
  circleWrapper: {
    alignItems: "center",
    marginBottom: 25,
  },
  scoreCircle: {
    width: 170,
    height: 170,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E9F1FF",
  },
  scoreLabel: {
    fontSize: 18,
    color: "#000",
    marginBottom: 4,
    fontWeight: "600",
  },
  scoreValue: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#000",
  },
  percentageText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
  },

  // -------- Details Card --------
  detailsCard: {
    backgroundColor: "#F8F9FA",
    width: "85%",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  // -------- Congratulations Text --------
  congratsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PRIMARY,
    marginTop: 0,
  },
  subTextBlue: {
    fontSize: 14,
    color: PRIMARY,
    marginBottom: 20,
  },

  // -------- Image Styling --------
  resultImage: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 15,
  },

  // -------- Buttons --------
  primaryButton: {
    width: "85%",
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    width: "85%",
    backgroundColor: "#D9D9D9",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 25,
    flexDirection: "row",
    justifyContent: "center",
  },
  secondaryText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
  },
});