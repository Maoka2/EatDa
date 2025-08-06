import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS, SPACING } from "../constants/theme";

interface TabItem {
  key: string;
  label: string;
}

interface TabNavigationProps {
  userType: "eater" | "maker";
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

export default function TabNavigation({ userType, activeTab, onTabPress }: TabNavigationProps) {
  const isEater = userType === "eater";
  
  const eaterTabs: TabItem[] = [
    { key: "myReviews", label: "내가 남긴 리뷰" },
    { key: "scrappedReviews", label: "스크랩 한 리뷰" },
    { key: "myMenuBoard", label: "내가 만든 메뉴판" },
  ];
  
  const makerTabs: TabItem[] = [
    { key: "storeReviews", label: "가게 리뷰 보기" },
    { key: "storeEvents", label: "가게 이벤트 보기" },
    { key: "receivedMenuBoard", label: "받은 메뉴판" },
  ];
  
  const tabs = isEater ? eaterTabs : makerTabs;
  const activeColor = isEater ? COLORS.secondaryEater : COLORS.secondaryMaker;
  
  return (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && { borderBottomColor: activeColor },
            activeTab === tab.key && styles.activeTabItem,
          ]}
          onPress={() => onTabPress(tab.key)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.key && { color: activeColor },
              activeTab === tab.key && styles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray300,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textColors.secondary,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "bold",
  },
}); 