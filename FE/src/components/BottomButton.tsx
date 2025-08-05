import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

interface BottomButtonProps {
  onPress: (screen: string) => void;
}

export default function BottomButton({ onPress }: BottomButtonProps) {
  const [clickedBtn, setClickedBtn] = useState<string | null>(null);

  const handlePress = (btn: string) => {
    setClickedBtn(btn);
    onPress(btn); // 부모 컴포넌트로 화면 전환 요청
  };

  return (
    <View style={styles.bottomBtnContainer}>
      <TouchableOpacity
        style={
          clickedBtn === "review"
            ? styles.selectedWrapper
            : styles.bottomTextWrapper
        }
        onPress={() => handlePress("review")}
      >
        <Text
          style={
            clickedBtn === "review" ? styles.selectedBtn : styles.bottomText
          }
        >
          리뷰 작성하기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={
          clickedBtn === "map"
            ? styles.selectedWrapper
            : styles.bottomTextWrapper
        }
        onPress={() => handlePress("map")}
      >
        <Text
          style={clickedBtn === "map" ? styles.selectedBtn : styles.bottomText}
        >
          찾아가기
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={
          clickedBtn === "menu"
            ? styles.selectedWrapper
            : styles.bottomTextWrapper
        }
        onPress={() => handlePress("menu")}
      >
        <Text
          style={clickedBtn === "menu" ? styles.selectedBtn : styles.bottomText}
        >
          메뉴판 꾸미기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBtnContainer: {
    flexDirection: "row",
    backgroundColor: "#eeeeee",
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  bottomTextWrapper: {
    flex: 1,
    paddingVertical: 20,
  } as ViewStyle,
  bottomText: {
    textAlign: "center",
    fontSize: 14,
    color: "#333333",
  } as TextStyle,
  selectedBtn: {
    textAlign: "center",
    fontSize: 14,
    color: "#FFFFFF",
  } as TextStyle,
  selectedWrapper: {
    flex: 1,
    backgroundColor: "#53A3DA",
    paddingVertical: 20,
  } as ViewStyle,
});
