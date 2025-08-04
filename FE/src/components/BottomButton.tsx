import React from "react";

import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

export default function BottomButton() {
  return (
    <View style={styles.bottomBtnContainer}>
      <TouchableOpacity style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>리뷰 작성하기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>찾아가기</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomTextWrapper}>
        <Text style={styles.bottomText}>메뉴판 꾸미기</Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  bottomBtnContainer: {
    flexDirection: "row",
    marginBottom: 60,
    paddingVertical: 20,
    backgroundColor: "#eeeeee",
  } as ViewStyle,

  bottomTextWrapper: {
    flex: 1,
  } as ViewStyle,

  bottomText: {
    textAlign: "center",
    fontSize: 18,
  } as TextStyle,
});
