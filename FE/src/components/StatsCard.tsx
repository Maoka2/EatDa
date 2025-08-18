import React from "react";
import { Text, StyleSheet, View, useWindowDimensions } from "react-native";
import { SPACING } from "../constants/theme";

interface StatsCardProps {
  type: "리뷰" | "스크랩" | "메뉴판" | "이벤트"; // 타입 (리뷰, 스크랩, 메뉴판)
  count: number; // 개수
  loading?: boolean;
}

export default function StatsCard({ type, count }: StatsCardProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  // 화면 크기에 따른 동적 크기 계산
  const cardWidth = Math.max(80, Math.min(100, (screenWidth - SPACING.lg * 2 - 30) / 3)); // 최소 80, 최대 100
  const cardHeight = 60;
  const borderRadius = cardHeight / 5;                       

  return (
    <View style={[styles.card, {
      width: cardWidth,
      height: cardHeight,
      borderRadius: borderRadius,
    }]}>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{type}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(80, 62, 80, 0.25)", 
    alignItems: "center",
    justifyContent: "center",
    // 동적 크기는 인라인 스타일로 적용
  },
  count: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginRight: 2, // 글자 밀림으로 인한 설정(동적X)
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5, // 글자 밀림으로 인한 설정(동적X)
    marginRight: 2, // 글자 밀림으로 인한 설정(동적X)
  },
}); 