import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";
import { Image } from "react-native";
import { icons, images } from "@/constants";

export default function ExamStart() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser, accessToken } = useAuthStore();

  // Get exam data from navigation params
  const examId = params.examId as string;
  const examTitle = params.examTitle as string;
  const duration = params.duration as string;
  const grade = params.grade as string;

  // State for exam details
  const [examDetails, setExamDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [existingAttempt, setExistingAttempt] = useState<any>(null);

  // Format time display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Helper function to format minutes to standard time format
  const formatDurationStandard = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) {
      return `${mins} min`;
    } else if (mins === 0) {
      return `${hours} hours`;
    } else {
      return `${hours} hr ${mins} min`;
    }
  };

  // Safe JSON parsing function
  const safeParseJSON = (jsonString: string | any, defaultValue: any = []) => {
    try {
      if (typeof jsonString === "string") {
        return JSON.parse(jsonString);
      }
      return jsonString || defaultValue;
    } catch (error) {
      console.warn("JSON parse error:", error);
      return defaultValue;
    }
  };

  // Process options from backend
  const processOptions = (options: any) => {
    if (!options) return [];
    
    if (Array.isArray(options)) {
      return options.map((opt, index) => {
        // Handle nested array case
        if (Array.isArray(opt) && opt.length > 0) {
          return {
            id: `opt-${index}`,
            text: String(opt[0] || opt),
            originalData: opt,
            isCorrect: false
          };
        }
        // Handle string/object case
        const optionText = typeof opt === 'string' ? opt : 
                          (opt?.text || opt?.option || opt?.value || String(opt));
        return {
          id: `opt-${index}`,
          text: optionText,
          originalData: opt,
          isCorrect: false
        };
      });
    }
    
    return [];
  };

  // Fetch exam data
  const fetchExamData = async () => {
    try {
      setLoading(true);
      
      console.log("🔍 Fetching exam details for ID:", examId);
      console.log("🔑 Token available:", !!accessToken);

      // 1. Fetch exam details
      const examResponse = await apiFetch(`/api/v1/exams/${examId}`);
      
      if (!examResponse.ok) {
        const errorText = await examResponse.text();
        console.error("❌ Failed to fetch exam details:", errorText);
        throw new Error("Failed to fetch exam details");
      }
      
      const examData = await examResponse.json();
      const exam = examData.data || examData;
      setExamDetails(exam);

      console.log("📊 Exam details received:", {
        id: exam.id,
        title: exam.title,
        questionCount: exam.questions?.length || 0
      });

      // 2. Process questions from exam details
      if (exam.questions && Array.isArray(exam.questions)) {
        console.log(`📝 Processing ${exam.questions.length} questions from exam details`);
        
        const processedQuestions = exam.questions.map((q: any, index: number) => {
          const options = processOptions(q.options);
          
          console.log(`   Q${index + 1}: "${q.question}"`, {
            optionsCount: options.length,
            options: options.map(opt => opt.text)
          });

          return {
            id: q.id || `q-${index}`,
            question: q.question || q.content || `Question ${index + 1}`,
            type: q.type || "MULTIPLE_CHOICE",
            points: q.points || q.marks || 1,
            correctAnswer: q.correctAnswer,
            options: options,
          };
        });

        setQuestions(processedQuestions);
        console.log(`✅ Loaded ${processedQuestions.length} questions`);
      } else {
        console.warn("⚠️ No questions found in exam details");
      }

      // 3. Check for existing attempts (optional - remove if causing 403)
      try {
        console.log("🔄 Checking for existing attempts...");
        const attemptsResponse = await apiFetch(
          `/api/v1/exams/${examId}/attempts?status=IN_PROGRESS`
        );
        
        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json();
          console.log("Attempts response:", attemptsData);
          
          if (attemptsData.data && Array.isArray(attemptsData.data)) {
            const inProgressAttempt = attemptsData.data.find(
              (attempt: any) => attempt.status === 'IN_PROGRESS'
            );
            
            if (inProgressAttempt) {
              console.log("✅ Found existing attempt:", inProgressAttempt.id);
              setExistingAttempt(inProgressAttempt);
            }
          }
        }
      } catch (attemptError) {
        console.warn("⚠️ Could not check for existing attempts:", attemptError);
        // Continue without attempts check - this is not critical
      }

      // 4. Calculate time until exam ends
      if (exam.startTime && exam.endTime) {
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);
        const now = new Date();

        if (now >= startTime && now <= endTime) {
          const totalMinutes = Math.floor(
            (endTime.getTime() - now.getTime()) / (1000 * 60)
          );
          setTimeRemaining(formatTime(totalMinutes));
        }
      }
    } catch (error) {
      console.error("❌ Error fetching exam data:", error);
      Alert.alert("Error", "Failed to load exam details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBeginExam = async () => {
    try {
      console.log("🚀 Starting exam with ID:", examId);
      
      // Get token
      const token = accessToken || (params.token as string);
      
      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please login again to start the exam.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Login", 
              onPress: () => router.push("/(auth)/sign-in") 
            }
          ]
        );
        return;
      }

      // Prepare exam questions
      let examQuestions = questions;
      
      if (examQuestions.length === 0 && examDetails?.questions) {
        // Fallback to exam details questions
        examQuestions = examDetails.questions.map((q: any, index: number) => {
          const options = processOptions(q.options);
          return {
            id: q.id || `q-${index}`,
            question: q.question || q.content || `Question ${index + 1}`,
            type: q.type || "MULTIPLE_CHOICE",
            points: q.points || q.marks || 1,
            correctAnswer: q.correctAnswer,
            options: options,
          };
        });
      }

      if (examQuestions.length === 0) {
        Alert.alert("Error", "No questions available for this exam.");
        return;
      }

      let attemptId = `local-attempt-${Date.now()}`;
      let useBackendAPI = false;
      let isResuming = false;

      // Check if we have an existing attempt first
      if (existingAttempt) {
        console.log(`✅ Resuming existing attempt: ${existingAttempt.id}`);
        attemptId = existingAttempt.id;
        useBackendAPI = true;
        isResuming = true;
      } else {
        // Try to create new attempt via API
        try {
          const startResponse = await apiFetch(
            `/api/v1/exams/${examId}/start`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-client-type": "mobile",
              },
              body: JSON.stringify({
                browserInfo: "Mobile App",
                faceVerificationData: null,
              }),
            }
          );
          
          if (startResponse.ok) {
            const startData = await startResponse.json();
            console.log("✅ Backend start successful:", startData);
            
            if (startData.attempt?.id) {
              attemptId = startData.attempt.id;
              useBackendAPI = true;
            }
            
            // Use questions from start response if available
            if (startData.questions && Array.isArray(startData.questions)) {
              examQuestions = startData.questions.map((q: any, index: number) => {
                const options = processOptions(q.options);
                return {
                  id: q.id || `q-${index}`,
                  question: q.question || q.content || `Question ${index + 1}`,
                  type: q.type || "MULTIPLE_CHOICE",
                  points: q.points || q.marks || 1,
                  correctAnswer: q.correctAnswer,
                  options: options,
                };
              });
            }
          } else if (startResponse.status === 429) {
            console.warn("⚠️ Rate limited, using local mode");
            // Continue with local mode
          } else {
            const errorText = await startResponse.text();
            console.warn("⚠️ Backend /start failed:", startResponse.status, errorText);
          }
        } catch (apiError) {
          console.warn("⚠️ API error, using local mode:", apiError);
        }
      }

      console.log(
        `📝 Navigating with ${examQuestions.length} questions, ` +
        `using ${useBackendAPI ? "backend" : "local"} attempt, ` +
        `${isResuming ? "resuming" : "starting new"}`
      );

      // Navigate to exam-taking page
      router.push({
        pathname: "/(root)/(screens)/ExamTaking",
        params: {
          examId,
          attemptId,
          examTitle: examTitle || examDetails?.title || "Exam",
          duration: duration || examDetails?.duration?.toString() || "60",
          questionCount: examQuestions.length.toString(),
          totalMarks: examDetails?.totalMarks?.toString() || "100",
          passingMarks: examDetails?.passingMarks?.toString() || "40",
          questions: JSON.stringify(examQuestions),
          useBackendAPI: useBackendAPI.toString(),
          isResuming: isResuming.toString(),
          token: token,
          existingAttemptId: existingAttempt?.id || "",
          examDetails: JSON.stringify(examDetails),
        },
      });
    } catch (error: any) {
      console.error("❌ Error starting exam:", error);
      
      Alert.alert(
        "Starting Exam",
        "Starting in local mode. Your progress will be saved locally.",
        [
          { 
            text: "Continue", 
            onPress: () => {
              const examQuestions = questions.length > 0 ? questions : 
                (examDetails?.questions || []);
              
              const processedQuestions = examQuestions.map((q: any, index: number) => {
                const options = processOptions(q.options);
                return {
                  id: q.id || `q-${index}`,
                  question: q.question || q.content || `Question ${index + 1}`,
                  type: q.type || "MULTIPLE_CHOICE",
                  points: q.points || q.marks || 1,
                  correctAnswer: q.correctAnswer,
                  options: options,
                };
              });
              
              router.push({
                pathname: "/(root)/(screens)/ExamTaking",
                params: {
                  examId,
                  attemptId: `local-attempt-${Date.now()}`,
                  examTitle: examTitle || examDetails?.title || "Exam",
                  duration: duration || examDetails?.duration?.toString() || "60",
                  questionCount: processedQuestions.length.toString(),
                  totalMarks: examDetails?.totalMarks?.toString() || "100",
                  passingMarks: examDetails?.passingMarks?.toString() || "40",
                  questions: JSON.stringify(processedQuestions),
                  useBackendAPI: "false",
                  isResuming: "false",
                  examDetails: JSON.stringify(examDetails),
                },
              });
            }
          }
        ]
      );
    }
  };

  // Handle exit
  const handleExit = () => {
    Alert.alert(
      "Exit Exam",
      "Are you sure you want to exit? You can return to this exam later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          onPress: () => router.back(),
        },
      ]
    );
  };

  // Load exam data on component mount
  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading exam details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleExit} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exams</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Exam Card */}
        <View style={styles.examCard}>
          <View style={styles.cardHeader}>
            <View style={styles.subjectIcon}>
              <MaterialIcons name="menu-book" size={30} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.examTitle}>
                {examTitle || examDetails?.title || "Exam"}
              </Text>
              <View style={styles.row}>
                <Text style={styles.tagText}>{grade || examDetails?.grade?.name || examDetails?.grade}</Text>

                <View style={styles.dot} />
                <View style={styles.durationContainer}>
                  <MaterialIcons name="timer" size={15} color="red" />
                  <Text style={styles.durationText}>
                    {formatDurationStandard(
                      parseInt(duration) || examDetails?.duration || 60
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.description}>
            {examDetails?.description ||
              "Complete the exam within the given time limit. Read each question carefully before answering."}
          </Text>

          {/* Questions Count Info */}
          {questions.length > 0 && (
            <View style={styles.questionsInfo}>
              <MaterialIcons name="question-answer" size={18} color="#0057FF" />
              <Text style={styles.questionsInfoText}>
                {questions.length} questions available
              </Text>
            </View>
          )}

          {/* Rules Dropdown */}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowRules(!showRules)}
          >
            <Text style={styles.dropdownText}>Exam Rules</Text>
            <MaterialIcons
              name={showRules ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={28}
              color="#0057FF"
            />
          </TouchableOpacity>

          {showRules && (
            <View style={styles.rulesContainer}>
              <View style={styles.ruleRow}>
                <Image
                  source={images.rule_camr}
                  style={styles.rulesIcon}
                />
                <Text style={styles.ruleText}>Camera Must Remain On </Text>
              </View>
              <View style={styles.ruleRow}>
                <Image
                  source={images.rule_face}
                  style={styles.rulesIcon}
                />
                <Text style={styles.ruleText}>AI Face Recognition Active </Text>
              </View>
              <View style={styles.ruleRow}>
                <Image
                  source={images.rule_timer}
                  style={styles.rulesIcon}
                />
                <Text style={styles.ruleText}>Time Restriction Applies </Text>
              </View>
              <View style={styles.ruleRow}>
                <Image
                  source={images.rule_eye}
                  style={styles.rulesIcon}
                />
                <Text style={styles.ruleText}>Auto Hide on Face Mismatch </Text>
              </View>
            </View>
          )}

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startExamBtn}
            onPress={handleBeginExam}
          >
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
            <Text style={styles.startExamText}>Start Exam</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Boxes */}
        <View style={styles.bottomContainer}>
          <View style={styles.infoBox}>
            <MaterialIcons name="help-outline" size={26} color="#0057FF" />
            <Text style={styles.infoValue}>
              {questions.length > 0
                ? questions.length
                : examDetails?.questionCount || "?"}
            </Text>
            <Text style={styles.infoLabel}>Questions</Text>
          </View>

          <View style={[styles.infoBox, { backgroundColor: "#FFF3E0" }]}>
            <MaterialIcons name="emoji-events" size={26} color="#FB8C00" />
            <Text style={styles.infoValue}>
              {examDetails?.totalMarks || examDetails?.marks || 100}
            </Text>
            <Text style={styles.infoLabel}>Marks</Text>
          </View>
        </View>

        {/* Time Remaining Info */}
        {timeRemaining && (
          <View style={styles.timeRemainingCard}>
            <MaterialIcons name="schedule" size={20} color="#FF6B6B" />
            <Text style={styles.timeRemainingText}>
              Time Remaining:{" "}
              <Text style={{ fontWeight: "700" }}>{timeRemaining}</Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F4F9",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },

  /* Card */
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

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  subjectIcon: {
    width: 55,
    height: 55,
    borderRadius: 15,
    backgroundColor: "#0057FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  examTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  tagText: {
    fontSize: 13,
    color: "#555",
  },
  dot: {
    width: 5,
    height: 5,
    backgroundColor: "#999",
    borderRadius: 50,
    marginHorizontal: 8,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 13,
    color: "red",
    marginLeft: 4,
  },

  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },

  /* Questions Info */
  questionsInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8EEFF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  questionsInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#0057FF",
    fontWeight: "500",
  },

  /* Dropdown */
  dropdown: {
    backgroundColor: "#F8F8F8",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0057FF",
  },

  rulesContainer: {
    marginTop: 5,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ruleText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#9797AA",
    fontWeight: "500",
    lineHeight: 20,
    marginTop:8,
  },

  /* Start Exam */
  startExamBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0057FF",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 15,
  },
  startExamText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },

  /* Bottom Boxes */
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#E8EEFF",
    paddingVertical: 18,
    marginHorizontal: 5,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 4,
    alignItems: "center",
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginTop: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: "#555",
  },

  /* Time Remaining */
  timeRemainingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  timeRemainingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#555",
    flex: 1,
  },

  rulesIcon: {
    width: 28,
    height: 28,
    backgroundColor:"#0057FF",
    padding:6,
    margin:4,
    borderRadius:24,
  },
});