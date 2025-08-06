import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// 사이드바에 사용될 숟가락, 포크 이미지
import Spoon from "../../assets/sideSpoon.svg";
import Fork from "../../assets/sideFork.svg";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "eater" | "maker";
  onLogout: () => void;
  activePage: string;
  onMypage: () => void; // 팀원이 추가한 마이페이지 prop
}

export default function Sidebar({
  isOpen,
  onClose,
  onLogout,
  activePage,
  onMypage, // 팀원이 추가한 마이페이지 prop
}: SidebarProps) {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation();

  // 사이드바 내에서 숟가락, 포크 위치 결정용
  const sidebarWidth = width * 0.8;

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }
  }, [isOpen]);

  // 네비게이션 핸들러
  const handleNavigation = (screenName: string) => {
    navigation.navigate(screenName as never);
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      {/* 오버레이 */}
      <TouchableOpacity
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* 사이드바 */}
      <Animated.View
        style={[
          styles.sideMenu,
          {
            width: width * 0.8,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.menuItems}>
          {/* 고객 리뷰 - Review 폴더의 ReviewTabScreen */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              activePage === "ReviewTabScreen" && styles.active,
            ]}
            onPress={() => handleNavigation("ReviewTabScreen")}
          >
            <Text
              style={[
                styles.menuText,
                activePage === "ReviewTabScreen" && styles.activeText,
              ]}
            >
              고객 리뷰
            </Text>
          </TouchableOpacity>

          {/* 이벤트 게시판 - Eventmaking 폴더의 ActiveEventScreen 또는 EventMakingScreen */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              activePage === "ActiveEventScreen" && styles.active,
            ]}
            onPress={() => handleNavigation("ActiveEventScreen")}
          >
            <Text
              style={[
                styles.menuText,
                activePage === "ActiveEventScreen" && styles.activeText,
              ]}
            >
              이벤트 게시판
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.menuItem,
              activePage === "MypageScreen" && styles.active,
            ]}
            onPress={() => handleNavigation("MypageScreen")}
          >
            <Text
              style={[
                styles.menuText,
                activePage === "MypageScreen" && styles.activeText,
              ]}
            >
              마이페이지
            </Text>
          </TouchableOpacity>

          {/* 로그아웃 */}
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text style={styles.menuText}>로그아웃</Text>
          </TouchableOpacity>

          <View style={styles.characterContainer}>
            <Spoon
              style={{
                position: "absolute",
                left: -sidebarWidth * 0.58,
                bottom: -height * 0.93,
                transform: [{ rotate: "20deg" }],
                opacity: 0.9,
              }}
              width={sidebarWidth * 1.5}
              height={sidebarWidth * 1.5}
            />
            <Fork
              style={{
                position: "absolute",
                right: -sidebarWidth * 0.7,
                bottom: -height * 0.7,
                transform: [{ rotate: "-15deg" }],
                opacity: 0.9,
              }}
              width={sidebarWidth * 1.5}
              height={sidebarWidth * 1.5}
            />
          </View>
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 20,
  },
  sideMenu: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "white",
    zIndex: 30,
    overflow: "hidden",
  },
  menuItems: {
    marginTop: 10,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  active: {
    backgroundColor: "#FEC566",
    opacity: 0.7,
  },
  activeText: {
    fontWeight: "700",
    color: "#000",
  },
  characterContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 300,
  },
});
