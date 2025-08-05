import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { COLORS, SPACING } from "../../constants/theme";
import StatsCard from "../../components/StatsCard";
import ActivityCard from "../../components/ActivityCard";
import CategoryCard from "../../components/CategoryCard";
import MypageProfile from "../../components/MypageProfile";
import { reviewData } from "../../data/reviewData";
import EaterMypageDetail from "./EaterMypageDetail";
const eater_background = require("../../../assets/eater_background.png");

import ReviewIcon from "../../../assets/eatermypage-review.svg";
import EventIcon from "../../../assets/eatermypage-scrap.svg";
import MenuIcon from "../../../assets/eatermypage-menuboard.svg";

// EaterMypageDetail과 동일한 TabKey 사용
type TabKey = "myReviews" | "scrappedReviews" | "myMenuBoard";

interface EaterMypageProps {
  onLogout: () => void;
  setHeaderVisible?: (visible: boolean) => void;
}

export default function EaterMypage({ onLogout, setHeaderVisible }: EaterMypageProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("myReviews");

  // Eater 전용 데이터 개수 계산 (TabKey 순서로 정리)
  const tabData = {
    myReviews: {
      data: reviewData.slice(0, 6),
      label: "내가 남긴 리뷰"
    },
    scrappedReviews: {
      data: reviewData.slice(6, 10),
      label: "스크랩 한 리뷰"
    },
    myMenuBoard: {
      data: [],
      label: "내가 만든 메뉴판"
    }
  };

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
            <MypageProfile 
              userRole="eater"
              nickname="Sol"
            />
          </View>

          {/* 통계 카드들 - 타입으로 라벨 결정 */}
          <View style={styles.statsContainer}>
            <StatsCard
              type="리뷰"
              count={tabData.myReviews.data.length}
            />
            <StatsCard
              type="스크랩"
              count={tabData.scrappedReviews.data.length}
            />
            <StatsCard
              type="메뉴판"
              count={tabData.myMenuBoard.data.length}
            />
          </View>
          
        </View>

        {/* 카테고리 섹션 - TabKey에 따른 내용 */}
        <View style={styles.categorySection}>
          <CategoryCard
            icon={ReviewIcon}
            title={tabData.myReviews.label}
            count={tabData.myReviews.data.length}
            onPress={() => handleCategoryPress("myReviews")}
          />
          <CategoryCard
            icon={EventIcon}
            title={tabData.scrappedReviews.label}
            count={tabData.scrappedReviews.data.length}
            onPress={() => handleCategoryPress("scrappedReviews")}
          />
          <CategoryCard
            icon={MenuIcon}
            title={tabData.myMenuBoard.label}
            count={tabData.myMenuBoard.data.length}
            onPress={() => handleCategoryPress("myMenuBoard")}
          />
        </View>

        {/* 최근 활동 섹션 - userRole에 따라 다른 텍스트 */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          
          <ActivityCard
            icon={ReviewIcon}
            text="리뷰 등록이 완료되었습니다"
            time="2시간 전"
          />
          
          <ActivityCard
            icon={MenuIcon}
            text="내가 만든 메뉴판이 고정되었습니다"
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
    flexDirection: "column",
    minHeight: 100, // 배경 이미지가 안정적으로 표시될 최소 높이
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  backgroundImage: {
    position: "absolute",
    top: 0,    
    left: 0,   
    right: SPACING.md, // 전체 영역을 잡기 위한 코드
    bottom: SPACING.md, // 전체 영역을 잡기 위한 코드 
  },
  profileContent: {
    justifyContent: "space-between",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingTop: SPACING.md,
  },
  categorySection: {
    paddingTop: SPACING.xs, // paddingtop 조정
    padding: SPACING.lg,
    gap: 10
  },
  activitySection: {
    backgroundColor: '#eee', 
    paddingTop: SPACING.md, // paddingtop 조정
    padding: SPACING.lg,
    gap: 10
  },
  sectionTitle: {
    color : "#333333",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
});
