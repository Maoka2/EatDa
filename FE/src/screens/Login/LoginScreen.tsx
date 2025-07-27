// src/screens/Login/LoginScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  Image,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import TabSwitcher from "../../components/TabSwitcher";
import EaterLoginScreen from "./EaterLoginScreen";
import MakerLoginScreen from "./MakerLoginScreen";
import RoleSelectionScreen from "../Register/RoleSelectionScreen";
import RegisterScreen from "../Register/RegisterScreen";
import ReviewTabScreen from "../Review/ReviewTabScreen";
import ResultModal from "../../components/ResultModal";
import { COLORS, textStyles } from "../../constants/theme";

type TabKey = "eater" | "maker";

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>("eater");
  const [showRegister, setShowRegister] = useState(false);
  const [registerRole, setRegisterRole] = useState<"eater" | "maker" | null>(
    null
  );
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"eater" | "maker" | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");

  const primaryColor =
    activeTab === "eater" ? COLORS.primaryEater : COLORS.primaryMaker;

  // 로그인 성공 핸들러
  const handleLoginSuccess = (role: "eater" | "maker") => {
    setModalType("success");
    setModalTitle("로그인 성공");
    setModalMessage(
      `${role === "eater" ? "냠냠이" : "사장님"} 로그인에 성공했습니다!`
    );
    setShowModal(true);
    setUserRole(role);
  };

  // 로그인 실패 핸들러
  const handleLoginFailure = (message: string) => {
    setModalType("failure");
    setModalTitle("로그인 실패");
    setModalMessage(message);
    setShowModal(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setShowModal(false);
    if (modalType === "success" && userRole) {
      setIsLoggedIn(true);
    }
  };

  // 회원가입 네비게이션 핸들러들
  const handleNavigateToRegister = () => {
    setShowRoleSelection(true);
  };

  const handleSelectRole = (role: "eater" | "maker") => {
    setRegisterRole(role);
    setShowRoleSelection(false);
    setShowRegister(true);
  };

  const handleBackToLogin = () => {
    setShowRegister(false);
    setShowRoleSelection(false);
    setRegisterRole(null);
  };

  const handleBackToRoleSelection = () => {
    setShowRegister(false);
    setShowRoleSelection(true);
  };

  const handleRegisterComplete = () => {
    // 회원가입 완료 후 로직 (예: 성공 메시지 표시)
    console.log("회원가입 완료!");
    handleBackToLogin();
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // 로그인 성공 후 리뷰 탭 화면 표시
  if (isLoggedIn && userRole) {
    return <ReviewTabScreen userRole={userRole} onLogout={handleLogout} />;
  }

  // 역할 선택 화면 표시
  if (showRoleSelection) {
    return (
      <RoleSelectionScreen
        onSelectRole={handleSelectRole}
        onBack={handleBackToLogin}
      />
    );
  }

  // 회원가입 화면 표시
  if (showRegister && registerRole) {
    return (
      <RegisterScreen
        role={registerRole}
        onBack={handleBackToRoleSelection}
        onComplete={handleRegisterComplete}
      />
    );
  }

  // 기본 로그인 화면
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

          {/* 로그인 폼 */}
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
        </SafeAreaView>

        {/* 손가락 일러스트 */}
        <View style={styles.fingerContainer}>
          <Image
            source={require("../../../assets/login-finger.png")}
            resizeMode="contain"
            style={[
              styles.finger,
              {
                bottom: height * 0.02,
                width: width * 0.55,
                height: (width * 0.55 * 228) / 190,
              },
            ]}
          />
        </View>
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
    top: 0,
    pointerEvents: "none",
  },
  finger: {
    position: "absolute",
    zIndex: 10,
    elevation: 10,
  },
});
