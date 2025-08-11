// src/screens/EventMaking/ActiveEventScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  FlatList,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
// 더미데이터
import { eventData } from "../../data/eventData";
import { eventItem } from "../../components/GridComponent";
import HamburgerButton from "../../components/Hamburger";
import HeaderLogo from "../../components/HeaderLogo";
import GridComponent from "../../components/GridComponent";
import CloseButton from "../../../assets/closeBtn.svg";

// 날짜 비교용, npm install dayjs 필요
import dayjs from "dayjs";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ActiveEventScreen"
>;

export default function ActiveEventScreen() {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();

  // 마이페이지 이동 함수
  const handleMypage = () => {
    console.log("마이페이지로 이동");
    // navigation.navigate('MyPageScreen');
  };

  // 이벤트 포스터 생성하기 버튼 클릭 핸들러
  const handleCreateEventPoster = () => {
    console.log("이벤트 포스터 생성하기 클릭");
    navigation.navigate("EventMakingScreen");
  };

  // 생성하기 버튼 role 따라 분기
  const { isLoggedIn, userRole } = useAuth();
  const isMaker = isLoggedIn && userRole === "MAKER";

  // 진행중인 이벤트 눌렀을 때 날짜안에 들어있는거만 보여주기
  const [selectedEvent, setSelectedEvent] = useState<eventItem | null>(null);
  const today = dayjs();

  const activeEvents = eventData.filter((event) => {
    const start = event.start_date;
    const end = event.end_date;

    return (
      (today.isAfter(start) || today.isSame(start)) &&
      (today.isBefore(end) || today.isSame(end))
    );
  });

  // 전체보기 -> 상세보기 클릭 시 애니메이션
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    if (selectedEvent) {
      scaleAnim.setValue(0.8);
    }
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [selectedEvent]);

  const [containerWidth, setContainerWidth] = useState(0);

  // 전체보기 || 상세보기
  if (selectedEvent) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim }] }}>
          {/* 상세 보기  */}
          <CloseButton
            onPress={() => setSelectedEvent(null)}
            style={[
              { position: "absolute" },
              { top: height * 0.04, right: width * 0.07 },
            ]}
          />
          <View
            style={[
              styles.storeNameContainer,
              { paddingTop: height * 0.05, paddingBottom: height * 0.03 },
            ]}
          >
            <Text style={[styles.storeName, { paddingBottom: height * 0.05 }]}>
              햄찌네 피자
            </Text>
            <Image
              style={{
                width: width * 0.8,
                height: height * 0.65,
                borderRadius: 10,
              }}
              source={selectedEvent.uri}
            />
          </View>
          {/* 포스터 하단 텍스트 영역 */}
          <View style={[styles.textOverLay, { marginHorizontal: width * 0.1 }]}>
            <Text
              style={[
                styles.eventName,
                { paddingBottom: height * 0.017, paddingTop: height * 0.02 },
              ]}
            >
              {selectedEvent.eventName}
            </Text>
            <Text
              style={[
                styles.eventDescription,
                { paddingBottom: height * 0.02 },
              ]}
            >
              {selectedEvent.eventDescription}
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // 전체 보기
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole={isMaker ? "maker" : "eater"}
          onLogout={() => console.log("logout")}
          onMypage={handleMypage}
        />
        <HeaderLogo />
      </View>
      {/* 진행중인 이벤트 불러오기 (전체 / 상세) */}
      <FlatList
        data={activeEvents}
        keyExtractor={(item) => item.id}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        numColumns={3}
        renderItem={({ item, index }) => (
          <GridComponent
            item={item}
            size={containerWidth / 3}
            index={index}
            totalLength={activeEvents.length}
            onPress={() => setSelectedEvent(item)}
          />
        )}
      />
      {/* 이벤트 포스터 생성하기 버튼 */}
      {!selectedEvent && isMaker && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createEventButton}
            onPress={handleCreateEventPoster}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.createEventButtonText}>
                이벤트 포스터 생성하기
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },

  // 새로운 버튼 스타일
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  } as ViewStyle,

  createEventButton: {
    backgroundColor: "#fec566",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#fec566",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  buttonIcon: {
    marginRight: 8,
  },

  createEventButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  } as TextStyle,

  // 기존 스타일들
  goBackButton: {
    position: "absolute",
  },
  storeName: {
    color: "#333333",
    fontWeight: "bold",
    fontSize: 20,
  } as TextStyle,

  storeNameContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  textOverLay: {
    backgroundColor: "#EEEEEE",
    borderRadius: 10,
    alignItems: "center",
  } as ViewStyle,
  eventName: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  } as TextStyle,

  eventDescription: {
    color: "#333333",
    fontSize: 12,
  } as TextStyle,
});
