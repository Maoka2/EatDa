import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { SvgProps } from "react-native-svg";

interface Props {
  label: string;
  onPress: () => void;
  IconComponent: React.FC<SvgProps>;
  selected?: boolean;
}

export default function SidebarComponent({
  IconComponent,
  label,
  onPress,
  selected = false,
// 일단 클릭했을 시 색깔 바뀌는걸로 해놓았습니다. 추후 나머지 페이지 완성 후 해당 페이지인 경우에 칠하게끔 수정하겠습니다.

}: Props) {
  const { width, height } = useWindowDimensions();
  const itemWidth = width;
  return (
    <TouchableOpacity onPress={onPress} style={styles.itemWrapper}>
      <View
        style={[
          { width: itemWidth },
          styles.item,
          selected && styles.selectedBtn,
        ]}
      >
        <IconComponent width={24} height={24}></IconComponent>
        <Text style={[styles.text, selected && styles.selectedText]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  itemWrapper: {
    paddingLeft: "10%",
    paddingVertical: 10,
    backgroundColor: "blue"
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  text: {
    paddingLeft: 20,
    fontSize: 15,
    fontWeight: "500",
    color: "#121212",
  },

  selectedBtn: {
    backgroundColor: "#FEC566",
    opacity: 0.8,
  },

  selectedText: {
    fontWeight: "bold",
  },
});
