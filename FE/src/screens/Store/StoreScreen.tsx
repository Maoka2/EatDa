// src/screens/Store/StoreScreen.tsx

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  Modal,
  useWindowDimensions,
  TouchableWithoutFeedback,
} from "react-native";

import HamburgerButton from "../../components/Hamburger";
import Sidebar from "../../components/Sidebar";
import HeaderLogo from "../../components/HeaderLogo";
import TabSwitcher from "../../components/TabSwitcher";
import BottomButton from "../../components/BottomButton";
import CloseBtn from "../../../assets/closeBtn.svg";

import StoreMenuScreen from "./StoreMenuScreen";
import StoreEventScreen from "./StoreEventScreen";
import StoreReviewScreen from "./StoreReviewScreen";

// 메뉴판 스타일 버튼 더미이미지
// import MenuStyleDummy1 from "../../data/menuStyleDummy/menuStyleDummy1.svg";
import MenuStyleDummy2 from "../../data/menuStyleDummy/menuStyleDummy2.svg";
import MenuStyleDummy3 from "../../data/menuStyleDummy/menuStyleDummy3.svg";
import MenuStyleDummy4 from "../../data/menuStyleDummy/menuStyleDummy4.svg";
import MenuStyleDummy5 from "../../data/menuStyleDummy/menuStyleDummy5.svg";
// 이미지 문제인지 테스트용
import MenuStyleDummy1 from "../../../assets/sideFork.svg";

interface StoreProps {
  onGoBack: () => void;
}

export default function StoreScreen({ onGoBack }: StoreProps) {
  const { width, height } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState("menu");

  // 메뉴데이터 없을 시 메뉴판 스타일 출력안하게끔
  const [hasMenuData, setHasMenuData] = useState(false);

  // 모달 출력 관련
  const [showModal, setShowModal] = useState(false);
  const [selectedStyleKey, setSelectedStyleKey] = useState<string | null>(null);

  const tabs = [
    { key: "menu", label: "메뉴" },
    { key: "event", label: "가게 이벤트" },
    { key: "review", label: "리뷰" },
  ];

  return (
    <SafeAreaView style={[{ backgroundColor: "#F7F8F9", flex: 1 }]}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <HamburgerButton
          userRole="eater"
          onLogout={() => {
            console.log("로그아웃");
          }}
          activePage="storePage"
        />
        <HeaderLogo />
        <TouchableOpacity
          onPress={onGoBack}
          style={{
            padding: 10,
            alignSelf: "flex-end",
            marginRight: 20,
            marginTop: 10,
            backgroundColor: "#eee",
            borderRadius: 8,
          }}
        >
          <Text>뒤로가기</Text>
        </TouchableOpacity>
      </View>

      {/* 가게정보 */}
      <View style={styles.storeInfo}>
        <Text style={styles.storeName}>햄찌네 피자</Text>
        <Text style={styles.storeAddress}>
          📍서울특별시 강남구 테헤란로 212
        </Text>
      </View>

      {/* 탭 스위치 */}
      <TabSwitcher
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
        }}
      />

      <View style={{ flex: 1 }}>
        {activeTab === "menu" && (
          <StoreMenuScreen onDataCheck={setHasMenuData} />
        )}
        {activeTab === "event" && <StoreEventScreen />}
        {activeTab === "review" && <StoreReviewScreen />}
      </View>

      {/* 메뉴판 스타일 버튼 */}
      {activeTab === "menu" && hasMenuData && (
        <View style={styles.styleSelector}>
          <TouchableOpacity
            style={styles.menuStyleBtn}
            onPress={() => {
              setSelectedStyleKey("1");
              setShowModal(true);
            }}
          >
            <MenuStyleDummy1 width={50} height={50} />
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
      )}

      {selectedStyleKey && (
        <Modal
          animationType="fade"
          transparent
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          {/* 바깥 눌렀을 때 닫기 */}
          <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View style={styles.modalOverlay}>
              {/* 안쪽 눌렀을 땐 닫히지 않게 */}
              <TouchableWithoutFeedback onPress={() => {}}>
                <View style={styles.modalContent}>
                  {/* X 버튼 */}
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setShowModal(false)}
                  >
                    <CloseBtn></CloseBtn>
                  </TouchableOpacity>

                  {selectedStyleKey === "1" && (
                    <MenuStyleDummy1
                      width={width * 0.8}
                      height={height * 0.6}
                    />
                  )}
                  {selectedStyleKey === "2" && (
                    <MenuStyleDummy2
                      width={width * 0.8}
                      height={height * 0.6}
                    />
                  )}
                  {selectedStyleKey === "3" && (
                    <MenuStyleDummy3
                      width={width * 0.8}
                      height={height * 0.6}
                    />
                  )}
                  {selectedStyleKey === "4" && (
                    <MenuStyleDummy4
                      width={width * 0.8}
                      height={height * 0.6}
                    />
                  )}
                  {selectedStyleKey === "5" && (
                    <MenuStyleDummy5
                      width={width * 0.8}
                      height={height * 0.6}
                    />
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* 하단 버튼 */}
      <BottomButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    paddingTop: 40,
  },
  storeInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginVertical: 10,
  } as ViewStyle,
  storeName: {
    fontSize: 20,
    fontWeight: "500",
    marginRight: 12,
  } as TextStyle,
  storeAddress: {
    marginTop: 9,
    fontSize: 12,
    letterSpacing: -0.3,
  } as TextStyle,

  styleSelector: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  menuStyleContainer: {
    flexDirection: "row",
    paddingVertical: 10,
  } as ViewStyle,
  menuStyleBtn: {
    flex: 1,
    alignItems: "center",
  } as ViewStyle,
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
  closeButtonText: {
    fontSize: 28,
    color: "#999",
  } as TextStyle,
});
