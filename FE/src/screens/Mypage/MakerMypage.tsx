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
import MakerMypageDetail from "./MakerMypageDetail";
const maker_background = require("../../../assets/maker_background.png");

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

export default function MakerMyPage({ onLogout, setHeaderVisible }: MakerMypageProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("storeReviews");

  // Maker 전용 데이터 개수 계산 (TabKey 순서로 정리)
  const tabData = {
    storeReviews: {
      data: reviewData.slice(6, 12),
      label: "가게 리뷰 보기"
    },
    storeEvents: {
      data: reviewData.slice(12, 15),
      label: "가게 이벤트 보기"
    },
    receivedMenuBoard: {
      data: [],
      label: "받은 메뉴판"
    }
  };

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
        {/* 프로필 섹션 (노란색 배경) */}
        <View style={styles.profileSection}>
          <Image source={backgroundImage} style={styles.backgroundImage} />
          
          <View style={styles.profileContent}>
            <MypageProfile 
              userRole="maker"
              nickname="Sol"
            />
          </View>  

            {/* 통계 카드들 - 타입으로 라벨 결정 */}
            <View style={styles.statsContainer}>
              <StatsCard
                type="리뷰"
                count={tabData.storeReviews.data.length}
              />
              <StatsCard
                type="스크랩"
                count={tabData.storeEvents.data.length}
              />
              <StatsCard
                type="메뉴판"
                count={tabData.receivedMenuBoard.data.length}
              />
            </View>

        </View>

        {/* 카테고리 섹션 - TabKey에 따른 내용 */}
        <View style={styles.categorySection}>
          <CategoryCard
            icon={ReviewIcon}
            title={tabData.storeReviews.label}
            count={tabData.storeReviews.data.length}
            onPress={() => handleCategoryPress("storeReviews")}
          />
          <CategoryCard
            icon={EventIcon}
            title={tabData.storeEvents.label}
            count={tabData.storeEvents.data.length}
            onPress={() => handleCategoryPress("storeEvents")}
          />
          <CategoryCard
            icon={MenuIcon}
            title={tabData.receivedMenuBoard.label}
            count={tabData.receivedMenuBoard.data.length}
            onPress={() => handleCategoryPress("receivedMenuBoard")}
          />
        </View>

        {/* 최근 활동 섹션 */}
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
    gap: 12,
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
    fontSize: 13     ,
    fontWeight: "bold",
    marginBottom: SPACING.xs,
  },
});
