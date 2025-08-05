import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";

import { menuData } from "../../data/menuData";
import NoDataScreen from "../../components/NoDataScreen";

// 메뉴 스타일 이미지
import MenuStyleDummy1 from "../../data/menuStyleDummy/menuStyleDummy1.svg";
import MenuStyleDummy2 from "../../data/menuStyleDummy/menuStyleDummy2.svg";
import MenuStyleDummy3 from "../../data/menuStyleDummy/menuStyleDummy3.svg";
import MenuStyleDummy4 from "../../data/menuStyleDummy/menuStyleDummy4.svg";
import MenuStyleDummy5 from "../../data/menuStyleDummy/menuStyleDummy5.svg";

// 닫기 버튼 아이콘
import CloseBtn from "../../../assets/closeBtn.svg";

export default function StoreMenuScreen() {
  const { width, height } = useWindowDimensions();
  const isEmpty = !menuData || menuData.length === 0;

  const [selectedStyleKey, setSelectedStyleKey] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (isEmpty) {
    return <NoDataScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 메뉴 리스트 */}
      <FlatList
        data={menuData}
        renderItem={({ item }) => (
          <View style={styles.shadowWrapper}>
            <View style={styles.menuContainer}>
              {item.uri && (
                <Image source={{ uri: item.uri }} style={styles.menuImage} />
              )}
              <View style={styles.textWrapper}>
                <Text style={styles.menuName}>{item.menuName}</Text>
                <Text style={styles.menuDescription} numberOfLines={2}>
                  {item.menuDescription}
                </Text>
              </View>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 10 }}
      />

      {/* 메뉴판 스타일 선택 버튼 */}
      <View style={styles.menuStyleContainer}>
        <TouchableOpacity
          style={styles.menuStyleBtn}
          onPress={() => {
            setSelectedStyleKey("1");
            setShowModal(true);
          }}
        >
          <MenuStyleDummy1 />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuStyleBtn}
          onPress={() => {
            setSelectedStyleKey("2");
            setShowModal(true);
          }}
        >
          <MenuStyleDummy2 />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuStyleBtn}
          onPress={() => {
            setSelectedStyleKey("3");
            setShowModal(true);
          }}
        >
          <MenuStyleDummy3 />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuStyleBtn}
          onPress={() => {
            setSelectedStyleKey("4");
            setShowModal(true);
          }}
        >
          <MenuStyleDummy4 />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuStyleBtn}
          onPress={() => {
            setSelectedStyleKey("5");
            setShowModal(true);
          }}
        >
          <MenuStyleDummy5 />
        </TouchableOpacity>
      </View>

      {/* 스타일 모달 */}
      <Modal
        animationType="fade"
        transparent
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowModal(false)}
                >
                  <CloseBtn />
                </TouchableOpacity>

                {selectedStyleKey === "1" && (
                  <MenuStyleDummy1 width={width * 0.8} height={height * 0.6} />
                )}
                {selectedStyleKey === "2" && (
                  <MenuStyleDummy2 width={width * 0.8} height={height * 0.6} />
                )}
                {selectedStyleKey === "3" && (
                  <MenuStyleDummy3 width={width * 0.8} height={height * 0.6} />
                )}
                {selectedStyleKey === "4" && (
                  <MenuStyleDummy4 width={width * 0.8} height={height * 0.6} />
                )}
                {selectedStyleKey === "5" && (
                  <MenuStyleDummy5 width={width * 0.8} height={height * 0.6} />
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuStyleContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  } as ViewStyle,
  menuStyleBtn: {
    flex: 1,
    alignItems: "center",
  } as ViewStyle,
  shadowWrapper: {
    backgroundColor: "#f7f8f9",
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  menuContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f7f8f9",
  } as ViewStyle,
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  menuName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  } as TextStyle,
  menuDescription: {
    fontSize: 13,
    color: "#757575",
  } as TextStyle,
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  } as ViewStyle,
  modalCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
  } as ViewStyle,
});
