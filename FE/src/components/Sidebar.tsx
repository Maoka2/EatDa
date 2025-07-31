import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
} from "react-native";

// 사이드바에 사용될 숟가락, 포크 이미지
import Spoon from "../../assets/sideSpoon.svg";
import Fork from "../../assets/sideFork.svg";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "eater" | "maker";
  onLogout: () => void;
  activePage: string;
  // onNavigate: (currentPage: string) => void;
}

export default function Sidebar({
  isOpen,
  onClose,
  userRole,
  onLogout,
  activePage,
}: SidebarProps) {
  const { width, height } = useWindowDimensions();
  // 사이드바 내에서 숟가락, 포크 위치 결정용
  const sidebarWidth = width * 0.8;
  const sidebarHeight = height;

  const slideAnim = useRef(new Animated.Value(-width * 0.8)).current;
  const [visible, setVisible] = useState(isOpen);

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
          { width: width * 0.8, transform: [{ translateX: slideAnim }] },
        ]}
      >
        <View style={styles.menuItems}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              activePage === "reviewPage" && styles.active,
            ]}
            onPress={() => {
              // if(activePage !== "reviewPage"){
              // onNavigate("reviewPage");
              // onClose();
              // }
            }}
          >
            <Text style={activePage === "reviewPage" && styles.activeText}>
              고객 리뷰
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>이벤트 게시판</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>마이페이지</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.menuItem}>
            <Text>⚙️ 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>📞 고객센터</Text>
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text>로그아웃</Text>
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
            ></Spoon>
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
            ></Fork>
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
    paddingTop: 30,
    // paddingHorizontal: 20,
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  profileInitial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  menuItems: {
    marginTop: 10,
    // paddingHorizontal:20,
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 20,
  },

  active: {
    backgroundColor: "#FEC566",
    opacity: 0.7,
  },

  activeText: {
    fontWeight: 700,
  },

  characterContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 300,
    // pointerEvents: "none",
  },
});
