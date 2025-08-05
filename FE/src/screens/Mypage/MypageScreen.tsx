// src/screens/Mypage/MypageScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import EaterMypage from "./EaterMypage";
import MakerMypage from "./MakerMypage";
import { COLORS } from "../../constants/theme";

type TabKey = "eater" | "maker";

interface MypageScreenProps {
  userRole: "eater" | "maker";
  onLogout: () => void;
}

export default function MypageScreen({ userRole, onLogout }: MypageScreenProps) {
  const { width, height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<TabKey>(userRole || "eater");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);


  const primaryColor =
    activeTab === "eater" ? COLORS.primaryEater : COLORS.primaryMaker;

  // 탭 변경 핸들러
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
  };


  return (
    <View style={styles.container}>
      {/* 헤더 - 조건부 렌더링 */}
      {isHeaderVisible && (
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.hamburgerButton}
          >
            {/* 햄버거 아이콘 */}
            <HamburgerButton
              userRole={activeTab}
              onLogout={onLogout}
              onMypage = {() => {}}
            />
          </TouchableOpacity>
          {/* 로고 */}
          <HeaderLogo></HeaderLogo>
        </View>
      )}

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
            <EaterMypage onLogout={onLogout} setHeaderVisible={setIsHeaderVisible} />
          ) : (
            <MakerMypage onLogout={onLogout} setHeaderVisible={setIsHeaderVisible} />
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
    flexDirection: "row",
    paddingTop: 40,
  },
  hamburgerButton: {
    zIndex: 1,
  },

}); 