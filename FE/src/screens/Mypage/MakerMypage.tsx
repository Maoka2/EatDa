import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SPACING } from "../../constants/theme";
import StatsCard from "../../components/StatsCard";
import ActivityCard from "../../components/ActivityCard";
import CategoryCard from "../../components/CategoryCard";
import MypageProfile from "../../components/MypageProfile";
import { reviewData } from "../../data/reviewData";
import MakerMypageDetail from "./MakerMypageDetail";
const maker_background = require("../../../assets/maker_background.png");

import { getMyMakerStats } from "./services/api";

// 통계 카드용 아이콘들 (임시로 기존 아이콘 사용, 나중에 적절한 아이콘으로 교체)
import ReviewIcon from "../../../assets/makermypage-review.svg";
import EventIcon from "../../../assets/makermypage-event.svg";
import MenuIcon from "../../../assets/makermypage-menuboard.svg";

// MakerMypageDetail과 동일한 TabKey 사용
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

  const [reviewCount, setReviewCount] = useState(0); // 가게 리뷰 수
  const [eventCount, setEventCount] = useState(0); // 진행/등록 이벤트 수(스크랩 대용 슬롯)
  const [menuPosterCount, setMenuPosterCount] = useState(0); // 받은 메뉴판 수
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        console.log("[MAKER-STATS][UI] fetch:start");
        const stats = await getMyMakerStats();
        if (!mounted) return;
        // 서버 응답 키는 extractMakerStatsFromAny에서 유연 파싱됨
        setReviewCount(Number(stats.reviewCount || 0));
        setEventCount(Number(stats.eventCount || 0)); // 서버 확정 전 임시 슬롯: 이벤트/스크랩성 지표 연결
        setMenuPosterCount(Number(stats.menuPosterCount || 0));
        console.log("[MAKER-STATS][UI] fetch:success", stats);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[MAKER-STATS][UI] fetch:error", e);
        setStatsError(e?.message || "요약 정보를 불러오지 못했습니다.");
      } finally {
        if (!mounted) return;
        setStatsLoading(false);
        console.log("[MAKER-STATS][UI] fetch:finally");
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  // Maker 전용 설정
  const backgroundImage = maker_background;

  // CategoryCard 클릭 핸들러
  const handleCategoryPress = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setShowDetail(true);
  };

  // Detail 화면에서 뒤로가기
  const handleBackToMain = () => {
    setShowDetail(false);
  };

  // Detail 화면 표시
  if (showDetail) {
    return (
      <MakerMypageDetail
        userRole="maker"
        onLogout={onLogout}
        initialTab={activeTab}
        onBack={handleBackToMain}
        setHeaderVisible={setHeaderVisible}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <Image source={maker_background} style={styles.backgroundImage} />

          <View style={styles.profileContent}>
            <MypageProfile userRole="maker" nickname="Sei" />
          </View>

          {/* 통계 카드들 */}
          <View style={styles.statsContainer}>
            <StatsCard type="리뷰" count={reviewCount} />
            <StatsCard type="이벤트" count={eventCount} />
            <StatsCard type="메뉴판" count={menuPosterCount} />
          </View>

          
        </View>

        {/* 카테고리 섹션 */}
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

        {/* 최근 활동 섹션 (임시 고정 텍스트 유지) */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>최근 활동</Text>

          <ActivityCard
            icon={ReviewIcon}
            text="가게 리뷰가 등록되었습니다"
            time="2시간 전"
          />

          <ActivityCard
            icon={MenuIcon}
            text="받은 메뉴판이 업데이트되었습니다"
            time="3시간 전"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
  profileSection: {
    position: "relative", // 배경 이미지가 제대로 표시되도록
    minHeight: 100,
    marginBottom: SPACING.md,
    // padding 제거하여 전체 너비 사용
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%", // 명시적으로 전체 너비 지정
    height: "100%", // 명시적으로 전체 높이 지정
    resizeMode: "cover",
  },
  profileContent: {
    justifyContent: "space-between",
    padding: SPACING.lg, // 내부 콘텐츠에만 패딩 적용
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingLeft: SPACING.lg, // 좌우 패딩만 적용
    paddingRight: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  categorySection: {
    paddingTop: SPACING.xs,
    padding: SPACING.lg,
    gap: 10,
  },
  activitySection: {
    backgroundColor: "#eee",
    paddingTop: SPACING.md,
    padding: SPACING.lg,
    gap: 10,
  },
  sectionTitle: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
});
