// 2. MenuSelectStep.tsx
import React from "react";
import {
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  View,
} from "react-native";
import { menuData } from "../../../data/menuData";

interface MenuSelectStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export default function MenuSelectStep({
  selected,
  onToggle,
}: MenuSelectStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>메뉴 선택</Text>
        <Text style={styles.subtitle}>리뷰에 참고할 메뉴를 선택해주세요</Text>
      </View>

      <FlatList
        data={menuData}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSel = selected.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.card, isSel && styles.cardSelected]}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
            >
              <Image
                source={{
                  uri: item.uri ?? "https://via.placeholder.com/80?text=No+Img",
                }}
                style={styles.menuImage}
              />
              <View style={styles.menuText}>
                <Text style={styles.menuName}>{item.menuName}</Text>
                <Text style={styles.menuDesc} numberOfLines={2}>
                  {item.menuDescription}
                </Text>
              </View>
              <View
                style={[styles.checkWrap, isSel && styles.checkWrapSelected]}
              >
                {isSel && <Text style={styles.check}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    backgroundColor: "#FFFFFF",
  },

  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F0F0F0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#FF69B4",
    backgroundColor: "#FFF8FC",
    shadowColor: "#FF69B4",
    shadowOpacity: 0.15,
  },

  menuImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    paddingRight: 12,
  },
  menuName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  menuDesc: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
    marginTop: 2,
  },

  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  checkWrapSelected: {
    backgroundColor: "#FF69B4",
    borderColor: "#FF69B4",
  },
  check: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
