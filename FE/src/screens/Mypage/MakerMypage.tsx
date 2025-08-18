import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SPACING } from "../../constants/theme";
import StatsCard from "../../components/StatsCard";
import ActivityCard from "../../components/ActivityCard";
import CategoryCard from "../../components/CategoryCard";
import MypageProfile from "../../components/MypageProfile";
import MakerMypageDetail from "./MakerMypageDetail";
const maker_background = require("../../../assets/maker_background.png");

import { getMyMakerStats } from "./services/api";

// 아이콘
import ReviewIcon from "../../../assets/makermypage-review.svg";
import EventIcon from "../../../assets/makermypage-event.svg";
import MenuIcon from "../../../assets/makermypage-menuboard.svg";

type TabKey = "storeReviews" | "storeEvents" | "receivedMenuBoard";

interface MakerMypageProps {
  onLogout: () => void;
  setHeaderVisible?: (visible: boolean) => void;
}

export default function MakerMyPage({
  onLogout,
  setHeaderVisible,
}: MakerMypageProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("storeReviews");

  // ★ storeId 포함
  const [storeId, setStoreId] = useState<number>(0);
  const [storeName, setStoreName] = useState("가게 정보 로딩중...");
  const [reviewCount, setReviewCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [menuPosterCount, setMenuPosterCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log("[MAKER-STATS][UI] fetch:start");
        const stats = await getMyMakerStats();
        if (!mounted) return;

        setStoreId(Number(stats.storeId || 0));                    // ★ 추가
        setStoreName(stats.storeName || "가게 이름 없음");
        setReviewCount(Number(stats.reviewCount || 0));
        setEventCount(Number(stats.eventCount || 0));
        setMenuPosterCount(Number(stats.menuPosterCount || 0));
        console.log("[MAKER-STATS][UI] fetch:success", stats);
      } catch (e) {
        if (!mounted) return;
        console.error("[MAKER-STATS][UI] fetch:error", e);
        setStoreName("정보 로딩 실패");
      } finally {
        if (!mounted) return;
        console.log("[MAKER-STATS][UI] fetch:finally");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCategoryPress = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setShowDetail(true);
  };

  const handleBackToMain = () => {
    setShowDetail(false);
  };

  if (showDetail) {
    return (
      <MakerMypageDetail
        userRole="maker"
        onLogout={onLogout}
        initialTab={activeTab}
        onBack={handleBackToMain}
        setHeaderVisible={setHeaderVisible}
        storeId={storeId}                      // ★ 전달
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.profileSection}>
          <Image source={maker_background} style={styles.backgroundImage} />
          <View style={styles.profileContent}>
            <MypageProfile userRole="maker" nickname={storeName} />
          </View>
          <View style={styles.statsContainer}>
            <StatsCard type="리뷰" count={reviewCount} />
            <StatsCard type="이벤트" count={eventCount} />
            <StatsCard type="메뉴판" count={menuPosterCount} />
          </View>
        </View>

        <View style={styles.categorySection}>
          <CategoryCard
            icon={ReviewIcon}
            title="가게 리뷰 보기"
            count={reviewCount}
            onPress={() => handleCategoryPress("storeReviews")}
          />
          <CategoryCard
            icon={EventIcon}
            title="가게 이벤트 보기"
            count={eventCount}
            onPress={() => handleCategoryPress("storeEvents")}
          />
          <CategoryCard
            icon={MenuIcon}
            title="받은 메뉴판"
            count={menuPosterCount}
            onPress={() => handleCategoryPress("receivedMenuBoard")}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { flex: 1 },
  profileSection: { position: "relative", minHeight: 100, marginBottom: SPACING.md },
  backgroundImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", resizeMode: "cover" },
  profileContent: { justifyContent: "space-between", padding: SPACING.lg },
  statsContainer: { flexDirection: "row", justifyContent: "space-between", gap: 12, paddingLeft: SPACING.lg, paddingRight: SPACING.lg, paddingBottom: SPACING.lg },
  categorySection: { paddingTop: SPACING.xs, padding: SPACING.lg, gap: 10 },
  activitySection: { backgroundColor: "#eee", paddingTop: SPACING.md, padding: SPACING.lg, gap: 10 },
  sectionTitle: { color: "#333333", fontSize: 13, fontWeight: "bold", marginBottom: SPACING.xs },
});
