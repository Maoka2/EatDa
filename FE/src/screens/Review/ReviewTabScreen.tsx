// src/screens/Review/ReviewTabScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  FlatList,
  ImageStyle,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { COLORS, textStyles } from "../../constants/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const itemWidth = (screenWidth - 40) / 3; // 3칸 그리드를 위한 계산 (좌우 패딩 20씩)

interface ReviewItem {
  id: string;
  type: "image" | "video";
  uri: string;
  thumbnail?: string; // 비디오인 경우 썸네일
  title: string;
  description: string;
  likes: number;
  views: number;
}

// 더미 데이터
const reviewData: ReviewItem[] = [
  {
    id: "1",
    type: "image",
    uri: "https://picsum.photos/400/600?random=1",
    title: "맛있는 버거",
    description: "정말 맛있었어요!",
    likes: 125,
    views: 1200,
  },
  {
    id: "2",
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail: "https://picsum.photos/400/600?random=2",
    title: "피자 만들기",
    description: "집에서 만든 피자",
    likes: 89,
    views: 850,
  },
  {
    id: "3",
    type: "image",
    uri: "https://picsum.photos/400/600?random=3",
    title: "파스타",
    description: "크림 파스타 최고!",
    likes: 67,
    views: 340,
  },
  {
    id: "4",
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail: "https://picsum.photos/400/600?random=4",
    title: "라면 요리",
    description: "간단한 라면 레시피",
    likes: 201,
    views: 1800,
  },
  {
    id: "5",
    type: "image",
    uri: "https://picsum.photos/400/600?random=5",
    title: "디저트",
    description: "달콤한 케이크",
    likes: 156,
    views: 980,
  },
  {
    id: "6",
    type: "video",
    uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail: "https://picsum.photos/400/600?random=6",
    title: "스테이크",
    description: "완벽한 스테이크 굽기",
    likes: 324,
    views: 2500,
  },
];

interface ReviewTabScreenProps {
  userRole: "eater" | "maker";
  onLogout: () => void;
}

export default function ReviewTabScreen({
  userRole,
  onLogout,
}: ReviewTabScreenProps) {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const slideAnim = useRef(new Animated.Value(-screenWidth * 0.8)).current;

  const primaryColor =
    userRole === "eater" ? COLORS.primaryEater : COLORS.primaryMaker;

  // 사이드 메뉴 토글
  const toggleSideMenu = () => {
    const toValue = sideMenuVisible ? -screenWidth * 0.8 : 0;

    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setSideMenuVisible(!sideMenuVisible);
  };

  // 아이템 선택 시 상세 보기
  const handleItemPress = (item: ReviewItem) => {
    setSelectedItem(item);
  };

  // 상세 보기 닫기
  const closeDetailView = () => {
    setSelectedItem(null);
  };

  // 그리드 아이템 렌더링
  const renderGridItem = ({
    item,
    index,
  }: {
    item: ReviewItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.gridItem,
        {
          width: itemWidth,
          marginRight: (index + 1) % 3 === 0 ? 0 : 10,
        },
      ]}
      onPress={() => handleItemPress(item)}
    >
      {item.type === "video" ? (
        <View style={styles.videoThumbnail}>
          <Image
            source={{ uri: item.thumbnail || item.uri }}
            style={styles.itemImage}
            resizeMode="cover"
          />
          <View style={styles.playIcon}>
            <Text style={styles.playIconText}>▶</Text>
          </View>
        </View>
      ) : (
        <Image
          source={{ uri: item.uri }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.itemOverlay}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.itemStats}>
          <Text style={styles.statsText}>❤ {item.likes}</Text>
          <Text style={styles.statsText}>👁 {item.views}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 사이드 메뉴 렌더링
  const renderSideMenu = () => (
    <Animated.View
      style={[
        styles.sideMenu,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.sideMenuHeader}>
        <View style={styles.profileSection}>
          <View
            style={[styles.profileImage, { backgroundColor: primaryColor }]}
          >
            <Text style={styles.profileInitial}>
              {userRole === "eater" ? "냠" : "사"}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {userRole === "eater" ? "냠냠이" : "사장님"}
          </Text>
        </View>
      </View>

      <View style={styles.menuItems}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>🍽 고객 리뷰</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📋 이벤트 게시판</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>👥 아이페이지</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>⚙️ 설정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>📞 고객센터</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
          <Text style={styles.menuItemText}>🚪 로그아웃</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // 상세 보기 모달
  const renderDetailModal = () => {
    if (!selectedItem) return null;

    return (
      <View style={styles.detailModal}>
        <View style={styles.detailContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeDetailView}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.detailMediaContainer}>
            {selectedItem.type === "video" ? (
              <Video
                source={{ uri: selectedItem.uri }}
                style={styles.detailVideo}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
              />
            ) : (
              <Image
                source={{ uri: selectedItem.uri }}
                style={styles.detailImage}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.detailInfo}>
            <Text style={styles.detailTitle}>{selectedItem.title}</Text>
            <Text style={styles.detailDescription}>
              {selectedItem.description}
            </Text>
            <View style={styles.detailStats}>
              <Text style={styles.detailStatsText}>❤ {selectedItem.likes}</Text>
              <Text style={styles.detailStatsText}>👁 {selectedItem.views}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      {/* 헤더 */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={toggleSideMenu}
        >
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={[textStyles.logo, styles.headerLogo]}>
          <Text style={{ color: COLORS.primaryEater }}>Eat</Text>
          <Text style={{ color: COLORS.primaryMaker }}>Da</Text>
        </Text>

        <View style={styles.headerRight} />
      </SafeAreaView>

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>가게명</Text>
          <TouchableOpacity>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <Text style={styles.searchPlaceholder}>300m</Text>
          <TouchableOpacity>
            <Text style={styles.searchIcon}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 리뷰 그리드 */}
      <FlatList
        data={reviewData}
        renderItem={renderGridItem}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />

      {/* 사이드 메뉴 */}
      {renderSideMenu()}

      {/* 사이드 메뉴 오버레이 */}
      {sideMenuVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSideMenu}
          activeOpacity={1}
        />
      )}

      {/* 상세 보기 모달 */}
      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  } as ViewStyle,
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  hamburgerButton: {
    padding: 5,
  } as ViewStyle,
  hamburgerIcon: {
    fontSize: 24,
    color: "#333",
  } as TextStyle,
  headerLogo: {
    flex: 1,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "bold",
  } as TextStyle,
  headerRight: {
    width: 34, // hamburgerButton과 같은 너비로 균형 맞추기
  } as ViewStyle,
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  } as ViewStyle,
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  } as ViewStyle,
  searchPlaceholder: {
    flex: 1,
    color: "#666",
    fontSize: 14,
  } as TextStyle,
  searchIcon: {
    fontSize: 16,
  } as TextStyle,
  gridContainer: {
    padding: 20,
  } as ViewStyle,
  gridItem: {
    height: itemWidth * 1.3,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  itemImage: {
    width: "100%",
    height: "70%",
  } as ImageStyle,
  videoThumbnail: {
    position: "relative",
    width: "100%",
    height: "70%",
    overflow: "hidden",
  } as ViewStyle,
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -15 }, { translateY: -15 }],
  } as ViewStyle,
  playIconText: {
    color: "white",
    fontSize: 12,
  } as TextStyle,
  itemOverlay: {
    flex: 1,
    padding: 8,
    justifyContent: "space-between",
  } as ViewStyle,
  itemTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  } as TextStyle,
  itemStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  } as ViewStyle,
  statsText: {
    fontSize: 10,
    color: "#666",
  } as TextStyle,
  sideMenu: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.8,
    backgroundColor: "white",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  } as ViewStyle,
  sideMenuHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  } as ViewStyle,
  profileSection: {
    alignItems: "center",
  } as ViewStyle,
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  } as ViewStyle,
  profileInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  } as TextStyle,
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  } as TextStyle,
  menuItems: {
    flex: 1,
    paddingTop: 20,
  } as ViewStyle,
  menuItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  } as ViewStyle,
  menuItemText: {
    fontSize: 16,
    color: "#333",
  } as TextStyle,
  menuDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 10,
    marginHorizontal: 20,
  } as ViewStyle,
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 999,
  } as ViewStyle,
  detailModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  } as ViewStyle,
  detailContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  } as ViewStyle,
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  } as ViewStyle,
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  } as TextStyle,
  detailMediaContainer: {
    flex: 1,
  } as ViewStyle,
  detailVideo: {
    width: "100%",
    height: "100%",
  } as ViewStyle,
  detailImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,
  detailInfo: {
    padding: 20,
    backgroundColor: "white",
  } as ViewStyle,
  detailTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  } as TextStyle,
  detailDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  } as TextStyle,
  detailStats: {
    flexDirection: "row",
    gap: 20,
  } as ViewStyle,
  detailStatsText: {
    fontSize: 14,
    color: "#666",
  } as TextStyle,
});
