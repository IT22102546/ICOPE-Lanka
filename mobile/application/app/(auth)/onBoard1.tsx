// app/(auth)/onBoard1.tsx - ICOPE Lanka Onboarding Screen 1
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  TouchableOpacity,
  PanResponder,
  Dimensions,
} from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { images } from "@/constants";
import MaskedView from "@react-native-masked-view/masked-view";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Hospital & physiotherapy themed icons for floating background animation
const MEDICAL_ICONS = [
  "fitness-outline", "heart-outline", "pulse-outline",
  "medkit-outline", "body-outline", "barbell-outline",
  "walk-outline", "bandage-outline", "stopwatch-outline",
  "heart-circle-outline", "fitness", "heart",
  "pulse", "medkit", "body",
] as const;

// ─── Responsive helpers ─────────────────────────────────────────
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const isSmallScreen  = screenHeight < 700;
const isMedScreen    = screenHeight >= 700 && screenHeight < 850;
const TOP_H          = Math.round(screenHeight * (isSmallScreen ? 0.28 : isMedScreen ? 0.30 : 0.32));
const IMG_H          = Math.round(screenHeight * (isSmallScreen ? 0.24 : 0.27));
const MASK_H         = isSmallScreen ? 50 : 72;
const TITLE_FONT     = isSmallScreen ? 18 : 22;
const TITLE_LINE     = isSmallScreen ? 26 : 32;
const DESC_FONT      = isSmallScreen ? 13 : 15;
const DESC_LINE      = isSmallScreen ? 20 : 24;
const HEADER_FONT    = isSmallScreen ? 24 : 30;
const TAGLINE_MB     = isSmallScreen ? 28 : 50;
const _it = (base: number): number => Math.round((base / 230) * TOP_H);
// ─────────────────────────────────────────────────────────────────

// Explicit 4-row grid – icons evenly spread, no clustering
const ICON_POSITIONS = [
  // Row 1 – top strip
  { name: "fitness-outline",      top: _it(12),  leftPct:  3, size: 20, baseOpacity: 0.60, rotation:  -5 },
  { name: "heart-outline",        top: _it(18),  leftPct: 22, size: 16, baseOpacity: 0.55, rotation:   8 },
  { name: "pulse-outline",        top: _it(10),  leftPct: 44, size: 18, baseOpacity: 0.50, rotation:  -3 },
  { name: "medkit-outline",       top: _it(20),  leftPct: 68, size: 22, baseOpacity: 0.60, rotation:   6 },
  { name: "body-outline",         top: _it(14),  leftPct: 88, size: 20, baseOpacity: 0.65, rotation:  -8 },
  // Row 2 – upper-mid
  { name: "barbell-outline",      top: _it(68),  leftPct:  5, size: 22, baseOpacity: 0.65, rotation:   5 },
  { name: "walk-outline",         top: _it(72),  leftPct: 48, size: 18, baseOpacity: 0.55, rotation:  10 },
  { name: "bandage-outline",      top: _it(62),  leftPct: 84, size: 20, baseOpacity: 0.60, rotation:  -6 },
  // Row 3 – mid
  { name: "stopwatch-outline",    top: _it(122), leftPct:  3, size: 20, baseOpacity: 0.60, rotation:   7 },
  { name: "heart-circle-outline", top: _it(130), leftPct: 27, size: 18, baseOpacity: 0.55, rotation:  -4 },
  { name: "fitness",              top: _it(120), leftPct: 60, size: 22, baseOpacity: 0.65, rotation:   3 },
  { name: "heart",                top: _it(128), leftPct: 84, size: 20, baseOpacity: 0.60, rotation:  -7 },
  // Row 4 – lower strip
  { name: "pulse",                top: _it(175), leftPct:  7, size: 20, baseOpacity: 0.60, rotation:   4 },
  { name: "medkit",               top: _it(178), leftPct: 45, size: 18, baseOpacity: 0.55, rotation:  -5 },
  { name: "body",                 top: _it(170), leftPct: 80, size: 22, baseOpacity: 0.65, rotation:   6 },
];

const OnBoard1: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values for decorative elements
  const triangleAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const vectorAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const eclipseAnim = useRef<Animated.Value>(new Animated.Value(0)).current;

  // Swipe animation values
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  // Track if animations are running
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);
  const isNavigating = useRef(false); // Prevent multiple navigations

  // Animated values for floating hospital icons (one per MEDICAL_ICONS entry)
  const animatedValues = useRef(
    MEDICAL_ICONS.map(() => new Animated.Value(0))
  ).current;

  const startAnimations = () => {
    // Reset all animation values to visible state
    triangleAnim.setValue(0);
    vectorAnim.setValue(0);
    eclipseAnim.setValue(0);
    swipeAnim.setValue(0);
    contentAnim.setValue(0);

    // Clear any existing animations
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];

    // Start floating animations for all icons
    const iconAnimations = animatedValues.map((animValue, index) => {
      const delay = index * 150 + Math.random() * 400;

      const animation = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: 2500 + Math.random() * 1500,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0,
                duration: 2500 + Math.random() * 1500,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      );

      animationRefs.current.push(animation);
      return animation;
    });

    // Start decorative elements animation
    const decorativeAnim = Animated.parallel([
      Animated.spring(triangleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(vectorAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(eclipseAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 200,
        useNativeDriver: true,
      }),
    ]);

    animationRefs.current.push(decorativeAnim);

    iconAnimations.forEach((animation) => animation.start());
    decorativeAnim.start();
  };

  const stopAnimations = () => {
    animationRefs.current.forEach((animation) => animation.stop());
    animationRefs.current = [];
  };

  useEffect(() => {
    startAnimations();

    return () => {
      stopAnimations();
    };
  }, []);

  // Reset animations when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset navigation flag and animation values
      isNavigating.current = false;
      swipeAnim.setValue(0);
      contentAnim.setValue(0);
      startAnimations();

      return () => {
        stopAnimations();
      };
    }, [])
  );

  const resetSwipeAnimations = () => {
    Animated.parallel([
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(contentAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // PanResponder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (isNavigating.current) return;

        // Update swipe animation based on gesture
        const progress = Math.max(
          0,
          Math.min(1, Math.abs(gestureState.dx) / 200)
        );

        if (gestureState.dx < 0) {
          // Swiping left - normal forward animation
          swipeAnim.setValue(progress);
          contentAnim.setValue(progress);
        } else {
          // Swiping right - back animation
          swipeAnim.setValue(progress);
          contentAnim.setValue(progress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isNavigating.current) return;

        // Only handle swipe if significant movement
        if (Math.abs(gestureState.dx) > 100) {
          if (gestureState.dx < 0) {
            // Swipe left - go to next screen
            handleSwipeComplete();
          } else if (gestureState.dx > 0 && router.canGoBack()) {
            // Swipe right - go back only if possible
            handleSwipeBack();
          } else {
            // Reset if swipe right but can't go back
            resetSwipeAnimations();
          }
        } else {
          // Reset for small movements
          resetSwipeAnimations();
        }
      },
    })
  ).current;

  // Simple rotation animations without complex interpolation
  const triangleRotation = swipeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const vectorRotation = swipeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-30deg"],
  });

  const eclipseRotation = swipeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "60deg"],
  });

  // Animation transforms for decorative elements with swipe effect
  const triangleTransform = {
    transform: [
      {
        translateX: triangleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-200, 0],
        }),
      },
      {
        translateY: triangleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
      {
        rotate: triangleRotation,
      },
    ],
    opacity: triangleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0.7],
    }),
  };

  const vectorTransform = {
    transform: [
      {
        translateX: vectorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [200, 0],
        }),
      },
      {
        translateY: vectorAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
      {
        rotate: vectorRotation,
      },
    ],
    opacity: vectorAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0.7],
    }),
  };

  const eclipseTransform = {
    transform: [
      {
        translateX: eclipseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-150, 0],
        }),
      },
      {
        translateY: eclipseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [150, 0],
        }),
      },
      {
        rotate: eclipseRotation,
      },
    ],
    opacity: eclipseAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1, 0.7],
    }),
  };

  // Fixed Content animation - always start visible
  const contentTransform = {
    transform: [
      {
        translateX: contentAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -screenWidth],
        }),
      },
    ],
    opacity: contentAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  };

  const handleSwipeComplete = () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    Animated.parallel([
      Animated.timing(swipeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      swipeAnim.setValue(0);
      contentAnim.setValue(0);

      router.push("/onBoard2");
    });
  };

  const handleNextPress = (): void => {
    if (isNavigating.current) {
      return;
    }

    isNavigating.current = true;
    stopAnimations();

    router.push("/onBoard2");

    setTimeout(() => {
      isNavigating.current = false;
    }, 1000);
  };

  const handleSwipeBack = () => {
    if (isNavigating.current) return;

    if (router.canGoBack()) {
      isNavigating.current = true;

      // Complete the swipe animation (back direction)
      Animated.parallel([
        Animated.timing(swipeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(contentAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset animation values immediately after animation completes
        swipeAnim.setValue(0);
        contentAnim.setValue(0);
        router.back();
      });
    } else {
      // Reset animations if can't go back
      resetSwipeAnimations();
    }
  };

  // Render hospital-themed floating Ionicons in the gradient header
  const renderFloatingIcons = (): JSX.Element[] =>
    ICON_POSITIONS.map((item, index) => {
      const translateY = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [0, -14],
      });
      const scale = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.12],
      });
      const rotate = animatedValues[index].interpolate({
        inputRange: [0, 1],
        outputRange: [`${item.rotation}deg`, `${item.rotation + 8}deg`],
      });
      const opacity = animatedValues[index].interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [item.baseOpacity, Math.min(item.baseOpacity * 1.5, 1), item.baseOpacity],
      });
      return (
        <Animated.View
          key={index}
          style={{
            position: "absolute",
            top: item.top,
            left: `${item.leftPct}%` as any,
            zIndex: 2,
            transform: [{ translateY }, { scale }, { rotate }],
            opacity,
          }}
        >
          <Ionicons name={item.name as any} size={item.size} color="rgba(255,255,255,0.88)" />
        </Animated.View>
      );
    });

  return (
    <View style={styles.container}>
      {/* Main content with PanResponder */}
      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {/* Gradient Top Section */}
        <LinearGradient
          colors={["#0E7C61", "#14A87D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topSection}
        >
          {/* Floating hospital icons layer */}
          <View style={styles.iconsLayer}>{renderFloatingIcons()}</View>

          {/* App logo & name */}
          <Image source={images.ICOPELogo} style={{ width: 60, height: 60, borderRadius: 12, marginBottom: 4 }} resizeMode="contain" />
          <Text style={styles.header}>ICOPE Lanka</Text>
          <Text style={styles.tagline}>Care · Assess · Empower</Text>

          {/* Light Blue Wave - BELOW the white wave */}
          <View style={styles.lightBlueWaveContainer}>
            <Svg
              height="92"
              width="100%"
              viewBox="0 0 1440 320"
              style={styles.lightBlueWaveSvg}
            >
              <Path
                fill="#3CC8A1"
                d="M0,180L48,170C96,160,192,140,288,130C384,120,480,120,576,135C672,150,768,180,864,190C960,200,1056,190,1152,175C1248,160,1344,130,1392,115L1440,100L1440,320L0,320Z"
              />
            </Svg>
          </View>

          {/* White Wave - ABOVE the blue wave */}
          <Svg
            height="92"
            width="100%"
            viewBox="0 0 1440 320"
            style={styles.whiteWaveWrapper}
          >
            <Path
              fill="#ffffff"
              d="M0,224L48,202.7C96,181,192,139,288,128C384,117,480,139,576,165.3C672,192,768,224,864,234.7C960,245,1056,235,1152,213.3C1248,192,1344,160,1392,144L1440,128L1440,320L0,320Z"
            />
          </Svg>
        </LinearGradient>

        {/* Bottom Content Section with Image */}
        <View style={styles.bottomSection}>
          {/* Animated Triangle */}
          <Animated.View style={[styles.triangleContainer, triangleTransform]}>
            <Image
              source={images.Traingle}
              style={styles.triangle}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Animated Vector */}
          <Animated.View style={[styles.vectorContainer, vectorTransform]}>
            <Image
              source={images.Vector}
              style={styles.vector}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Animated Eclipse - FIXED: Now properly included */}
          <Animated.View style={[styles.eclipseContainer, eclipseTransform]}>
            <Image
              source={images.Eclips}
              style={styles.eclipse}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Light blue-gray colored filled circle around the onboard image */}
          <View style={styles.circleContainer}>
            <Svg width={240} height={240} style={styles.ashCircle}>
              <Circle cx="120" cy="120" r="100" fill="#ECEBF1" opacity="0.3" />
            </Svg>
          </View>

          {/* Animated Content */}
          <Animated.View style={[styles.contentWrapper, contentTransform]}>
            {/* Main OnBoard1 image */}
            <Image
              source={images.Onboard01}
              style={styles.bottomImage}
              resizeMode="contain"
            />

            {/* Text below the image */}
            <View style={styles.textContainer}>
              {/* Gradient title */}
              <MaskedView
                style={styles.maskedView}
                maskElement={
                  <View style={styles.maskElement}>
                    <Text style={styles.gradientTitleMask}>
                      Comprehensive Elderly Assessment
                    </Text>
                  </View>
                }
              >
                <LinearGradient
                  colors={["#0E7C61", "#0A9D6E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientFill}
                />
              </MaskedView>

              {/* Description text */}
              <Text style={styles.description}>
                Assess elderly patients across 6 key health domains using the WHO ICOPE screening framework.
              </Text>

              {/* Dots Indicator */}
              <View style={styles.dotsContainer}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={[styles.dot, styles.inactiveDot]} />
                <View style={[styles.dot, styles.inactiveDot]} />
              </View>
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Next Button OUTSIDE the PanResponder */}
      <TouchableOpacity
        style={[styles.nextButtonContainer, { bottom: Math.max(insets.bottom, 0) }]}
        onPress={handleNextPress}
        activeOpacity={0.7}
      >
        {/* Quarter Circle Background - Flat side on right */}
        <Svg width={100} height={100} style={styles.quarterCircleSvg}>
          {/* Quarter circle - bottom-right quadrant with flat side on right */}
          <Path
            d="M0,100 A100,100 0 0,1 100,0 L100,100 Z"
            fill="#9BA3AB"
            opacity="0.3"
          />
        </Svg>

        {/* Next Text */}
        <Text style={styles.nextText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mainContent: {
    flex: 1,
  },
  topSection: {
    position: "relative",
    width: "100%",
    height: TOP_H,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  iconsLayer: {
    position: "absolute",
    width: "100%",
    height: "95%",
    zIndex: 7,
  },
  header: {
    fontSize: HEADER_FONT,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
    zIndex: 5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Poppins-Bold",
  },
  tagline: {
    fontSize: isSmallScreen ? 10 : 12,
    color: "rgba(255,255,255,0.8)",
    zIndex: 5,
    fontFamily: "Poppins-Regular",
    letterSpacing: 1.5,
    marginBottom: TAGLINE_MB,
  },
  whiteWaveWrapper: {
    position: "absolute",
    bottom: -6,
    left: 0,
    zIndex: 3,
  },
  lightBlueWaveContainer: {
    position: "absolute",
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2,
  },
  lightBlueWaveSvg: {},
  bottomSection: {
    flex: 1,
    paddingHorizontal: Math.round(screenWidth * 0.07),
    paddingTop: isSmallScreen ? 4 : 10,
    alignItems: "center",
    backgroundColor: "#fff",
    position: "relative",
    marginTop: -2,
  },
  contentWrapper: {
    alignItems: "center",
    width: "100%",
  },
  // Next Button Styles - Bottom Right Corner with Quarter Circle
  nextButtonContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 100,
    height: 100,
    zIndex: 20, // Increased zIndex to ensure it's above everything
    alignItems: "center",
    justifyContent: "center",
  },
  quarterCircleSvg: {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
  nextText: {
    position: "absolute",
    bottom: 25,
    right: 25,
    fontSize: 16,
    fontWeight: "bold",
    color: "#353434",
    fontFamily: "Poppins-Bold",
  },
  triangleContainer: {
    position: "absolute",
    top: -10,
    left: 40,
    zIndex: 1,
  },
  triangle: {
    width: 60,
    height: 60,
  },
  vectorContainer: {
    position: "absolute",
    top: 3,
    right: -7,
    zIndex: 1,
  },
  vector: {
    width: 80,
    height: 120,
  },
  eclipseContainer: {
    position: "absolute",
    bottom: 150,
    left: -30,
    zIndex: 1,
  },
  eclipse: {
    width: 100,
    height: 100,
  },
  circleContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  ashCircle: {},
  bottomImage: {
    width: "100%",
    height: IMG_H,
    marginBottom: isSmallScreen ? 6 : 10,
    marginTop: isSmallScreen ? 2 : 5,
    zIndex: 1,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 0,
    paddingHorizontal: Math.round(screenWidth * 0.05),
  },
  maskedView: {
    height: MASK_H,
    marginBottom: isSmallScreen ? 6 : 10,
    alignSelf: "stretch",
  },
  maskElement: {
    backgroundColor: "transparent",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientTitleMask: {
    fontSize: TITLE_FONT,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Poppins-Bold",
    backgroundColor: "transparent",
    lineHeight: TITLE_LINE,
  },
  gradientFill: {
    flex: 1,
    width: Math.round(screenWidth * 0.75),
    height: MASK_H,
  },
  description: {
    fontSize: DESC_FONT,
    color: "#9BA3AB",
    textAlign: "center",
    lineHeight: DESC_LINE,
    fontFamily: "Poppins-Regular",
    marginBottom: isSmallScreen ? 6 : 12,
    paddingHorizontal: Math.round(screenWidth * 0.03),
  },
  // Dots Indicator Styles
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#0E7C61",
  },
  inactiveDot: {
    backgroundColor: "#D1D5DB",
  },
});

export default OnBoard1;