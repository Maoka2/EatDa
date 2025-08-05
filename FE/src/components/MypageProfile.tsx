import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SPACING, textStyles, THEME_COLORS } from "../constants/theme";

// 프로필 이미지 import (SVG 컴포넌트로 사용)
import EaterProfileIcon from "../../assets/eater-profile.svg";
import MakerProfileIcon from "../../assets/maker-profile.svg";

interface MypageProfileProps {
  userRole: "eater" | "maker";
  nickname: string; // 사용자 닉네임
}

export default function MypageProfile({ userRole, nickname }: MypageProfileProps) {
  const ProfileIconComponent = userRole === "eater" ? EaterProfileIcon : MakerProfileIcon;
  const userTypeText = userRole === "eater" ? "Eater" : "Maker";

  return (
    <View style={styles.profileInfo}>
      {/* 흰색 동그란 배경 + 프로필 아이콘 */}
      <View style={styles.profileImageContainer}>
        <ProfileIconComponent width={50} height={50} />
      </View>
      
      {/* 텍스트 영역 */}
      {/* [userRole].secondary
      Eater: 핑크색 (#fc6fae) / Maker: 노란색 (#fec566) */}
      <View style={styles.profileText}>
        <Text style={[textStyles.logo, styles.helloText]}>
          Hello, <Text style={{ color: THEME_COLORS[userRole].secondary }}>{nickname}</Text> !
        </Text>
        <Text style={styles.userType}>{userTypeText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImageContainer: {
    width: 55,
    height: 55,
    borderRadius: 40,
    backgroundColor: "#fff", // 흰색 동그란 배경
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 50,
    height: 50,
  },
  profileText: {
    flexDirection: "column",
    justifyContent: "center",
  },
  helloText: {
    fontSize: 18, // 원하는 크기로 조절하세요
  },
  userType: {
    fontSize: 9,
    color: "#fff",
    backgroundColor: "rgba(80, 62, 80, 0.25)",
    paddingHorizontal: 14, //pill-shaped로 잡기 위함 (가로)
    paddingVertical: 2, //pill-shaped로 잡기 위함 (세로)
    borderRadius: 12,
    alignSelf: "flex-start",
  },
}); 