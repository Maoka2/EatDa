import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, textStyles, SPACING } from "../constants/theme";
import EaterProfile from "../../assets/eater-profile.svg";
import MakerProfile from "../../assets/maker-profile.svg";

interface ProfileSectionProps {
  userType: "eater" | "maker";
  userName: string;
}

export default function ProfileSection({ userType, userName }: ProfileSectionProps) {
  const isEater = userType === "eater";
  
  return (
    <View style={styles.profileSection}>
      <View style={styles.profileRow}>
        <View style={styles.profileImageContainer}>
          {isEater ? (
            <EaterProfile style={styles.profileImage} />
          ) : (
            <MakerProfile style={styles.profileImage} />
          )}
        </View>
        {/* 프로필 이름 인데.. 하드코딩 같아요..ㅠㅠㅠ*/}
        <Text style={[textStyles.logo, styles.userName]}>
          <Text style={{ color: COLORS.textColors.primary }}>Hello, </Text>
          <Text style={{ color: isEater ? COLORS.secondaryEater : COLORS.secondaryMaker }}>
            {userName}
          </Text>
          <Text style={{ color: COLORS.textColors.primary }}> !</Text>
        </Text>
      </View>
    </View>
  );
}

// 프로필 섹션 스타일
// paddingVertical - SPACING -> sm / md 논의 필요요
const styles = StyleSheet.create({
  profileSection: {
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  profileImageContainer: {
    marginRight: SPACING.md,
  },
  profileImage: {
    width: 40,
    height: 40,
  },
  userName: {
    fontSize: 24,
  },
}); 