import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { COLORS } from "../../../constants/theme";

type Agreements = { terms: boolean; marketing: boolean };

type Props = {
  agreements: Agreements;
  toggle: (key: keyof Agreements) => void;
};

export default function MakerStep4Agreements({ agreements, toggle }: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.agreementsContainer}>
        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => toggle("terms")}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreements.terms
                  ? COLORS.secondaryMaker
                  : COLORS.inactive,
                backgroundColor: agreements.terms
                  ? COLORS.secondaryMaker
                  : "transparent",
              },
            ]}
          >
            {agreements.terms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.agreementText, { fontSize: width * 0.035 }]}>
            고객 리뷰를 활용한 메뉴판 제작에 동의합니다. {"\n"}
            고객들의 솔직한 리뷰를 통해 {"\n"} 더 매력적인 메뉴판을
            만들어드립니다.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => toggle("marketing")}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreements.marketing
                  ? COLORS.secondaryMaker
                  : COLORS.inactive,
                backgroundColor: agreements.marketing
                  ? COLORS.secondaryMaker
                  : "transparent",
              },
            ]}
          >
            {agreements.marketing && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.agreementText, { fontSize: width * 0.035 }]}>
            마케팅 정보 수신에 동의합니다. {"\n"}
            새로운 기능 업데이트와 이벤트 정보를 {"\n"} 받아보실 수 있습니다.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: "center", marginTop: height * 0.02 }}>
        <Text
          style={[
            styles.notice,
            { fontSize: width * 0.03, textAlign: "center" },
          ]}
        >
          회원가입 완료 후 관리자 승인을 거쳐{"\n"}
          서비스를 이용하실 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  agreementsContainer: { marginBottom: 30 },
  agreementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 10,
    marginTop: 30,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginRight: 15,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  agreementText: { flex: 1, color: COLORS.text, lineHeight: 22 },
  notice: { color: COLORS.inactive },
});
