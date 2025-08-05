import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

interface CategoryCardProps {
  icon: React.FC<any>; // SVG 컴포넌트
  title: string; // 제목 (예: "내가 남긴 리뷰")
  count: number; // 개수
  onPress?: () => void;
}

export default function CategoryCard({ icon: IconComponent, title, count, onPress }: CategoryCardProps) {
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
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{count}개</Text>
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
    marginLeft: SPACING.xs,
  },
     icon: {
     // width와 height는 인라인으로 동적 적용
   },
  textContainer: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: SPACING.xl, // 텍스트를 오른쪽으로 이동
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333333",
    marginBottom: SPACING.xs,
  },
  count: {
    fontSize: 10,
    color: "#868688",
    fontWeight: "600",
  },
}); 