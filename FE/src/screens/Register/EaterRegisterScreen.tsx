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
  Image, // 추가
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthNavigator";
import InputGroup from "../../components/InputGroup";
import { AuthField } from "../../components/AuthForm";
import { COLORS, textStyles } from "../../constants/theme";
import ResultModal from "../../components/ResultModal";

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "EaterRegisterScreen"
>;

type Props = {
  onBack?: () => void;
  onComplete?: () => void;
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

export default function EaterRegisterScreen(props?: Props) {
  const navigation = useNavigation<NavigationProp>();
  const { width, height } = useWindowDimensions();
  const secondaryColor = COLORS.secondaryEater;

  const btnHeight = height * 0.055;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");

  const handleBack = () => navigation.goBack();
  const handleComplete = () => navigation.navigate("Login");

  const goBack = props?.onBack || handleBack;
  const complete = props?.onComplete || handleComplete;

  const handleSubmit = () => {
    setModalType("success");
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    complete();
  };

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
          {/* Header */}
          <View style={[styles.header, { paddingTop: height * 0.048 }]}>
            <TouchableOpacity onPress={goBack} style={styles.backButton}>
              <Text style={[styles.backArrow, { fontSize: width * 0.06 }]}>
                ←
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.logo, { fontSize: width * 0.068 }]}>
              Create <Text style={{ color: secondaryColor }}>Eater</Text>
            </Text>
            <View style={styles.placeholder} />
          </View>

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
  submitSection: {
    paddingTop: 20,
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
