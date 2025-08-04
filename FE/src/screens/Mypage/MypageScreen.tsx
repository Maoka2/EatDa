// src/screens/Mypage/MypageScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import TabSwitcher from "../../components/TabSwitcher";
import EaterMypage from "./EaterMypage";
import MakerMypage from "./MakerMypage";
import Sidebar from "../../components/Sidebar";
import { COLORS, textStyles } from "../../constants/theme";

type TabKey = "eater" | "maker";

interface MypageScreenProps {
  userRole?: "eater" | "maker";
  onLogout: () => void;
}

export default function MypageScreen({ userRole, onLogout }: MypageScreenProps) {
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>(userRole || "eater");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const primaryColor =
    activeTab === "eater" ? COLORS.primaryEater : COLORS.primaryMaker;

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };

  // 사이드바 관련 핸들러
  const handleNavigateToMypage = () => {
    // 이미 마이페이지에 있으므로 아무것도 하지 않음
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => {
            setIsSidebarOpen(true);
          }}
        >
          {/* 햄버거 아이콘 */}
          <Text style={[styles.hamburgerIcon, { paddingTop: 4 }]}>☰</Text>
        </TouchableOpacity>
        {/* 로고 */}
        <Text style={[textStyles.logo, { fontSize: width * 0.06 }]}>
          <Text style={{ color: COLORS.primaryEater }}>E</Text>
          <Text style={{ color: COLORS.textColors.primary }}>at</Text>
          <Text style={{ color: COLORS.primaryMaker }}>D</Text>
          <Text style={{ color: COLORS.textColors.primary }}>a</Text>
        </Text>
      </View>

      {/* 사이드바 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={activeTab}
        onLogout={onLogout}
        onMypage={handleNavigateToMypage}
        activePage="mypage"
      />

      <SafeAreaView
        style={[styles.content, { paddingVertical: height * 0.02 }]}
        pointerEvents="box-none"
      >
        {/* 마이페이지 컨텐츠 */}
        <View
          style={{ flex: 1 }}
          pointerEvents="box-none"
        >
          {activeTab === "eater" ? (
            <EaterMypage userRole="eater" onLogout={onLogout} />
          ) : (
            <MakerMypage userRole="maker" onLogout={onLogout} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    position: "relative",
  },
  sidebarButton: {
    position: "absolute",
    left: 20,
    padding: 10,
  },
  hamburgerIcon: {
    fontSize: 18,
  },
}); 