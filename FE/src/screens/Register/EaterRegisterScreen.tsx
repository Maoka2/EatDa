// src/screens/Register/EaterRegisterScreen.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import InputGroup from "../../components/InputGroup";
import { AuthField } from "../../components/AuthForm";
import { COLORS, textStyles } from "../../constants/theme";
import ResultModal from "../../components/ResultModal";

type Props = {
  onBack: () => void;
  onComplete: () => void;
};

const eaterFields: AuthField[] = [
  { key: "nickname", label: "닉네임", placeholder: "닉네임을 입력해주세요" },
  {
    key: "email",
    label: "이메일",
    placeholder: "이메일을 입력해주세요",
    keyboardType: "email-address",
  },
  {
    key: "password",
    label: "비밀번호",
    placeholder: "비밀번호를 입력해주세요",
    secureTextEntry: true,
  },
  {
    key: "passwordConfirm",
    label: "비밀번호 확인",
    placeholder: "비밀번호를 다시 입력해주세요",
    secureTextEntry: true,
  },
];

const foodCategories = [
  { id: "tteokbokki", label: "떡볶이" },
  { id: "jokbal", label: "족발" },
  { id: "dakbal", label: "닭발" },
  { id: "gopchang", label: "곱창" },
  { id: "malaTang", label: "마라탕" },
];

export default function EaterRegisterScreen({ onBack, onComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const secondaryColor = COLORS.secondaryEater;

  // 로그인 화면과 동일한 인풋/버튼 높이
  const btnHeight = height * 0.055;
  // 90% 너비에서 패딩을 고려하여 5개 칩으로 나눔
  const chipWidth = (width * 0.9 - 40) / foodCategories.length;

  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [customFood, setCustomFood] = useState("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");

  const handleSubmit = (): void => {
    setModalType("success");
    setModalVisible(true);
  };

  const handleModalClose = (): void => {
    setModalVisible(false);
    onComplete();
  };

  const toggleFoodSelection = (id: string) =>
    setSelectedFoods((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/white-background.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView
          style={[styles.content, { paddingVertical: height * 0.02 }]}
        >
          {/* Header with Back Button */}
          <View style={[styles.header, { paddingTop: height * 0.048 }]}>
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Text style={[styles.backArrow, { fontSize: width * 0.06 }]}>
                ←
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.logo, { fontSize: width * 0.068 }]}>
              Create <Text style={{ color: secondaryColor }}>Eater</Text>
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Main Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {/* Form Fields */}
            <View>
              {eaterFields.map((field) => (
                <InputGroup
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  secureTextEntry={field.secureTextEntry}
                  keyboardType={field.keyboardType}
                  style={{
                    height: btnHeight,
                    paddingHorizontal: width * 0.04,
                    marginBottom: height * 0.01,
                  }}
                />
              ))}
            </View>

            {/* Food Selection */}
            <View style={styles.foodSelectionSection}>
              <Text
                style={[styles.foodSelectionTitle, { fontSize: width * 0.035 }]}
              >
                좋아하는 음식 선택
              </Text>
              <View style={styles.foodGrid}>
                {foodCategories.map((food) => {
                  const selected = selectedFoods.includes(food.id);
                  return (
                    <TouchableOpacity
                      key={food.id}
                      activeOpacity={0.8}
                      onPress={() => toggleFoodSelection(food.id)}
                      style={[
                        styles.foodChip,
                        {
                          width: chipWidth,
                          backgroundColor: selected ? secondaryColor : "#FFF",
                          borderColor: selected ? secondaryColor : "#E5E5E5",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.foodChipText,
                          {
                            color: selected ? "#FFF" : "#999",
                            fontSize: width * 0.035,
                          },
                        ]}
                      >
                        {food.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.customInputContainer}>
                <InputGroup
                  label=""
                  placeholder="기타 입력"
                  style={{
                    height: btnHeight,
                    paddingHorizontal: width * 0.04,
                  }}
                  value={customFood}
                  onChangeText={setCustomFood}
                />
              </View>
            </View>

            {/* Submit Button */}
            <View style={styles.submitSection}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: secondaryColor, height: btnHeight },
                ]}
                onPress={handleSubmit}
              >
                <Text
                  style={[styles.submitButtonText, { fontSize: width * 0.04 }]}
                >
                  가입하기
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <ResultModal
            visible={modalVisible}
            type={modalType}
            message="로그인 화면으로 이동합니다!"
            onClose={handleModalClose}
          />
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: "100%", height: "100%" },
  content: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { padding: 5 },
  backArrow: { color: COLORS.text, fontWeight: "bold" },
  placeholder: { width: 30 },

  scrollView: { flex: 1 },
  scrollViewContent: {
    paddingHorizontal: 20,
  },

  foodSelectionSection: {
    marginTop: 20,
  },
  foodSelectionTitle: {
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 10,
  },
  foodGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  foodChip: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  foodChipText: { fontWeight: "400" },

  customInputContainer: { marginTop: 5 },

  submitSection: {
    paddingVertical: 20,
  },
  submitButton: {
    width: "100%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
