import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import useAuthStore from "../../../stores/authStore";
import { apiFetch } from "../../../utils/api";

export default function ExamTaking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { currentUser } = useAuthStore();

  // Get data from navigation
  const examId = params.examId as string;
  const examTitle = (params.examTitle as string) || "Exam";
  const duration = parseInt(params.duration as string) || 60;
  const attemptId = params.attemptId as string;
  const totalMarks = parseInt(params.totalMarks as string) || 100;
  const passingMarks = parseInt(params.passingMarks as string) || 40;
  const useBackendAPI = params.useBackendAPI === "true";

  // State
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Process options from backend
  const processOptions = (options: any) => {
    if (!options) return [];
    
    if (Array.isArray(options)) {
      return options.map((opt, index) => {
        // Handle nested array case (from your backend logs)
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

  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        console.log("🔍 Loading questions...");

        if (params.questions) {
          try {
            const parsedQuestions = JSON.parse(params.questions as string);
            console.log(`✅ Loaded ${parsedQuestions.length} questions from params`);
            
            // Process the questions to ensure proper options
            const processedQuestions = parsedQuestions.map((q: any, index: number) => {
              const options = processOptions(q.options);
              
              console.log(`   Q${index + 1}: "${q.question}"`, {
                optionsCount: options.length,
                optionTexts: options.map(opt => opt.text)
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
            return;
          } catch (parseError) {
            console.warn("❌ Failed to parse questions from params:", parseError);
            await fetchQuestionsFromBackend();
          }
        } else {
          await fetchQuestionsFromBackend();
        }
      } catch (error) {
        console.error("❌ Error loading questions:", error);
        Alert.alert(
          "Error",
          "Failed to load exam questions. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [params.questions]);

  const fetchQuestionsFromBackend = async () => {
    try {
      console.log("🔍 Fetching questions from backend...");

      // Try to get exam details from params first
      if (params.examDetails) {
        try {
          const examDetails = JSON.parse(params.examDetails as string);
          console.log("📊 Using exam details from params");
          
          if (examDetails.questions && Array.isArray(examDetails.questions)) {
            const transformedQuestions = examDetails.questions.map((q: any, index: number) => {
              const options = processOptions(q.options);
              
              console.log(`   Q${index + 1}: "${q.question}"`, {
                optionsCount: options.length,
                optionTexts: options.map(opt => opt.text)
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

            setQuestions(transformedQuestions);
            console.log(`✅ Loaded ${transformedQuestions.length} questions from exam details`);
            return;
          }
        } catch (e) {
          console.warn("❌ Could not parse examDetails from params:", e);
        }
      }

      // Fallback: Fetch from API
      console.log(`📡 Fetching exam from API: /api/v1/exams/${examId}`);
      const response = await apiFetch(`/api/v1/exams/${examId}`);
      
      if (response.ok) {
        const examData = await response.json();
        const exam = examData.data || examData;
        
        console.log("📊 Exam data received from API");

        if (exam.questions && Array.isArray(exam.questions)) {
          const transformedQuestions = exam.questions.map((q: any, index: number) => {
            const options = processOptions(q.options);
            
            console.log(`   Q${index + 1}: "${q.question}"`, {
              optionsCount: options.length,
              optionTexts: options.map(opt => opt.text)
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

          setQuestions(transformedQuestions);
          console.log(`✅ Loaded ${transformedQuestions.length} questions from API`);
        } else {
          console.warn("⚠️ No questions found in exam data");
          Alert.alert("Error", "No questions available for this exam.");
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch exam: ${response.status}`, errorText);
        Alert.alert("Error", "Failed to load exam from server.");
      }
    } catch (error) {
      console.error("❌ Error loading questions:", error);
      Alert.alert("Error", "Failed to load questions. Please try again.");
    }
  };

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0 || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, questions.length]);

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Navigation
  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  // Auto submit
  const handleAutoSubmit = () => {
    Alert.alert("Time's Up!", "The exam time has expired.", [
      { text: "OK", onPress: () => handleSubmitExam(true) },
    ]);
  };

  // Submit exam
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (submitting) return;

    setSubmitting(true);

    try {
      // Calculate score
      let totalScore = 0;

      questions.forEach((q) => {
        const selectedOptionId = answers[q.id];
        if (selectedOptionId) {
          const selectedOption = q.options?.find(
            (opt: any) => opt.id === selectedOptionId
          );
          // Check if selected option matches correctAnswer
          if (
            selectedOption &&
            q.correctAnswer &&
            (selectedOption.text === q.correctAnswer ||
              selectedOption.originalData === q.correctAnswer)
          ) {
            totalScore += q.points || 1;
          }
        }
      });

      const calculatedPercentage = (totalScore / totalMarks) * 100;
      const calculatedPassed = totalScore >= passingMarks;

      // Submit to backend if needed
      if (useBackendAPI && attemptId && !attemptId.startsWith("local-attempt-")) {
        const answerData = Object.keys(answers).map((questionId) => {
          const question = questions.find((q) => q.id === questionId);
          const selectedOptionId = answers[questionId];
          const selectedOption = question?.options?.find(
            (opt: any) => opt.id === selectedOptionId
          );

          return {
            questionId,
            selectedAnswer: selectedOption?.text || selectedOptionId,
            selectedOptionId: selectedOptionId,
            timeSpent: 0,
          };
        });

        try {
          const submitResponse = await apiFetch(
            `/api/v1/exams/attempts/${attemptId}/submit`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                answers: answerData,
                timeSpent: duration * 60 - timeRemaining,
                monitoringEvents: [],
              }),
            }
          );

          if (submitResponse.ok) {
            const submitData = await submitResponse.json();
            if (submitData.score !== undefined) {
              totalScore = submitData.score;
            }
          }
        } catch (backendError) {
          console.warn("Backend submission error:", backendError);
        }
      }
      // Navigate to results
      router.replace({
        pathname: "/(root)/(screens)/ExamResults",
        params: {
          examId,
          examTitle,
          totalQuestions: questions.length.toString(),
          answeredQuestions: Object.keys(answers).length.toString(),
          score: totalScore.toString(),
          maxScore: totalMarks.toString(),
          percentage: calculatedPercentage.toFixed(2).toString(),
          passed: calculatedPassed.toString(),
          isAutoSubmit: isAutoSubmit.toString(),
          useBackendAPI: useBackendAPI.toString(),
          attemptId: attemptId,
          answers: JSON.stringify(answers),
        },
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
      Alert.alert("Error", "Failed to submit exam. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm submit
  const confirmSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    Alert.alert(
      "Submit Exam",
      `You have answered ${answeredCount} out of ${questions.length} questions. Are you sure you want to submit?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: () => handleSubmitExam(false) },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0057FF" />
        <Text style={styles.loadingText}>Loading Exam Questions</Text>
        <Text style={styles.loadingSubText}>Please wait...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF4444" />
        <Text style={styles.loadingText}>No Questions Available</Text>
        <Text style={styles.loadingSubText}>This exam has no questions</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                "Exit Exam",
                "Are you sure you want to exit? Your progress will be saved.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Exit", onPress: () => router.back() },
                ]
              );
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.titleWrapper}>
            <Text style={styles.examTitle} numberOfLines={1}>
              {examTitle}
            </Text>
            <Text style={styles.questionCounter}>
              Q{currentQuestionIndex + 1}/{questions.length}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.timerBadge}>
            <MaterialIcons name="access-time" size={16} color="#FF4444" />
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </View>
          <View style={styles.answeredBadge}>
            <Text style={styles.answeredText}>
              {answeredCount}/{questions.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressWrapper}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
      </View>

      {/* Question Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionMeta}>
              <View style={styles.questionNumberCircle}>
                <Text style={styles.questionNumber}>
                  {currentQuestionIndex + 1}
                </Text>
              </View>
              <Text style={styles.questionPoints}>
                {currentQuestion.points || 1} point
                {currentQuestion.points !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {/* Options */}
          <View style={styles.optionsWrapper}>
            {currentQuestion.options?.map((option: any, index: number) => {
              const isSelected = answers[currentQuestion.id] === option.id;
              return (
                <TouchableOpacity
                  key={option.id || `option-${index}`}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() =>
                    handleAnswerSelect(currentQuestion.id, option.id)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View
                      style={[
                        styles.optionIndicator,
                        isSelected && styles.optionIndicatorSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionLetter,
                          isSelected && styles.optionLetterSelected,
                        ]}
                      >
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                      numberOfLines={3}
                    >
                      {option.text || option.originalData || "No answer text"}
                    </Text>
                  </View>
                  {isSelected && (
                    <MaterialIcons
                      name="check-circle"
                      size={22}
                      color="#0057FF"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.prevButton,
              currentQuestionIndex === 0 && styles.navButtonDisabled,
            ]}
            onPress={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <MaterialIcons name="chevron-left" size={22} color="#FFF" />
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          {currentQuestionIndex < questions.length - 1 ? (
            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={goToNextQuestion}
            >
              <Text style={styles.navButtonText}>Next</Text>
              <MaterialIcons name="chevron-right" size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.submitButton]}
              onPress={confirmSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Text style={styles.navButtonText}>Submit Exam</Text>
                  <MaterialIcons name="send" size={20} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  loadingSubText: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#0057FF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E8ECF4",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  titleWrapper: {
    flex: 1,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  questionCounter: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FF4444",
  },
  answeredBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  answeredText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },

  // Progress
  progressWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E9ECEF",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0057FF",
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0057FF",
    minWidth: 35,
  },

  // Content
  content: {
    flex: 1,
  },
  questionCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  questionHeader: {
    marginBottom: 16,
  },
  questionMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EAF0FF",
    justifyContent: "center",
    alignItems: "center",
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C5BF6",
  },
  questionPoints: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  questionText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111",
    lineHeight: 24,
    marginBottom: 24,
  },

  // Options
  optionsWrapper: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: "#F8F9FA",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E9ECEF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionCardSelected: {
    backgroundColor: "#3C5BF6",
    borderColor: "#3C5BF6",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9ECEF",
    justifyContent: "center",
    alignItems: "center",
  },
  optionIndicatorSelected: {
    backgroundColor: "#FFF",
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#495057",
  },
  optionLetterSelected: {
    color: "#3C5BF6",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  optionTextSelected: {
    color: "#FFF",
    fontWeight: "500",
  },

  // Footer
  footer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: "#E8ECF4",
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  prevButton: {
    backgroundColor: "#6C757D",
  },
  nextButton: {
    backgroundColor: "#3C5BF6",
  },
  submitButton: {
    backgroundColor: "#28A745",
  },
  navButtonDisabled: {
    backgroundColor: "#CED4DA",
    opacity: 0.7,
  },
  navButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});