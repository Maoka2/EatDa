// src/components/Sidebar.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import SidebarComponent from "./SidebarComponent";
import { imageStyles } from "../constants/theme";
// .svg 파일로 했을 때 이미지가 잘려서 일단 .png 로 진행하였습니다.
import MyPageIcon from "../../assets/mypage.svg";
import EventPageIcon from "../../assets/eventpage.svg";
import ReviewPageIcon from "../../assets/reviews.svg";

import SidebarCharacter from "../../assets/sidebarCharacter.svg";
import Spoon from "../../assets/sidespoon.svg";
import Fork from "../../assets/sidefork.svg";

export default function Sidebar() {
  const { width, height } = useWindowDimensions();
  const topPadding = height * 0.05;
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <SafeAreaView
      style={[
        styles.container,
        { paddingTop: topPadding, overflow: "visible" },
      ]}
    >
      <SidebarComponent
        label="고객 리뷰"
        IconComponent={ReviewPageIcon}
        onPress={() => setSelected("고객 리뷰")}
        selected={selected === "고객 리뷰"}
      ></SidebarComponent>
      <SidebarComponent
        label="이벤트 게시판"
        onPress={() => {
          setSelected("이벤트 게시판");
        }}
        IconComponent={EventPageIcon}
        selected={selected === "이벤트 게시판"}
      ></SidebarComponent>
      <SidebarComponent
        label="마이 페이지"
        onPress={() => {
          setSelected("마이 페이지");
        }}
        IconComponent={MyPageIcon}
        selected={selected === "마이 페이지"}
      ></SidebarComponent>
      {/* <View style={{ flex: 1 }}></View */}

      <View
        style={{
          position: "absolute",
          bottom: -50,
          right: -480,
          transform: [{ rotate: "-15deg" }],
        }}
      >
        <Fork width={1000}  height={600}></Fork>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: -200,
          left: -480,
          transform: [{ rotate: "20deg" }],
        }}
      >
        <Spoon width={1000} height={600}></Spoon>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F9",
    height: "100%",
    // backgroundColor: "yellow",
    width: "100%",
    position: "relative",
  },

  character: {
    // backgroundColor: "red",
    position: "absolute",
    // top: 0,
    bottom: 0,
    // width: "100%",
    // height: "100%",
    resizeMode: "contain",
    opacity: 0.9,
  },
});
