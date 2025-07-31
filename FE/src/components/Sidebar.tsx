import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
} from "react-native";

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
  const { width } = useWindowDimensions();
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
        <View style={styles.header}>
          <View
            style={[
              styles.profileImage,
              { backgroundColor: userRole === "eater" ? "#ff6b6b" : "#4dabf7" },
            ]}
          >
            <Text style={styles.profileInitial}>
              {userRole === "eater" ? "냠" : "사"}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {userRole === "eater" ? "냠냠이" : "사장님"}
          </Text>
        </View>

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
            <Text>🍽 고객 리뷰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>📋 이벤트 게시판</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>👥 마이페이지</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>⚙️ 설정</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text>📞 고객센터</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Text>🚪 로그아웃</Text>
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingHorizontal: 20,
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
  },
  menuItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  active: {
    backgroundColor: "#FEC566",
    opacity: 0.5,
  },
});
