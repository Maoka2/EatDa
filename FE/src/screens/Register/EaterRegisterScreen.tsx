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
  KeyboardAvoidingView, // 안드로이드 키보드 회피
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

// API 요청/응답 타입 정의
interface EaterRegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
}

interface EaterRegisterResponse {
  code: string;
  message: string;
  status: number;
  data: {
    id: number;
    email: string;
    nickname: string;
  };
  timestamp: string;
}

// 중복 검사 API 응답 타입
interface DuplicateCheckResponse {
  code: string;
  message: string;
  status: number;
  data: boolean; // true: 중복됨, false: 사용가능
}

// 폼 데이터 타입
interface FormData {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
}

// 유효성 검사 오류 타입
interface ValidationErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  nickname?: string;
}

// 유효성 검사 타입 (색상 결정용)
interface ValidationTypes {
  email?: "error" | "success" | "none";
  password?: "error" | "success" | "none";
  passwordConfirm?: "error" | "success" | "none";
  nickname?: "error" | "success" | "none";
}

// 중복 검사 상태 타입
interface DuplicateCheckStates {
  email: "none" | "checking" | "success" | "duplicate";
  nickname: "none" | "checking" | "success" | "duplicate";
}

const passwordFields: AuthField[] = [
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

  // ResultModal 상태
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");
  const [modalMessage, setModalMessage] = useState(""); 

  const [isLoading, setIsLoading] = useState(false);

  // 폼 데이터 상태
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });

  // 유효성 검사 오류 상태
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // 유효성 검사 타입 상태 (색상 결정용)
  const [validationTypes, setValidationTypes] = useState<ValidationTypes>({});

  // 중복 검사 상태
  const [duplicateCheckStates, setDuplicateCheckStates] =
    useState<DuplicateCheckStates>({
      email: "none",
      nickname: "none",
    });

  const handleBack = () => navigation.goBack();
  const handleComplete = () => navigation.navigate("Login");

  const goBack = props?.onBack || handleBack;
  const complete = props?.onComplete || handleComplete;

  // 입력값 변경 핸들러
  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    // 입력 시 해당 필드의 오류 메시지 제거
    if (validationErrors[key]) {
      setValidationErrors((prev) => ({ ...prev, [key]: undefined }));
      setValidationTypes((prev) => ({ ...prev, [key]: "none" }));
    }

    // 이메일이나 닉네임이 변경되면 중복 검사 상태 초기화
    if (key === "email" || key === "nickname") {
      setDuplicateCheckStates((prev) => ({ ...prev, [key]: "none" }));
    }

    // 실시간 프론트엔드 유효성 검사
    if (key === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setValidationErrors((prev) => ({
          ...prev,
          email: "올바른 이메일 형식이 아닙니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, email: "error" }));
      }
    }

    if (key === "password") {
      if (value && value.length < 8) {
        setValidationErrors((prev) => ({
          ...prev,
          password: "비밀번호는 8자 이상이어야 합니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, password: "error" }));
      }

      // 비밀번호 확인과 일치성 검사
      if (formData.passwordConfirm && value !== formData.passwordConfirm) {
        setValidationErrors((prev) => ({
          ...prev,
          passwordConfirm: "비밀번호가 일치하지 않습니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, passwordConfirm: "error" }));
      } else if (
        formData.passwordConfirm &&
        value === formData.passwordConfirm
      ) {
        setValidationErrors((prev) => ({ ...prev, passwordConfirm: "" }));
        setValidationTypes((prev) => ({ ...prev, passwordConfirm: "none" }));
      }
    }

    if (key === "passwordConfirm") {
      if (value && formData.password !== value) {
        setValidationErrors((prev) => ({
          ...prev,
          passwordConfirm: "비밀번호가 일치하지 않습니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, passwordConfirm: "error" }));
      } else if (value && formData.password === value) {
        setValidationErrors((prev) => ({ ...prev, passwordConfirm: "" }));
        setValidationTypes((prev) => ({ ...prev, passwordConfirm: "none" }));
      }
    }

    if (key === "nickname") {
      if (value && value.includes(" ")) {
        setValidationErrors((prev) => ({
          ...prev,
          nickname: "닉네임에는 공백을 포함할 수 없습니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, nickname: "error" }));
      }
    }
  };

  // 이메일 중복 검사 API 호출
  const checkEmailDuplicate = async (email: string): Promise<boolean> => {
    try {
      console.log(`=== 이메일 중복 검사 API 요청 시작 ===`);
      console.log("요청 데이터:", { email });

      const response = await fetch(
        `https://i13a609.p.ssafy.io/test/api/eaters/check-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const responseText = await response.text();
      console.log(`이메일 중복 검사 응답:`, responseText);

      let responseData: DuplicateCheckResponse;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${responseText}`);
      }

      // 409는 중복을 의미하는 정상 응답으로 처리
      if (response.status === 409) {
        return true; // 중복됨
      }

      if (!response.ok) {
        throw responseData;
      }

      // data가 true면 중복, false면 사용가능
      return responseData.data;
    } catch (error) {
      console.error(`이메일 중복 검사 오류:`, error);
      throw error;
    }
  };

  // 닉네임 중복 검사 API 호출
  const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
    try {
      console.log(`=== 닉네임 중복 검사 API 요청 시작 ===`);
      console.log("요청 데이터:", { nickname });

      const response = await fetch(
        `https://i13a609.p.ssafy.io/test/api/eaters/check-nickname`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nickname }),
        }
      );

      const responseText = await response.text();
      console.log(`닉네임 중복 검사 응답:`, responseText);

      let responseData: DuplicateCheckResponse;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${responseText}`);
      }

      // 409는 중복을 의미하는 정상 응답으로 처리
      if (response.status === 409) {
        return true; // 중복됨
      }

      if (!response.ok) {
        throw responseData;
      }

      // data가 true면 중복, false면 사용가능
      return responseData.data;
    } catch (error) {
      console.error(`닉네임 중복 검사 오류:`, error);
      throw error;
    }
  };

  // 이메일 중복 검사 핸들러
  const handleEmailDuplicateCheck = async () => {
    if (!formData.email.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "이메일을 입력해주세요.",
      }));
      setValidationTypes((prev) => ({ ...prev, email: "error" }));
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationErrors((prev) => ({
        ...prev,
        email: "올바른 이메일 형식이 아닙니다.",
      }));
      setValidationTypes((prev) => ({ ...prev, email: "error" }));
      return;
    }

    try {
      setDuplicateCheckStates((prev) => ({ ...prev, email: "checking" }));

      const isDuplicate = await checkEmailDuplicate(formData.email);

      if (isDuplicate) {
        setDuplicateCheckStates((prev) => ({ ...prev, email: "duplicate" }));
        setValidationErrors((prev) => ({
          ...prev,
          email: "이미 사용중인 이메일입니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, email: "error" }));
      } else {
        setDuplicateCheckStates((prev) => ({ ...prev, email: "success" }));
        setValidationErrors((prev) => ({
          ...prev,
          email: "사용 가능한 이메일입니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, email: "success" }));
      }
    } catch (error: any) {
      setDuplicateCheckStates((prev) => ({ ...prev, email: "none" }));
      setValidationErrors((prev) => ({
        ...prev,
        email: "이메일 중복 검사에 실패했습니다.",
      }));
      setValidationTypes((prev) => ({ ...prev, email: "error" }));
    }
  };

  // 닉네임 중복 검사 핸들러
  const handleNicknameDuplicateCheck = async () => {
    if (!formData.nickname.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        nickname: "닉네임을 입력해주세요.",
      }));
      setValidationTypes((prev) => ({ ...prev, nickname: "error" }));
      return;
    }

    if (formData.nickname.includes(" ")) {
      setValidationErrors((prev) => ({
        ...prev,
        nickname: "닉네임에는 공백을 포함할 수 없습니다.",
      }));
      setValidationTypes((prev) => ({ ...prev, nickname: "error" }));
      return;
    }

    try {
      setDuplicateCheckStates((prev) => ({ ...prev, nickname: "checking" }));

      const isDuplicate = await checkNicknameDuplicate(formData.nickname);

      if (isDuplicate) {
        setDuplicateCheckStates((prev) => ({
          ...prev,
          nickname: "duplicate",
        }));
        setValidationErrors((prev) => ({
          ...prev,
          nickname: "이미 사용중인 닉네임입니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, nickname: "error" }));
      } else {
        setDuplicateCheckStates((prev) => ({ ...prev, nickname: "success" }));
        setValidationErrors((prev) => ({
          ...prev,
          nickname: "사용 가능한 닉네임입니다.",
        }));
        setValidationTypes((prev) => ({ ...prev, nickname: "success" }));
      }
    } catch (error: any) {
      setDuplicateCheckStates((prev) => ({ ...prev, nickname: "none" }));
      setValidationErrors((prev) => ({
        ...prev,
        nickname: "닉네임 중복 검사에 실패했습니다.",
      }));
      setValidationTypes((prev) => ({ ...prev, nickname: "error" }));
    }
  };

  // Eater 회원가입 API 호출
  const registerEater = async (
    data: EaterRegisterRequest
  ): Promise<EaterRegisterResponse> => {
    try {
      console.log("=== API 요청 시작 ===");
      console.log("요청 URL:", `https://i13a609.p.ssafy.io/test/api/eaters`);
      console.log("요청 데이터:", JSON.stringify(data, null, 2));

      const response = await fetch(
        `https://i13a609.p.ssafy.io/test/api/eaters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      console.log("=== API 응답 ===");
      console.log("응답 상태:", response.status);

      const responseText = await response.text();
      console.log("응답 본문:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`서버 응답을 파싱할 수 없습니다: ${responseText}`);
      }

      if (!response.ok) {
        throw responseData;
      }

      return responseData;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error("네트워크 연결을 확인해주세요.");
      }
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // 빈 값 체크
      const emptyFields = Object.entries(formData).filter(
        ([, value]) => !value.trim()
      );
      if (emptyFields.length > 0) {
        setModalType("failure");
        setModalMessage("모든 필드를 입력해주세요.");
        setModalVisible(true);
        return;
      }

      // 프론트엔드 유효성 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setModalType("failure");
        setModalMessage("올바른 이메일 형식이 아닙니다.");
        setModalVisible(true);
        return;
      }

      if (formData.password.length < 8) {
        setModalType("failure");
        setModalMessage("비밀번호는 8자 이상이어야 합니다.");
        setModalVisible(true);
        return;
      }

      if (formData.password !== formData.passwordConfirm) {
        setModalType("failure");
        setModalMessage("비밀번호가 일치하지 않습니다.");
        setModalVisible(true);
        return;
      }

      if (formData.nickname.includes(" ")) {
        setModalType("failure");
        setModalMessage("닉네임에는 공백을 포함할 수 없습니다.");
        setModalVisible(true);
        return;
      }

      // 중복 검사 완료 확인
      if (duplicateCheckStates.email !== "success") {
        setModalType("failure");
        setModalMessage("이메일 중복 검사를 완료해주세요.");
        setModalVisible(true);
        return;
      }

      if (duplicateCheckStates.nickname !== "success") {
        setModalType("failure");
        setModalMessage("닉네임 중복 검사를 완료해주세요.");
        setModalVisible(true);
        return;
      }

      // API 요청 데이터 준비
      const requestData: EaterRegisterRequest = {
        email: formData.email.trim(),
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        nickname: formData.nickname.trim(),
      };

      // 회원가입 API 호출
      const response = await registerEater(requestData);

      console.log("회원가입 성공:", response);
      setModalType("success");
      setModalMessage("회원가입이 완료되었습니다!");
      setModalVisible(true);
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      setModalType("failure");

      let errorMessage = "회원가입에 실패했습니다.";
      if (error?.message) {
        errorMessage = error.message;
      }
      setModalMessage(errorMessage);
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      complete();
    }
  };

  // 가입하기 버튼 활성화 여부 체크
  const isFormValid = () => {
    const allFieldsFilled = Object.values(formData).every(
      (value) => value.trim().length > 0
    );
    const duplicateChecksPassed =
      duplicateCheckStates.email === "success" &&
      duplicateCheckStates.nickname === "success";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailValid = emailRegex.test(formData.email);
    const passwordValid = formData.password.length >= 8;
    const passwordMatch = formData.password === formData.passwordConfirm;
    const nicknameValid = !formData.nickname.includes(" ");

    const noValidationErrors =
      validationTypes.email !== "error" &&
      validationTypes.password !== "error" &&
      validationTypes.passwordConfirm !== "error" &&
      validationTypes.nickname !== "error";

    return (
      allFieldsFilled &&
      duplicateChecksPassed &&
      emailValid &&
      passwordValid &&
      passwordMatch &&
      nicknameValid &&
      noValidationErrors
    );
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

          <KeyboardAvoidingView style={{ flex: 1 }} behavior="height">
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.scrollViewContent,
                { paddingBottom: 24 },
              ]}
            >
              {/* Form Fields */}
              <View>
                {/* 닉네임 입력 */}
                <InputGroup
                  label="닉네임"
                  placeholder="닉네임을 입력해주세요"
                  value={formData.nickname}
                  onChangeText={(value) => handleInputChange("nickname", value)}
                  validation={validationErrors.nickname || ""}
                  validationType={validationTypes.nickname}
                  showDuplicateCheck={true}
                  duplicateCheckDisabled={
                    duplicateCheckStates.nickname === "success"
                  }
                  duplicateCheckLoading={
                    duplicateCheckStates.nickname === "checking"
                  }
                  onDuplicateCheck={handleNicknameDuplicateCheck}
                  userRole="eater"
                  style={{
                    height: btnHeight,
                    paddingHorizontal: width * 0.04,
                  }}
                />

                {/* 이메일 입력 */}
                <InputGroup
                  label="이메일"
                  placeholder="이메일을 입력해주세요"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
                  validation={validationErrors.email || ""}
                  validationType={validationTypes.email}
                  showDuplicateCheck={true}
                  duplicateCheckDisabled={
                    duplicateCheckStates.email === "success"
                  }
                  duplicateCheckLoading={
                    duplicateCheckStates.email === "checking"
                  }
                  onDuplicateCheck={handleEmailDuplicateCheck}
                  userRole="eater"
                  style={{
                    height: btnHeight,
                    paddingHorizontal: width * 0.04,
                  }}
                />

                {/* 비밀번호 필드들 */}
                {passwordFields.map((field) => (
                  <InputGroup
                    key={field.key}
                    label={field.label}
                    placeholder={field.placeholder}
                    secureTextEntry={field.secureTextEntry}
                    keyboardType={field.keyboardType}
                    value={formData[field.key as keyof FormData]}
                    onChangeText={(value) =>
                      handleInputChange(field.key as keyof FormData, value)
                    }
                    validation={
                      validationErrors[field.key as keyof ValidationErrors] ||
                      ""
                    }
                    validationType={
                      validationTypes[field.key as keyof ValidationTypes]
                    }
                    userRole="eater"
                    style={{
                      height: btnHeight,
                      paddingHorizontal: width * 0.04,
                    }}
                  />
                ))}
              </View>

              {/* Submit Button */}
              <View style={styles.submitSection}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      backgroundColor: isLoading
                        ? "#ccc"
                        : isFormValid()
                        ? secondaryColor
                        : "#ccc",
                      height: btnHeight,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading || !isFormValid()}
                >
                  <Text
                    style={[
                      styles.submitButtonText,
                      {
                        fontSize: width * 0.04,
                        color: isFormValid() ? "#fff" : "#999",
                      },
                    ]}
                  >
                    {isLoading ? "가입 중..." : "가입하기"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <ResultModal
            visible={modalVisible}
            type={modalType}
            title={modalType === "success" ? "성공" : "실패"}
            message={modalMessage}
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
    justifyContent: "space_between",
    alignItems: "center",
    paddingBottom: 20,
    paddingHorizontal: 20,
  } as any, // RN 타입 경고 회피용
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
