import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  useWindowDimensions,
} from "react-native";

import Dropdown from "../../assets/dropdown.svg"; // 드롭다운 화살표
import SearchBtn from "../../assets/search.svg"; // 서치바 돋보기
import { COLORS } from "../constants/theme";

const SEARCH_OPTIONS = ["가게명", "메뉴명"];
const DISTANCE_OPTIONS = [
  { label: "300m", value: 300 },
  { label: "500m", value: 500 },
  { label: "700m", value: 700 },
  { label: "1km", value: 1000 },
  { label: "2km", value: 2000 },
];

interface SearchBarProps {
  showTypeDropdown: boolean;
  setShowTypeDropdown: (v: boolean) => void;
  showDistanceDropdown: boolean;
  setShowDistanceDropdown: (v: boolean) => void;
  onDistanceChange?: (distance: number) => void;
  selectedDistance?: number;
}

export default function SearchBar({
  showTypeDropdown,
  setShowTypeDropdown,
  showDistanceDropdown,
  setShowDistanceDropdown,
  onDistanceChange,
  selectedDistance = 500,
}: SearchBarProps) {
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("가게명");

  // 선택된 거리에 따른 라벨 표시
  const getDistanceLabel = (distance: number) => {
    const option = DISTANCE_OPTIONS.find(opt => opt.value === distance);
    return option ? option.label : "500m";
  };

  const handleDistanceSelect = (distance: number) => {
    onDistanceChange?.(distance);
    setShowDistanceDropdown(false);
  };

  return (
    <View style={[styles.container, { width: width - 20 }]}>
    

      {/* 두 번째 드롭다운 (거리) */}
      <View style={{ position: "relative" }}>
        <TouchableOpacity
          style={[
            styles.dropdown,
            { backgroundColor: "#fec566" },
            { flexDirection: "row" },
          ]}
          onPress={() => {
            setShowDistanceDropdown(!showDistanceDropdown);
            setShowTypeDropdown(false);
          }}
        >
          <Text style={styles.dropdownText}>{getDistanceLabel(selectedDistance)}</Text>
          <Dropdown />
        </TouchableOpacity>

        {showDistanceDropdown && (
          <View style={styles.dropdownMenu}>
            <FlatList
              data={DISTANCE_OPTIONS}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    selectedDistance === item.value && styles.selectedItem
                  ]}
                  onPress={() => handleDistanceSelect(item.value)}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedDistance === item.value && styles.selectedItemText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

  

   
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 10,
    marginTop: 10,
    position: "relative",
    marginBottom: 15,
  },
  dropdown: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: "center",
    zIndex: 10,
  },
  dropdownText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    paddingRight: 4,
  },
  
  dropdownMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 20,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textColors.secondary,
    textAlign: "center",
  },
  selectedItem: {
    backgroundColor: "#f0f8ff",
  },
  selectedItemText: {
    fontWeight: "600",
    color: "#0066cc",
  },
});