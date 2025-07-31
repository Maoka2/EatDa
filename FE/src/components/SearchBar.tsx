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
const DISTANCE_OPTIONS = ["300m", "500m", "1km+"];

interface SearchBarProps {
  showTypeDropdown: boolean;
  setShowTypeDropdown: (v: boolean) => void;
  showDistanceDropdown: boolean;
  setShowDistanceDropdown: (v: boolean) => void;
}

export default function SearchBar({
  showTypeDropdown,
  setShowTypeDropdown,
  showDistanceDropdown,
  setShowDistanceDropdown,
}: SearchBarProps) {
  const { width } = useWindowDimensions();
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("가게명");
  const [distance, setDistance] = useState("300m");

  return (
    <View style={[styles.container, { width: width - 20 }]}>
      {/* 첫 번째 드롭다운 */}
      <View style={{ position: "relative" }}>
        <TouchableOpacity
          style={[
            styles.dropdown,
            { backgroundColor: "#e8a3c2" },
            { flexDirection: "row" },
          ]}
          onPress={() => {
            setShowTypeDropdown(!showTypeDropdown);
            setShowDistanceDropdown(false);
          }}
        >
          <Text style={styles.dropdownText}>{searchType}</Text>
          <Dropdown></Dropdown>
        </TouchableOpacity>

        {showTypeDropdown && (
          <View style={styles.dropdownMenu}>
            <FlatList
              data={SEARCH_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSearchType(item);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* 두 번째 드롭다운 */}
      <View style={{ position: "relative" }}>
        <TouchableOpacity
          style={[
            styles.dropdown,
            { backgroundColor: "#f3dea0" },
            { flexDirection: "row" },
          ]}
          onPress={() => {
            setShowDistanceDropdown(!showDistanceDropdown);
            setShowTypeDropdown(false);
          }}
        >
          <Text style={styles.dropdownText}>{distance}</Text>

          <Dropdown></Dropdown>
        </TouchableOpacity>

        {showDistanceDropdown && (
          <View style={styles.dropdownMenu}>
            <FlatList
              data={DISTANCE_OPTIONS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDistance(item);
                    setShowDistanceDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* 검색 공간 */}
      <TouchableOpacity style={styles.textInput}>
        <TextInput
          onPress={() => {
            if (showTypeDropdown || showDistanceDropdown) {
              setShowDistanceDropdown(false);
              setShowTypeDropdown(false);
            }
          }}
          // placeholder={`${searchType}으로 리뷰를 검색해보세요.`}
          placeholder={`리뷰를 검색해보세요.`}
          placeholderTextColor="#555"
          value={searchText}
          onChangeText={setSearchText}
        />
      </TouchableOpacity>

      {/* 돋보기 버튼 */}
      {/* 나중에 검색 시 그 필터링 된 검색결과 나오게끔 */}
      <TouchableOpacity style={styles.searchBtn}>
        <SearchBtn></SearchBtn>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f1f1",
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 10,
    marginTop: 10,
    position: "relative",
    marginBottom: 15,
  },
  dropdown: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 3,
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
  textInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 13,
    color: COLORS.textColors.secondary,
  },
  searchBtn: {
    paddingHorizontal: 8,
  },
  dropdownMenu: {
    position: "absolute",
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  dropdownItem: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 13,
    color: COLORS.textColors.secondary,
    textAlign: "center",
  },
});
