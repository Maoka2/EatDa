import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  TextInput,
  ViewStyle,
  TextStyle,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../../navigation/AuthNavigator"; // 경로 수정 필요

import HamburgerButton from "../../../components/Hamburger";
import HeaderLogo from "../../../components/HeaderLogo";
import TabSwitcher from "../../../components/TabSwitcher";
import GoingImg from "../../../../assets/goingImage.svg";
import Destination from "../../../../assets/destination.svg";
import ChangeInput from "../../../../assets/changeInput.svg";
import SearchButton from "../../../../assets/searchBlackType.svg";
import BottomButton from "../../../components/BottomButton";
import NoDataScreen from "../../../components/NoDataScreen";
import { FindWayData, PublicRoute } from "../../../data/findWayData";
import PathFind from "../../../components/pathFind";

interface StoreMapScreenProps {
  onClose: () => void;
}

export default function MapScreen({ onClose }: StoreMapScreenProps) {
  const { width, height } = useWindowDimensions();
  const horizontalMargin = width * 0.06;

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeTab, setActiveTab] = useState("bus");
  const [findWayData, setFindWayData] = useState<PublicRoute[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = findWayData.filter((item) => {
    if (activeTab === "bus") return item.subPaths.some((sub) => sub.type === 2);
    if (activeTab === "subway")
      return item.subPaths.some((sub) => sub.type === 1);
    if (activeTab === "walk")
      return item.subPaths.every((sub) => sub.type === 3);
    return false;
  });

  const tabs = [
    { key: "bus", label: "버스" },
    { key: "subway", label: "지하철" },
    { key: "walk", label: "도보" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f7f8f9" }}>
      {/* 헤더 */}
      <View
        style={[
          styles.headerContainer,
          { marginHorizontal: horizontalMargin, marginTop: height * 0.057 },
        ]}
      >
        {/* <HamburgerButton
          userRole="eater"
         onMypage={}
        ></HamburgerButton> */}
        <HeaderLogo></HeaderLogo>
      </View>

      {/* 출도착지 입력 */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: width * 0.07,
          marginVertical: height * 0.03,
        }}
      >
        <View>
          <GoingImg
            width={30}
            height={30}
            style={{ marginLeft: 5, marginBottom: 10 }}
          />
          <Destination width={40} height={40} />
        </View>

        <View style={{ marginHorizontal: width * 0.025 }}>
          <TextInput
            value={from}
            onChangeText={setFrom}
            style={styles.inputBox}
            placeholder="출발지를 입력하세요"
          />
          <TextInput
            value={to}
            onChangeText={setTo}
            style={[styles.inputBox, { backgroundColor: "#f5f5f5" }]}
            placeholder="도착지를 입력하세요"
          />
        </View>

        <View>
          <TouchableOpacity
            onPress={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            <ChangeInput width={30} height={30} style={{ marginBottom: 20 }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setFindWayData(FindWayData);
            }}
          >
            <SearchButton width={30} height={30} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 스위치 */}
      <TabSwitcher
        tabs={tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
      />

      {/* 결과 목록 */}
      {findWayData.length === 0 ? (
        <NoDataScreen />
      ) : (
        <ScrollView style={{ paddingHorizontal: horizontalMargin }}>
          {filteredData.map((item, index) => (
            <View key={index} style={styles.routeCard}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{item.totalTime}분</Text>
                <Text style={styles.infoText}>
                  도보 {item.totalWalkTime}분 |{" "}
                  {(item.totalDistance / 1000).toFixed(1)}km
                </Text>
              </View>
              <PathFind route={item} />
            </View>
          ))}
        </ScrollView>
      )}

      <BottomButton onPress={() => console.log("페이지이동연결할게요")} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
  } as ViewStyle,
  inputBox: {
    width: 230,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e2e2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  routeCard: {
    marginVertical: 12,
    padding: 14,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  timeContainer: {
    marginBottom: 8,
  },
  timeText: {
    fontWeight: "bold",
    fontSize: 16,
  } as TextStyle,
  infoText: {
    color: "#888",
    marginTop: 4,
  } as TextStyle,
});
