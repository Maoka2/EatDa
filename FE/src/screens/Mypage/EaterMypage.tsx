import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image } from "react-native";
import { SPACING } from "../../constants/theme";
import StatsCard from "../../components/StatsCard";
import ActivityCard from "../../components/ActivityCard";
import CategoryCard from "../../components/CategoryCard";
import MypageProfile from "../../components/MypageProfile";
import EaterMypageDetail from "./EaterMypageDetail";
const eater_background = require("../../../assets/eater_background.png");

import ReviewIcon from "../../../assets/eatermypage-review.svg";
import EventIcon from "../../../assets/eatermypage-scrap.svg";
import MenuIcon from "../../../assets/eatermypage-menuboard.svg";

import { getMyUserStats } from "./services/api";

// EaterMypageDetail과 동일한 TabKey 사용
type TabKey = "myReviews" | "scrappedReviews" | "myMenuBoard";

interface EaterMypageProps {
  onLogout: () => void;
  setHeaderVisible?: (visible: boolean) => void;
}

export default function EaterMypage({
  onLogout,
  setHeaderVisible,
}: EaterMypageProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("myReviews");

  // --- 상태 추가 ---
  const [nickname, setNickname] = useState("정보 로딩중..."); // 닉네임 상태 추가
  const [reviewCount, setReviewCount] = useState(0);
  const [scrapCount, setScrapCount] = useState(0);
  const [menuPosterCount, setMenuPosterCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        setStatsLoading(true);
        setStatsError(null);
        console.log("[USER-STATS][UI] fetch:start");
        const stats = await getMyUserStats();
        if (!mounted) return;

        // --- 상태 업데이트 수정 ---
        setNickname(stats.nickname || "사용자"); // 닉네임 설정
        setReviewCount(Number(stats.reviewCount || 0));
        setScrapCount(Number(stats.scrapCount || 0));
        setMenuPosterCount(Number(stats.menuPosterCount || 0));
        console.log("[USER-STATS][UI] fetch:success", stats);
      } catch (e: any) {
        if (!mounted) return;
        console.error("[USER-STATS][UI] fetch:error", e);
        setStatsError(e?.message || "요약 정보를 불러오지 못했습니다.");
        setNickname("정보 로딩 실패"); // 에러 발생 시 닉네임 처리
      } finally {
        if (!mounted) return;
        setStatsLoading(false);
        console.log("[USER-STATS][UI] fetch:finally");
      }
    }
    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  // Eater 전용 설정
  const backgroundImage = eater_background;

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
      <EaterMypageDetail
        userRole="eater"
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
        {/* 프로필 섹션 (핑크색 배경) */}
        <View style={styles.profileSection}>
          <Image source={backgroundImage} style={styles.backgroundImage} />

          <View style={styles.profileContent}>
            {/* --- MypageProfile 수정 --- */}
            <MypageProfile userRole="eater" nickname={nickname} />
          </View>

          {/* 통계 카드들 - 타입으로 라벨 결정 */}
          <View style={styles.statsContainer}>
            <StatsCard type="리뷰" count={reviewCount} loading={statsLoading} />
            <StatsCard type="스크랩" count={scrapCount} loading={statsLoading} />
            <StatsCard
              type="메뉴판"
              count={menuPosterCount}
              loading={statsLoading}
            />
          </View>
        </View>
        {/* 카테고리 섹션 - TabKey에 따른 내용 */}
        <View style={styles.categorySection}>
          <CategoryCard
            icon={ReviewIcon}
            title="내가 남긴 리뷰"
            count={reviewCount}
            onPress={() => handleCategoryPress("myReviews")}
          />
          <CategoryCard
            icon={EventIcon}
            title="스크랩 한 리뷰"
            count={scrapCount}
            onPress={() => handleCategoryPress("scrappedReviews")}
          />
          <CategoryCard
            icon={MenuIcon}
            title="내가 만든 메뉴판"
            count={menuPosterCount}
            onPress={() => handleCategoryPress("myMenuBoard")}
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
    gap: 10,
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
