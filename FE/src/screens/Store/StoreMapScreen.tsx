// src/screens/Store/StoreMapScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  ViewStyle,
  TextStyle,
} from "react-native";

interface StoreMapScreenProps {
  onClose: () => void;
}

interface TimeSlot {
  day: string;
  time: string;
  isToday?: boolean;
}

export default function StoreMapScreen({ onClose }: StoreMapScreenProps) {
  const [showAllHours, setShowAllHours] = useState(false);

  const timeSlots: TimeSlot[] = [
    { day: "1시간 1분", time: "오늘 2800원", isToday: true },
    { day: "1시간 9분", time: "오늘 1500원" },
    { day: "1시간 8분", time: "오늘 1600원" },
    { day: "2시간 5분", time: "오늘 2400원" },
    { day: "1시간 7분", time: "오늘 2200원" },
  ];

  const handleNavigation = (type: string) => {
    // 실제 지도 앱으로 연결
    const address = "서울특별시 강남구 테헤란로 212";
    let url = "";

    switch (type) {
      case "kakao":
        url = `kakaomap://search?q=${encodeURIComponent(address)}`;
        break;
      case "naver":
        url = `nmap://search?query=${encodeURIComponent(address)}`;
        break;
      case "tmap":
        url = `tmap://search?name=${encodeURIComponent(address)}`;
        break;
    }

    Linking.openURL(url).catch(() => {
      alert("해당 앱이 설치되어 있지 않습니다.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>찾아가기</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 가게 정보 */}
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>햄찌네 피자</Text>
          <Text style={styles.storeAddress}>
            📍 서울특별시 강남구 테헤란로 212
          </Text>
        </View>

        {/* 지도 플레이스홀더 */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ 지도</Text>
          </View>
        </View>

        {/* 교통 정보 */}
        <View style={styles.transportSection}>
          <Text style={styles.sectionTitle}>🚗 교통 정보</Text>

          {timeSlots
            .slice(0, showAllHours ? timeSlots.length : 2)
            .map((slot, index) => (
              <View
                key={index}
                style={[styles.timeSlot, slot.isToday && styles.todaySlot]}
              >
                <Text
                  style={[styles.timeText, slot.isToday && styles.todayText]}
                >
                  {slot.day}
                </Text>
                <Text
                  style={[styles.costText, slot.isToday && styles.todayText]}
                >
                  {slot.time}
                </Text>
              </View>
            ))}

          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllHours(!showAllHours)}
          >
            <Text style={styles.showMoreText}>
              {showAllHours ? "접기" : "더 보기"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 지도 앱 연결 */}
        <View style={styles.mapAppsSection}>
          <Text style={styles.sectionTitle}>지도 앱으로 보기</Text>

          <TouchableOpacity
            style={styles.mapAppButton}
            onPress={() => handleNavigation("kakao")}
          >
            <Text style={styles.mapAppText}>카카오맵으로 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapAppButton}
            onPress={() => handleNavigation("naver")}
          >
            <Text style={styles.mapAppText}>네이버 지도로 보기</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapAppButton}
            onPress={() => handleNavigation("tmap")}
          >
            <Text style={styles.mapAppText}>티맵으로 보기</Text>
          </TouchableOpacity>
        </View>

        {/* 연락처 정보 */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>📞 연락처</Text>
          <TouchableOpacity
            style={styles.phoneButton}
            onPress={() => Linking.openURL("tel:02-1234-5678")}
          >
            <Text style={styles.phoneText}>02-1234-5678</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
  } as ViewStyle,
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  } as ViewStyle,
  closeButton: {
    fontSize: 24,
    color: "#333",
  } as TextStyle,
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  } as TextStyle,
  placeholder: {
    width: 24,
  } as ViewStyle,
  content: {
    flex: 1,
    paddingHorizontal: 20,
  } as ViewStyle,
  storeInfo: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  } as ViewStyle,
  storeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  } as TextStyle,
  storeAddress: {
    fontSize: 14,
    color: "#666",
  } as TextStyle,
  mapContainer: {
    marginTop: 15,
    borderRadius: 12,
    overflow: "hidden",
  } as ViewStyle,
  mapPlaceholder: {
    height: 200,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  mapText: {
    fontSize: 16,
    color: "#666",
  } as TextStyle,
  transportSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  } as ViewStyle,
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  } as TextStyle,
  timeSlot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  } as ViewStyle,
  todaySlot: {
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 8,
  } as ViewStyle,
  timeText: {
    fontSize: 14,
    color: "#333",
  } as TextStyle,
  costText: {
    fontSize: 14,
    color: "#666",
  } as TextStyle,
  todayText: {
    color: "#53A3DA",
    fontWeight: "600",
  } as TextStyle,
  showMoreButton: {
    marginTop: 10,
    alignItems: "center",
  } as ViewStyle,
  showMoreText: {
    fontSize: 14,
    color: "#53A3DA",
  } as TextStyle,
  mapAppsSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
  } as ViewStyle,
  mapAppButton: {
    backgroundColor: "#F7F8F9",
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
  } as ViewStyle,
  mapAppText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  } as TextStyle,
  contactSection: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 20,
  } as ViewStyle,
  phoneButton: {
    backgroundColor: "#53A3DA",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  } as ViewStyle,
  phoneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  } as TextStyle,
});
