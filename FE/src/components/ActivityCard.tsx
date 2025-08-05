import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

interface ActivityCardProps {
  icon: React.FC<any>; // SVG 컴포넌트
  text: string; // 활동 내용 텍스트
  time: string; // 시간 (예: "2시간 전")
  onPress?: () => void;
}

export default function ActivityCard({ icon: IconComponent, text, time, onPress }: ActivityCardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = screenWidth * 0.08;  // 화면 너비의 8%
  const height = screenHeight * 0.04; // 화면 높이의 4%
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <IconComponent 
          width={width * 2} 
          height={height * 2}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    marginRight: SPACING.xs,
  },
  icon: {
    // width와 height는 인라인으로 동적 적용
  },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: SPACING.sm,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: SPACING.xs,
  },
  time: {
    fontSize: 10,
    color: "#868688",
    fontWeight: "600",
  },
}); 