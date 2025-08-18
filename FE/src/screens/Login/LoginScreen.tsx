// src/screens/Login/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  Image,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TabSwitcher from "../../components/TabSwitcher";
import EaterLoginScreen from "./EaterLoginScreen";
import MakerLoginScreen from "./MakerLoginScreen";
import ResultModal from "../../components/ResultModal";
import { COLORS, textStyles } from "../../constants/theme";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

type TabKey = "eater" | "maker";
type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<TabKey>("eater");

  // ResultModal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  // 키보드 열림 여부 (손가락 일러스트 제어용)
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    const s = Keyboard.addListener("keyboardDidShow", () => setKbOpen(true));
    const h = Keyboard.addListener("keyboardDidHide", () => setKbOpen(false));
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  const primaryColor =
    activeTab === "eater" ? COLORS.primaryEater : COLORS.primaryMaker;

  // 로그인 성공
  const handleLoginSuccess = (role: "eater" | "maker") => {
    setModalType("success");
    setModalTitle("로그인 성공");
    setModalMessage(
      `${role === "eater" ? "냠냠이" : "사장님"} 로그인에 성공했습니다!`
    );
    setShowModal(true);
  };

  // 로그인 실패
  const handleLoginFailure = (message: string) => {
    setModalType("failure");
    setModalTitle("로그인 실패");
    setModalMessage(message);
    setShowModal(true);
  };

  // 모달 닫기 → 메인 이동
  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success") {
      navigation.navigate("ReviewTabScreen" as any);
    }
  };

  // 회원가입(역할 선택)
  const handleNavigateToRegister = () => {
    navigation.navigate("RoleSelectionScreen");
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/white-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView
          style={[styles.content, { paddingVertical: height * 0.04 }]}
          pointerEvents="box-none"
        >
          {/* 로고 */}
          <View style={[styles.logoContainer, { marginTop: height * 0.03 }]}>
            <Text style={[textStyles.logo, { fontSize: width * 0.08 }]}>
              Hello <Text style={{ color: COLORS.primaryEater }}>E</Text>at
              <Text style={{ color: COLORS.primaryMaker }}>D</Text>a!
            </Text>
          </View>

          {/* 탭 */}
          <View
            style={{
              zIndex: 1,
              marginTop: height * 0.02,
              marginBottom: height * 0.035,
            }}
          >
            <TabSwitcher
              tabs={[
                { key: "eater", label: "냠냠이 로그인" },
                { key: "maker", label: "사장님 로그인" },
              ]}
              activeKey={activeTab}
              onChange={(k) => setActiveTab(k as TabKey)}
              activeColor={primaryColor}
              inactiveColor={COLORS.inactive}
            />
          </View>

          {/* 👇 폼 영역만 키보드 회피 */}
          <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              <View
                style={{ flex: 1, paddingHorizontal: width * 0.02 }}
                pointerEvents="box-none"
              >
                {activeTab === "eater" ? (
                  <EaterLoginScreen
                    onNavigateToRegister={handleNavigateToRegister}
                    onLoginSuccess={() => handleLoginSuccess("eater")}
                    onLoginFailure={handleLoginFailure}
                  />
                ) : (
                  <MakerLoginScreen
                    onNavigateToRegister={handleNavigateToRegister}
                    onLoginSuccess={() => handleLoginSuccess("maker")}
                    onLoginFailure={handleLoginFailure}
                  />
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* 👇 키보드 열리면 손가락 숨김 (바닥 고정) */}
        {!kbOpen && (
          <View style={styles.fingerContainer}>
            <Image
              source={require("../../../assets/login-finger.png")}
              resizeMode="contain"
              style={[
                styles.finger,
                {
                  bottom: height * 0.001,
                  width: height < 700 ? width * 0.4 : width * 0.5,
                  height:
                    height < 700
                      ? (width * 0.4 * 228) / 190
                      : (width * 0.5 * 228) / 190,
                },
              ]}
            />
          </View>
        )}
      </ImageBackground>

      {/* 결과 모달 */}
      <ResultModal
        visible={showModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={handleModalClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  logoContainer: {
    alignItems: "center",
  },
  fingerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
  },
  finger: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
  },
});
