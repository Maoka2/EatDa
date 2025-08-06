// src/screens/Register/RoleSelectionScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { COLORS, textStyles } from "../../constants/theme";
import EaterProfileIcon from "../../../assets/eater-profile.svg";
import MakerProfileIcon from "../../../assets/maker-profile.svg";

// Navigation Hook 타입 정의
type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "RoleSelectionScreen"
>;

// 글리터 파티클 컴포넌트
const GlitterParticle = ({ style }: { style: any }) => (
  <View style={[styles.glitterParticle, style]} />
);

export default function RoleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();

  // Navigation 상태 확인
  useEffect(() => {
    console.log("Navigation object:", navigation);
    if (!navigation) {
      console.error("Navigation is undefined!");
    }
  }, [navigation]);

  const [eaterPressed, setEaterPressed] = useState(false);
  const [makerPressed, setMakerPressed] = useState(false);

  // 글리터 애니메이션을 위한 Animated Values
  const [glitterAnimations] = useState(() =>
    Array.from({ length: 8 }, () => new Animated.Value(0))
  );

  const startGlitterAnimation = (isEater: boolean) => {
    const animations = glitterAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.parallel(animations).start();
  };

  const handleSelectRole = (role: "eater" | "maker") => {
    console.log("handleSelectRole called with:", role);
    console.log("Navigation object:", navigation);

    if (!navigation) {
      console.error("Navigation is undefined in handleSelectRole");
      return;
    }

    try {
      // 선택한 역할에 따라 해당 회원가입 화면으로 이동
      if (role === "eater") {
        navigation.navigate("EaterRegisterScreen");
      } else {
        navigation.navigate("MakerRegisterScreen");
      }
    } catch (error) {
      console.error("Navigation error in handleSelectRole:", error);
    }
  };

  const handleBack = () => {
    console.log("handleBack called");
    console.log("Navigation object:", navigation);

    if (!navigation) {
      console.error("Navigation is undefined in handleBack");
      return;
    }

    try {
      // 로그인 화면으로 직접 이동 (스택 리셋)
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      console.error("Navigation error in handleBack:", error);
      // 실패 시 navigate로 시도
      try {
        navigation.navigate("Login");
      } catch (fallbackError) {
        console.error("Fallback navigation also failed:", fallbackError);
      }
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/white-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView
          style={[
            styles.content,
            {
              paddingVertical: height * 0.02,
            },
          ]}
        >
          {/* 로고 및 타이틀 */}
          <View style={[styles.headerContainer, { marginTop: height * 0.05 }]}>
            <Text
              style={[
                textStyles.logo,
                { fontSize: width * 0.08, marginBottom: height * 0.015 },
              ]}
            >
              <Text style={{ color: "#53a3da" }}>E</Text>at
              <Text style={{ color: "#38cca2" }}>D</Text>a!
            </Text>
            <Text
              style={[
                styles.mainTitle,
                { fontSize: width * 0.042, marginBottom: height * 0.008 },
              ]}
            >
              어떤 역할로 가입하시겠어요?
            </Text>
            <Text style={[styles.subtitle, { fontSize: width * 0.03 }]}>
              맛집을 발견하고 공유하는 특별한 여정을 시작해보세요
            </Text>
          </View>

          {/* 역할 선택 카드들 */}
          <View style={[styles.cardContainer, { marginTop: height * 0.05 }]}>
            {/* 냠냠이 카드 */}
            <TouchableOpacity
              style={[styles.roleCard, { marginBottom: height * 0.025 }]}
              onPress={() => handleSelectRole("eater")}
              onPressIn={() => {
                setEaterPressed(true);
                startGlitterAnimation(true);
              }}
              onPressOut={() => setEaterPressed(false)}
              activeOpacity={1}
            >
              <View
                style={[styles.cardContainer3D, eaterPressed && styles.pressed]}
              >
                <LinearGradient
                  colors={["#fef7f7", "#fce7f3", "#f3e8ff"]}
                  style={styles.cardBackground}
                >
                  <LinearGradient
                    colors={
                      eaterPressed
                        ? ["#ff8bb5", "#fc6fae", "#53a3da"]
                        : ["#fc6fae", "#53a3da", "#4f46e5"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientOverlay}
                  >
                    {/* 글리터 효과 */}
                    {eaterPressed &&
                      glitterAnimations.map((anim, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.glitterContainer,
                            {
                              opacity: anim,
                              transform: [
                                {
                                  translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -30],
                                  }),
                                },
                                {
                                  scale: anim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0, 1.5, 0],
                                  }),
                                },
                              ],
                              left: `${(index * 12 + 10) % 80}%`,
                              top: `${(index * 15 + 20) % 60}%`,
                            },
                          ]}
                        >
                          <GlitterParticle style={{}} />
                        </Animated.View>
                      ))}

                    {/* 장식 요소들 */}
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />

                    <View style={styles.cardContent}>
                      {/* 왼쪽: 캐릭터 영역 */}
                      <View style={styles.leftSection}>
                        <View style={styles.characterContainer}>
                          <View style={styles.characterBg}>
                            <EaterProfileIcon width={100} height={100} />
                          </View>
                        </View>
                      </View>

                      {/* 오른쪽: 텍스트 영역 */}
                      <View style={styles.rightSection}>
                        <Text
                          style={[styles.roleTitle, { fontSize: width * 0.04 }]}
                        >
                          냠냠이로 가입하기
                        </Text>
                        <Text
                          style={[
                            styles.roleDescription,
                            { fontSize: width * 0.029 },
                          ]}
                        >
                          맛집 리뷰 쇼츠 탐색과{"\n"}콘텐츠 제작의 즐거움
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </LinearGradient>
              </View>
              {/* 배지를 카드 밖으로 완전히 분리 */}
              <View style={[styles.badge, styles.eaterBadge]}>
                <Text style={styles.badgeText}>EATER</Text>
              </View>
            </TouchableOpacity>

            {/* 사장님 카드 */}
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => handleSelectRole("maker")}
              onPressIn={() => {
                setMakerPressed(true);
                startGlitterAnimation(false);
              }}
              onPressOut={() => setMakerPressed(false)}
              activeOpacity={1}
            >
              <View
                style={[styles.cardContainer3D, makerPressed && styles.pressed]}
              >
                <LinearGradient
                  colors={["#f0fdf4", "#dcfce7", "#bbf7d0"]}
                  style={styles.cardBackground}
                >
                  <LinearGradient
                    colors={
                      makerPressed
                        ? ["#ffd480", "#fec566", "#38cca2"]
                        : ["#fec566", "#38cca2", "#059669"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientOverlay}
                  >
                    {/* 글리터 효과 */}
                    {makerPressed &&
                      glitterAnimations.map((anim, index) => (
                        <Animated.View
                          key={index}
                          style={[
                            styles.glitterContainer,
                            {
                              opacity: anim,
                              transform: [
                                {
                                  translateY: anim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, -30],
                                  }),
                                },
                                {
                                  scale: anim.interpolate({
                                    inputRange: [0, 0.5, 1],
                                    outputRange: [0, 1.5, 0],
                                  }),
                                },
                              ],
                              left: `${(index * 12 + 10) % 80}%`,
                              top: `${(index * 15 + 20) % 60}%`,
                            },
                          ]}
                        >
                          <GlitterParticle style={{}} />
                        </Animated.View>
                      ))}

                    {/* 장식 요소들 */}
                    <View style={[styles.decorCircle, styles.decorCircle1]} />
                    <View style={[styles.decorCircle, styles.decorCircle2]} />
                    <View style={[styles.decorCircle, styles.decorCircle3]} />

                    <View style={styles.cardContent}>
                      {/* 왼쪽: 캐릭터 영역 */}
                      <View style={styles.leftSection}>
                        <View style={styles.characterContainer}>
                          <View style={styles.characterBg}>
                            <MakerProfileIcon width={110} height={110} />
                          </View>
                        </View>
                      </View>

                      {/* 오른쪽: 텍스트 영역 */}
                      <View style={styles.rightSection}>
                        <Text
                          style={[styles.roleTitle, { fontSize: width * 0.04 }]}
                        >
                          사장님으로 가입하기
                        </Text>
                        <Text
                          style={[
                            styles.roleDescription,
                            { fontSize: width * 0.029 },
                          ]}
                        >
                          고객 콘텐츠로 가게 홍보와{"\n"}메뉴판 꾸미기의 효과
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </LinearGradient>
              </View>
              {/* 배지를 카드 밖으로 완전히 분리 */}
              <View style={[styles.badge, styles.makerBadge]}>
                <Text style={styles.badgeText}>MAKER</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 뒤로가기 */}
          <TouchableOpacity
            style={[styles.backButton, { marginTop: height * 0.035 }]}
            onPress={handleBack}
          >
            <Text style={[styles.backText, { fontSize: width * 0.033 }]}>
              로그인으로 돌아가기
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

// 기존 스타일은 그대로 유지
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  mainTitle: {
    color: "#1e293b",
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  subtitle: {
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
    opacity: 0.8,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 40,
  },
  roleCard: {
    borderRadius: 28,
    overflow: "visible",
    position: "relative",
    paddingBottom: 24,
  },
  cardContainer3D: {
    borderRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    transform: [{ translateY: 0 }],
  },
  pressed: {
    transform: [{ translateY: -4 }, { scale: 1.015 }],
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 16,
  },
  cardBackground: {
    borderRadius: 28,
    overflow: "hidden",
  },
  gradientOverlay: {
    borderRadius: 28,
    padding: 20,
    minHeight: 140,
    position: "relative",
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 50,
  },
  decorCircle1: {
    width: 50,
    height: 50,
    top: -12,
    right: -12,
  },
  decorCircle2: {
    width: 35,
    height: 35,
    bottom: 12,
    left: -8,
  },
  decorCircle3: {
    width: 25,
    height: 25,
    top: 35,
    left: 12,
    opacity: 0.8,
  },
  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    position: "relative",
    paddingHorizontal: 5,
  },
  leftSection: {
    flex: 0.4,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 8,
  },
  rightSection: {
    flex: 0.6,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingLeft: 8,
  },
  badge: {
    position: "absolute",
    top: -15,
    right: 25,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  eaterBadge: {
    backgroundColor: COLORS.secondaryEater,
  },
  makerBadge: {
    backgroundColor: COLORS.secondaryMaker,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  characterContainer: {
    alignItems: "center",
    position: "relative",
  },
  characterBg: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  roleTitle: {
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  roleDescription: {
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
    textShadowRadius: 2,
  },
  backButton: {
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginHorizontal: 32,
  },
  backText: {
    color: "#475569",
    paddingBottom: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  // 글리터 효과 스타일
  glitterContainer: {
    position: "absolute",
    zIndex: 15,
  },
  glitterParticle: {
    width: 8,
    height: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});
