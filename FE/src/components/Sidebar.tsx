// src/components/Sidebar.tsx

import React, { useRef, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Text,
  Pressable,
} from "react-native";
// ✨ 수정: CommonActions를 import 합니다.
import { CommonActions, useNavigation } from "@react-navigation/native";
import { AuthStackParamList } from "../navigation/AuthNavigator";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { logOut } from "../auth/logout";

import Spoon from "../../assets/sideSpoon.svg";
import Fork from "../../assets/sideFork.svg";

export interface SidebarProps {
  onClose: () => void;
  userRole: "eater" | "maker";
  activePage: string;
  onMypage: () => void;
}

type NavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export default function Sidebar({
  onClose,
  activePage,
  onMypage,
}: SidebarProps) {
  const { width, height } = useWindowDimensions();
  const navigation = useNavigation<NavigationProp>();
  const sidebarWidth = width * 0.8;

  const slideAnim = useRef(new Animated.Value(-sidebarWidth)).current;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const requestClose = (callback?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: -sidebarWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (callback) {
        callback();
      }
      onClose();
    });
  };

  const handlePressLogOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await logOut();
      requestClose(() => {
        // ✨ 수정: navigation.reset 대신 CommonActions.reset 사용
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Login" }],
          })
        );
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(false);
    }
  };

  const handleNavigation = (screenName: keyof AuthStackParamList) => {
    if (activePage === screenName) {
      requestClose();
      return;
    }
    requestClose(() => {
      // ✨ 수정: navigation.navigate 대신 CommonActions.navigate 사용
      navigation.dispatch(
        CommonActions.navigate({
          name: screenName,
        })
      );
    });
  };

  return (
    <>
      <Pressable style={styles.overlay} onPress={() => requestClose()} />

      <Animated.View
        style={[
          styles.sideMenu,
          {
            width: sidebarWidth,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.menuItems}>
          {/* 고객 리뷰 */}
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

          {/* 이벤트 게시판 */}
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

          {/* 마이페이지 */}
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
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handlePressLogOut}
            disabled={loading}
          >
            <Text style={styles.menuText}>로그아웃</Text>
          </TouchableOpacity>

          {/* 배경 이미지 */}
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

// 스타일
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
