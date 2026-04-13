import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { apiFetch } from "../../../utils/api";

export default function CorrectionSheet() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get data from navigation
  const examId = params.examId as string;
  const examTitle = params.examTitle as string || 'Exam Correction';
  const score = parseInt(params.score as string) || 0;
  const maxScore = parseInt(params.maxScore as string) || 100;
  const percentage = parseFloat(params.percentage as string) || 0;
  const totalQuestions = parseInt(params.totalQuestions as string) || 0;
  const answeredQuestions = parseInt(params.answeredQuestions as string) || 0;
  
  // State
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [answersData, setAnswersData] = useState<Record<string, any>>({});

  // Process options from backend (same as other files)
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

  // Load user's answers from params if available
  useEffect(() => {
    if (params.answers) {
      try {
        const parsedAnswers = JSON.parse(params.answers as string);
        setAnswersData(parsedAnswers);
        console.log("✅ Loaded answers from params:", Object.keys(parsedAnswers).length);
      } catch (error) {
        console.warn("❌ Could not parse answers from params:", error);
      }
    }
  }, [params.answers]);

  // Load correction data
  useEffect(() => {
    const loadCorrectionData = async () => {
      try {
        setLoading(true);
        
        console.log("🔍 Loading correction data for exam:", examId);
        
        // Try to get questions from params first
        if (params.questions) {
          try {
            const parsedQuestions = JSON.parse(params.questions as string);
            console.log(`✅ Loaded ${parsedQuestions.length} questions from params`);
            
            const transformedQuestions = parsedQuestions.map((q: any, index: number) => {
              const options = processOptions(q.options);
              
              console.log(`   Q${index + 1}: "${q.question?.substring(0, 30)}..."`, {
                optionsCount: options.length,
                optionTexts: options.map(opt => opt.text)
              });

              // Get user's answer
              const userAnswer = answersData[q.id] || null;
              let isCorrect = false;
              let userSelectedOption = null;
              let userAnswerText = '';
              
              if (userAnswer) {
                if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
                  // Find the selected option
                  userSelectedOption = options.find((opt: any) => 
                    opt.id === userAnswer || opt.text === userAnswer
                  );
                  
                  if (userSelectedOption) {
                    userAnswerText = userSelectedOption.text;
                    // Check if correct
                    if (q.correctAnswer) {
                      const normalizedUser = userSelectedOption.text?.toString().trim().toLowerCase();
                      const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                      isCorrect = normalizedUser === normalizedCorrect;
                    }
                  } else {
                    userAnswerText = userAnswer;
                    // Direct text comparison
                    const normalizedUser = userAnswer?.toString().trim().toLowerCase();
                    const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                    isCorrect = normalizedUser === normalizedCorrect;
                  }
                } else if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') {
                  // For text answers, compare with correct answer
                  userAnswerText = userAnswer;
                  const normalizedUser = userAnswer?.toString().trim().toLowerCase();
                  const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                  isCorrect = normalizedUser === normalizedCorrect;
                }
              }
              
              return {
                id: q.id || `q-${index}`,
                question: q.question || q.content || `Question ${index + 1}`,
                type: q.type || 'MULTIPLE_CHOICE',
                points: q.points || q.marks || 1,
                correctAnswer: q.correctAnswer,
                userAnswer: userAnswer,
                userAnswerText: userAnswerText,
                options: options,
                isCorrect: isCorrect,
                userSelectedOption: userSelectedOption,
                placeholder: q.placeholder || 'Type your answer here...',
              };
            });
            
            setQuestions(transformedQuestions);
            return;
          } catch (parseError) {
            console.warn("❌ Failed to parse questions from params:", parseError);
          }
        }

        // Fallback: Fetch from API
        console.log(`📡 Fetching exam from API: /api/v1/exams/${examId}`);
        const examResponse = await apiFetch(`/api/v1/exams/${examId}`);
        
        if (examResponse.ok) {
          const examData = await examResponse.json();
          const exam = examData.data || examData;
          
          console.log("📊 Exam data received from API");

          if (exam.questions && Array.isArray(exam.questions)) {
            const transformedQuestions = exam.questions.map((q: any, index: number) => {
              const options = processOptions(q.options);
              
              console.log(`   Q${index + 1}: "${q.question?.substring(0, 30)}..."`, {
                optionsCount: options.length,
                optionTexts: options.map(opt => opt.text)
              });

              // Get user's answer
              const userAnswer = answersData[q.id] || null;
              let isCorrect = false;
              let userSelectedOption = null;
              let userAnswerText = '';
              
              if (userAnswer) {
                if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
                  // Find the selected option
                  userSelectedOption = options.find((opt: any) => 
                    opt.id === userAnswer || opt.text === userAnswer
                  );
                  
                  if (userSelectedOption) {
                    userAnswerText = userSelectedOption.text;
                    // Check if correct
                    if (q.correctAnswer) {
                      const normalizedUser = userSelectedOption.text?.toString().trim().toLowerCase();
                      const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                      isCorrect = normalizedUser === normalizedCorrect;
                    }
                  } else {
                    userAnswerText = userAnswer;
                    // Direct text comparison
                    const normalizedUser = userAnswer?.toString().trim().toLowerCase();
                    const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                    isCorrect = normalizedUser === normalizedCorrect;
                  }
                } else if (q.type === 'SHORT_ANSWER' || q.type === 'FILL_BLANK') {
                  // For text answers, compare with correct answer
                  userAnswerText = userAnswer;
                  const normalizedUser = userAnswer?.toString().trim().toLowerCase();
                  const normalizedCorrect = q.correctAnswer?.toString().trim().toLowerCase();
                  isCorrect = normalizedUser === normalizedCorrect;
                }
              }
              
              return {
                id: q.id || `q-${index}`,
                question: q.question || q.content || `Question ${index + 1}`,
                type: q.type || 'MULTIPLE_CHOICE',
                points: q.points || q.marks || 1,
                correctAnswer: q.correctAnswer,
                userAnswer: userAnswer,
                userAnswerText: userAnswerText,
                options: options,
                isCorrect: isCorrect,
                userSelectedOption: userSelectedOption,
                placeholder: q.placeholder || 'Type your answer here...',
              };
            });
            
            setQuestions(transformedQuestions);
            console.log(`✅ Loaded ${transformedQuestions.length} questions from API`);
          } else {
            console.warn("⚠️ No questions found in exam data");
            Alert.alert("Error", "No questions available for correction.");
          }
        } else {
          const errorText = await examResponse.text();
          console.error(`❌ Failed to fetch exam: ${examResponse.status}`, errorText);
          Alert.alert("Error", "Failed to load correction data from server.");
        }
      } catch (error) {
        console.error("❌ Error loading correction data:", error);
        Alert.alert("Error", "Failed to load correction sheet. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadCorrectionData();
  }, [examId, answersData, params.questions]);

  // Toggle question expansion
  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId);
  };

  // Get answer status for a question
  const getAnswerStatus = (question: any) => {
    if (!question.userAnswer) return 'not_answered';
    return question.isCorrect ? 'correct' : 'incorrect';
  };

  // Get question type display name
  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'Multiple Choice';
      case 'TRUE_FALSE': return 'True/False';
      case 'SHORT_ANSWER': return 'Short Answer';
      case 'FILL_BLANK': return 'Fill in the Blank';
      default: return type?.replace('_', ' ') || 'Question';
    }
  };

  // Get question type icon
  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE': return 'check-box-outline-blank';
      case 'TRUE_FALSE': return 'toggle-on';
      case 'SHORT_ANSWER': return 'short-text';
      case 'FILL_BLANK': return 'edit';
      default: return 'help-outline';
    }
  };

  // Render content based on question type
  const renderQuestionContent = (question: any, answerStatus: string) => {
    const userSelectedOption = question.userSelectedOption;
    
    switch (question.type) {
      case 'MULTIPLE_CHOICE':
      case 'TRUE_FALSE':
        return (
          <>
            {/* User's Answer */}
            <View style={styles.answerSection}>
              <Text style={styles.sectionLabel}>Your Answer:</Text>
              {answerStatus === 'not_answered' ? (
                <View style={styles.notAnsweredBox}>
                  <Text style={styles.notAnsweredText}>Not Answered</Text>
                  <MaterialIcons name="warning" size={20} color="#FF9800" />
                </View>
              ) : (
                <View style={[
                  styles.answerBox,
                  answerStatus === 'correct' && styles.correctAnswerBox,
                  answerStatus === 'incorrect' && styles.incorrectAnswerBox,
                ]}>
                  <Text style={[
                    styles.answerText,
                    answerStatus === 'correct' && styles.correctAnswerText,
                    answerStatus === 'incorrect' && styles.incorrectAnswerText,
                  ]}>
                    {question.userAnswerText || question.userAnswer || 'No answer provided'}
                  </Text>
                  {answerStatus === 'correct' && (
                    <MaterialIcons name="check-circle" size={20} color="#28A745" />
                  )}
                  {answerStatus === 'incorrect' && (
                    <MaterialIcons name="cancel" size={20} color="#FF4444" />
                  )}
                </View>
              )}
            </View>

            {/* Correct Answer */}
            <View style={styles.answerSection}>
              <Text style={styles.sectionLabel}>Correct Answer:</Text>
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerText}>
                  {question.correctAnswer || 'Not specified'}
                </Text>
                <MaterialIcons name="check-circle" size={20} color="#28A745" />
              </View>
            </View>

            {/* Options List (only for MC/TrueFalse) */}
            {question.options.length > 0 && (
              <View style={styles.optionsSection}>
                <Text style={styles.sectionLabel}>Options:</Text>
                {question.options.map((option: any, optIndex: number) => {
                  const isUserAnswer = userSelectedOption?.id === option.id;
                  // Determine if this option is correct based on the correctAnswer
                  const isCorrectAnswer = question.correctAnswer && 
                    option.text?.toString().trim().toLowerCase() === 
                    question.correctAnswer?.toString().trim().toLowerCase();
                  
                  return (
                    <View 
                      key={option.id} 
                      style={[
                        styles.optionRow,
                        isUserAnswer && isCorrectAnswer && styles.userCorrectOption,
                        isUserAnswer && !isCorrectAnswer && styles.userWrongOption,
                        !isUserAnswer && isCorrectAnswer && styles.correctOption,
                      ]}
                    >
                      <View style={[
                        styles.optionIndicator,
                        isUserAnswer && isCorrectAnswer && styles.optionIndicatorCorrect,
                        isUserAnswer && !isCorrectAnswer && styles.optionIndicatorWrong,
                        !isUserAnswer && isCorrectAnswer && styles.optionIndicatorCorrect,
                      ]}>
                        <Text style={[
                          styles.optionLetter,
                          isUserAnswer && isCorrectAnswer && styles.optionLetterCorrect,
                          isUserAnswer && !isCorrectAnswer && styles.optionLetterWrong,
                          !isUserAnswer && isCorrectAnswer && styles.optionLetterCorrect,
                        ]}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.optionText,
                        isUserAnswer && isCorrectAnswer && styles.optionTextCorrect,
                        isUserAnswer && !isCorrectAnswer && styles.optionTextWrong,
                        !isUserAnswer && isCorrectAnswer && styles.optionTextCorrect,
                      ]}>
                        {option.text || `Option ${optIndex + 1}`}
                      </Text>
                      
                      {isUserAnswer && isCorrectAnswer && (
                        <MaterialIcons name="check-circle" size={18} color="#28A745" />
                      )}
                      {isUserAnswer && !isCorrectAnswer && (
                        <MaterialIcons name="cancel" size={18} color="#FF4444" />
                      )}
                      {!isUserAnswer && isCorrectAnswer && (
                        <MaterialIcons name="check" size={18} color="#28A745" />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        );

      case 'SHORT_ANSWER':
      case 'FILL_BLANK':
        return (
          <>
            {/* User's Answer */}
            <View style={styles.answerSection}>
              <Text style={styles.sectionLabel}>Your Answer:</Text>
              {answerStatus === 'not_answered' ? (
                <View style={styles.notAnsweredBox}>
                  <Text style={styles.notAnsweredText}>Not Answered</Text>
                  <MaterialIcons name="warning" size={20} color="#FF9800" />
                </View>
              ) : (
                <View style={[
                  styles.answerBox,
                  answerStatus === 'correct' && styles.correctAnswerBox,
                  answerStatus === 'incorrect' && styles.incorrectAnswerBox,
                ]}>
                  <Text style={[
                    styles.answerText,
                    answerStatus === 'correct' && styles.correctAnswerText,
                    answerStatus === 'incorrect' && styles.incorrectAnswerText,
                  ]}>
                    {question.userAnswerText || 'No answer provided'}
                  </Text>
                  {answerStatus === 'correct' && (
                    <MaterialIcons name="check-circle" size={20} color="#28A745" />
                  )}
                  {answerStatus === 'incorrect' && (
                    <MaterialIcons name="cancel" size={20} color="#FF4444" />
                  )}
                </View>
              )}
            </View>

            {/* Correct Answer */}
            <View style={styles.answerSection}>
              <Text style={styles.sectionLabel}>Correct Answer:</Text>
              <View style={styles.correctAnswerBox}>
                <Text style={styles.correctAnswerText}>
                  {question.correctAnswer || 'Not specified'}
                </Text>
                <MaterialIcons name="check-circle" size={20} color="#28A745" />
              </View>
            </View>

            {/* For Fill in the Blank, show the question with blank */}
            {question.type === 'FILL_BLANK' && (
              <View style={styles.fillBlankSection}>
                <Text style={styles.sectionLabel}>Question with Blank:</Text>
                <View style={styles.fillBlankBox}>
                  <Text style={styles.fillBlankText}>
                    {question.question.replace(/_+/g, '__________')}
                  </Text>
                </View>
              </View>
            )}
          </>
        );

      default:
        return (
          <View style={styles.unknownTypeSection}>
            <MaterialIcons name="error-outline" size={24} color="#FF9800" />
            <Text style={styles.unknownTypeText}>
              Unable to display correction for this question type.
            </Text>
          </View>
        );
    }
  };

  // Calculate statistics
  const correctCount = questions.filter(q => q.isCorrect).length;
  const incorrectCount = questions.filter(q => q.userAnswer && !q.isCorrect).length;
  const notAnsweredCount = questions.filter(q => !q.userAnswer).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0057FF" />
          <Text style={styles.loadingText}>Loading Correction Sheet</Text>
          <Text style={styles.loadingSubText}>Preparing your exam review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleWrapper}>
          <Text style={styles.examTitle} numberOfLines={1}>Correction Sheet</Text>
          <Text style={styles.subTitle} numberOfLines={1}>{examTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Score Summary */}
      <View style={styles.scoreSummary}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Your Score</Text>
            <Text style={styles.scoreValue}>{score}<Text style={styles.scoreTotal}>/{maxScore}</Text></Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Percentage</Text>
            <Text style={[
              styles.scorePercentage,
              { color: percentage >= 40 ? '#28A745' : '#FF4444' }
            ]}>
              {percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <MaterialIcons name="check-circle" size={24} color="#28A745" />
            <Text style={styles.statValue}>{correctCount}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
            <MaterialIcons name="cancel" size={24} color="#FF4444" />
            <Text style={styles.statValue}>{incorrectCount}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#F5F5F5' }]}>
            <MaterialIcons name="help-outline" size={24} color="#666" />
            <Text style={styles.statValue}>{notAnsweredCount}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>
      </View>

      {/* Questions List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="question-answer" size={20} color="#0057FF" />
          <Text style={styles.sectionTitle}>Question-wise Analysis</Text>
          <Text style={styles.questionCount}>{questions.length} Questions</Text>
        </View>

        {questions.map((question, index) => {
          const answerStatus = getAnswerStatus(question);
          const isExpanded = expandedQuestion === question.id;
          
          return (
            <View key={question.id} style={styles.questionCard}>
              {/* Question Header */}
              <TouchableOpacity 
                style={styles.questionHeader}
                onPress={() => toggleQuestion(question.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questionHeaderLeft}>
                  <View style={[
                    styles.questionNumberBadge,
                    answerStatus === 'correct' && styles.correctBadge,
                    answerStatus === 'incorrect' && styles.incorrectBadge,
                    answerStatus === 'not_answered' && styles.notAnsweredBadge,
                  ]}>
                    <Text style={styles.questionNumber}>{index + 1}</Text>
                  </View>
                  
                  <View style={styles.questionInfo}>
                    <View style={styles.questionTypeRow}>
                      <MaterialIcons 
                        name={getQuestionTypeIcon(question.type)} 
                        size={14} 
                        color="#666" 
                      />
                      <Text style={styles.questionType}>
                        {getQuestionTypeDisplay(question.type)}
                      </Text>
                    </View>
                    <Text style={styles.questionPoints}>
                      {question.points} point{question.points !== 1 ? 's' : ''}
                    </Text>
                    <View style={styles.questionStatus}>
                      {answerStatus === 'correct' && (
                        <View style={styles.statusTagCorrect}>
                          <MaterialIcons name="check" size={14} color="#FFF" />
                          <Text style={styles.statusTextCorrect}>Correct</Text>
                        </View>
                      )}
                      {answerStatus === 'incorrect' && (
                        <View style={styles.statusTagIncorrect}>
                          <MaterialIcons name="close" size={14} color="#FFF" />
                          <Text style={styles.statusTextIncorrect}>Wrong</Text>
                        </View>
                      )}
                      {answerStatus === 'not_answered' && (
                        <View style={styles.statusTagNotAnswered}>
                          <MaterialIcons name="remove" size={14} color="#666" />
                          <Text style={styles.statusTextNotAnswered}>Not Answered</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                
                <MaterialIcons 
                  name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>

              {/* Question Text */}
              <Text style={styles.questionText}>{question.question}</Text>

              {/* Expanded Content */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Render content based on question type */}
                  {renderQuestionContent(question, answerStatus)}
                  
                  {/* Score Info */}
                  <View style={styles.scoreInfoSection}>
                    <View style={styles.scoreInfoRow}>
                      <Text style={styles.scoreInfoLabel}>Question Type:</Text>
                      <Text style={styles.scoreInfoValue}>
                        {getQuestionTypeDisplay(question.type)}
                      </Text>
                    </View>
                    <View style={styles.scoreInfoRow}>
                      <Text style={styles.scoreInfoLabel}>Points:</Text>
                      <Text style={[
                        styles.scoreInfoValue,
                        answerStatus === 'correct' && styles.scoreInfoCorrect,
                        answerStatus === 'incorrect' && styles.scoreInfoIncorrect,
                        answerStatus === 'not_answered' && styles.scoreInfoNotAnswered,
                      ]}>
                        {answerStatus === 'correct' ? `+${question.points}` : 
                         answerStatus === 'incorrect' ? '0' : '0'} points
                      </Text>
                    </View>
                    <View style={styles.scoreInfoRow}>
                      <Text style={styles.scoreInfoLabel}>Status:</Text>
                      <Text style={[
                        styles.scoreInfoValue,
                        answerStatus === 'correct' && styles.scoreInfoCorrect,
                        answerStatus === 'incorrect' && styles.scoreInfoIncorrect,
                        answerStatus === 'not_answered' && styles.scoreInfoNotAnswered,
                      ]}>
                        {answerStatus === 'correct' ? 'Correct - Full marks' : 
                         answerStatus === 'incorrect' ? 'Incorrect - No marks' : 
                         'Not Answered - No marks'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => router.replace('/home')}
        >
          <MaterialIcons name="home" size={20} color="#FFF" />
          <Text style={styles.footerButtonText}>Back to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.footerButton, styles.outlineButton]}
          onPress={() => router.push('/(root)/(tabs)/exams')}
        >
          <MaterialIcons name="assignment" size={20} color="#0057FF" />
          <Text style={styles.outlineButtonText}>Take Another Exam</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 6,
    fontSize: 14,
    color: '#666',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  backButton: {
    padding: 8,
  },
  titleWrapper: {
    flex: 1,
    marginHorizontal: 12,
  },
  examTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },

  // Score Summary
  scoreSummary: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF4',
  },
  scoreCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  scoreTotal: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  scorePercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  questionCount: {
    fontSize: 14,
    color: '#666',
  },

  // Question Card
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  correctBadge: {
    backgroundColor: '#E8F5E9',
  },
  incorrectBadge: {
    backgroundColor: '#FFEBEE',
  },
  notAnsweredBadge: {
    backgroundColor: '#F5F5F5',
  },
  questionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  questionInfo: {
    flex: 1,
  },
  questionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  questionType: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginLeft: 4,
  },
  questionPoints: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  questionStatus: {
    flexDirection: 'row',
  },
  statusTagCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28A745',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTextCorrect: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusTagIncorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTextIncorrect: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusTagNotAnswered: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTextNotAnswered: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  questionText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },

  // Expanded Content
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  answerSection: {
    marginBottom: 16,
  },
  fillBlankSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  notAnsweredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3E0',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFB74D',
  },
  notAnsweredText: {
    fontSize: 15,
    color: '#E65100',
    fontWeight: '600',
    flex: 1,
  },
  correctAnswerBox: {
    backgroundColor: '#E8F5E9',
    borderColor: '#28A745',
  },
  incorrectAnswerBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF4444',
  },
  answerText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  correctAnswerText: {
    color: '#28A745',
    fontWeight: '600',
  },
  incorrectAnswerText: {
    color: '#FF4444',
    fontWeight: '600',
  },

  // Fill in the Blank
  fillBlankBox: {
    backgroundColor: '#F0F7FF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EAF0FF',
  },
  fillBlankText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },

  // Unknown Type
  unknownTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFB74D',
  },
  unknownTypeText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },

  // Options Section
  optionsSection: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E9ECEF',
  },
  userCorrectOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#28A745',
  },
  userWrongOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FF4444',
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#28A745',
  },
  optionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndicatorCorrect: {
    backgroundColor: '#28A745',
  },
  optionIndicatorWrong: {
    backgroundColor: '#FF4444',
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '700',
    color: '#495057',
  },
  optionLetterCorrect: {
    color: '#FFF',
  },
  optionLetterWrong: {
    color: '#FFF',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: '#28A745',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#FF4444',
    fontWeight: '600',
  },

  // Score Info Section
  scoreInfoSection: {
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#EAF0FF',
  },
  scoreInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scoreInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scoreInfoCorrect: {
    color: '#28A745',
  },
  scoreInfoIncorrect: {
    color: '#FF4444',
  },
  scoreInfoNotAnswered: {
    color: '#FF9800',
  },

  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0057FF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  footerButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0057FF',
  },
  outlineButtonText: {
    color: '#0057FF',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 20,
  },
});