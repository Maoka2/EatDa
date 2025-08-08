// src/screens/Register/MakerRegisterScreen.tsx
import React, { useRef, useState } from "react";
import {
  SafeAreaView, View, Text, ImageBackground, TouchableOpacity, ScrollView,
  StyleSheet, useWindowDimensions, Alert, KeyboardAvoidingView, Platform,
  Keyboard, TouchableWithoutFeedback, Image,
} from "react-native";
import StepIndicator from "../../components/StepIndicator";
import InputGroup from "../../components/InputGroup";
import { COLORS, textStyles } from "../../constants/theme";
import ResultModal from "../../components/ResultModal";
import * as ImagePicker from "expo-image-picker";
import { API_KEYS } from "../../../config/apiKeys";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

import {
  DuplicateCheckResponse,
  DuplicateCheckStates,
  FormData,
  ValidationErrors,
  ValidationTypes,
  MenuItemType,
} from "./types";

import MakerStep1BasicInfo from "./steps/MakerStep1BasicInfo";
import MakerStep2BusinessLicense from "./steps/MakerStep2BusinessLicense";
import MakerStep3MenuOCR from "./steps/MakerStep3MenuOCR";
import MakerStep4Agreements from "./steps/MakerStep4Agreements";
import {
  parseMenuFromText,
  processWithGoogleVision,
  processWithNaverClova,
  readImageAsBase64,
} from "./services/ocr";

type Props = NativeStackScreenProps<AuthStackParamList, "MakerRegisterScreen">;

export default function MakerRegisterScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const totalSteps = 4;
  const secondaryColor = COLORS.secondaryMaker;
  const btnHeight = height * 0.055;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    passwordConfirm: "",
    storeName: "",
    storeLocation: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [validationTypes, setValidationTypes] = useState<ValidationTypes>({});
  const [duplicateCheckStates, setDuplicateCheckStates] = useState<DuplicateCheckStates>({ email: "none" });

  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [businessLicenseUri, setBusinessLicenseUri] = useState<string | null>(null);
  const [agreementsState, setAgreementsState] = useState({ terms: false, marketing: false });
  const [isScanning, setIsScanning] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** ====== Step1 입력/검증 ====== */
  const handleInputChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));

    if (validationErrors[key]) setValidationErrors((p) => ({ ...p, [key]: undefined }));
    if (validationTypes[key]) setValidationTypes((p) => ({ ...p, [key]: "none" }));

    if (key === "email") {
      setDuplicateCheckStates((p) => ({ ...p, email: "none" }));
      if (value && !emailRegex.test(value)) {
        setValidationErrors((p) => ({ ...p, email: "올바른 이메일 형식이 아닙니다." }));
        setValidationTypes((p) => ({ ...p, email: "error" }));
      }
    }

    if (key === "password") {
      if (value && value.length < 8) {
        setValidationErrors((p) => ({ ...p, password: "비밀번호는 8자 이상이어야 합니다." }));
        setValidationTypes((p) => ({ ...p, password: "error" }));
      }
      if (formData.passwordConfirm && value !== formData.passwordConfirm) {
        setValidationErrors((p) => ({ ...p, passwordConfirm: "비밀번호가 일치하지 않습니다." }));
        setValidationTypes((p) => ({ ...p, passwordConfirm: "error" }));
      } else if (formData.passwordConfirm && value === formData.passwordConfirm) {
        setValidationErrors((p) => ({ ...p, passwordConfirm: "" }));
        setValidationTypes((p) => ({ ...p, passwordConfirm: "none" }));
      }
    }

    if (key === "passwordConfirm") {
      if (value && formData.password !== value) {
        setValidationErrors((p) => ({ ...p, passwordConfirm: "비밀번호가 일치하지 않습니다." }));
        setValidationTypes((p) => ({ ...p, passwordConfirm: "error" }));
      } else if (value && formData.password === value) {
        setValidationErrors((p) => ({ ...p, passwordConfirm: "" }));
        setValidationTypes((p) => ({ ...p, passwordConfirm: "none" }));
      }
    }
  };

  const isStep1NextEnabled = () => {
    const allFilled =
      formData.email.trim() &&
      formData.password.trim() &&
      formData.passwordConfirm.trim() &&
      formData.storeName.trim() &&
      formData.storeLocation.trim();

    const emailValid = emailRegex.test(formData.email);
    const pwValid = formData.password.length >= 8;
    const pwMatch = formData.password === formData.passwordConfirm;
    const noErrors =
      validationTypes.email !== "error" &&
      validationTypes.password !== "error" &&
      validationTypes.passwordConfirm !== "error";
    const dupOk = duplicateCheckStates.email === "success";

    return !!(allFilled && emailValid && pwValid && pwMatch && noErrors && dupOk);
  };

  /** 이메일 중복검사 */
  const checkEmailDuplicate = async (email: string): Promise<boolean> => {
    const response = await fetch(`https://i13a609.p.ssafy.io/test/api/makers/check-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const responseText = await response.text();
    let responseData: DuplicateCheckResponse;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      throw new Error(`서버 응답 파싱 실패: ${responseText}`);
    }

    if (response.status === 409) return true; // 중복
    if (!response.ok) throw responseData;
    return responseData.data; // true면 중복
  };

  const handleEmailDuplicateCheck = async () => {
    if (!formData.email.trim()) {
      setValidationErrors((p) => ({ ...p, email: "이메일을 입력해주세요." }));
      setValidationTypes((p) => ({ ...p, email: "error" }));
      return;
    }
    if (!emailRegex.test(formData.email)) {
      setValidationErrors((p) => ({ ...p, email: "올바른 이메일 형식이 아닙니다." }));
      setValidationTypes((p) => ({ ...p, email: "error" }));
      return;
    }

    try {
      setDuplicateCheckStates((p) => ({ ...p, email: "checking" }));
      const isDuplicate = await checkEmailDuplicate(formData.email);
      if (isDuplicate) {
        setDuplicateCheckStates((p) => ({ ...p, email: "duplicate" }));
        setValidationErrors((p) => ({ ...p, email: "이미 사용중인 이메일입니다." }));
        setValidationTypes((p) => ({ ...p, email: "error" }));
      } else {
        setDuplicateCheckStates((p) => ({ ...p, email: "success" }));
        setValidationErrors((p) => ({ ...p, email: "사용 가능한 이메일입니다." }));
        setValidationTypes((p) => ({ ...p, email: "success" }));
      }
    } catch {
      setDuplicateCheckStates((p) => ({ ...p, email: "none" }));
      setValidationErrors((p) => ({ ...p, email: "이메일 중복 검사에 실패했습니다." }));
      setValidationTypes((p) => ({ ...p, email: "error" }));
    }
  };

  /** ====== Step2: 사업자등록증 업로드 ====== */
  const handleBusinessLicenseUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      setBusinessLicenseUri(uri);
      Alert.alert("업로드 완료", "사업자 등록증이 업로드되었습니다.");
    } catch (e) {
      console.error("Business license upload error:", e);
      Alert.alert("오류", "사업자 등록증 업로드 중 오류가 발생했습니다.");
    }
  };

  /** ====== Step3: OCR 스캔 ====== */
  const handleMenuScan = async () => {
    setIsScanning(true);
    try {
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (cameraPerm.status !== "granted" || mediaPerm.status !== "granted") {
        Alert.alert("권한 필요", "카메라 및 갤러리 접근 권한이 필요합니다.");
        setIsScanning(false);
        return;
      }

      Alert.alert("메뉴판 스캔", "메뉴판을 어떻게 업로드하시겠습니까?", [
        {
          text: "카메라로 촬영",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled) await processMenuImage(result.assets[0].uri);
            else setIsScanning(false);
          },
        },
        {
          text: "갤러리에서 선택",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
              allowsEditing: true,
            });
            if (!result.canceled) await processMenuImage(result.assets[0].uri);
            else setIsScanning(false);
          },
        },
        { text: "취소", style: "cancel", onPress: () => setIsScanning(false) },
      ]);
    } catch (error) {
      console.error("Menu scan error:", error);
      Alert.alert("오류", "메뉴 스캔 중 오류가 발생했습니다.");
      setIsScanning(false);
    }
  };

  const processMenuImage = async (imageUri: string) => {
    try {
      const GOOGLE_VISION_API_KEY = API_KEYS.GOOGLE_VISION;
      const NAVER_CLOVA_SECRET = ""; // 필요 시 설정
      const NAVER_CLOVA_ENDPOINT = "https://naveropenapi.apigw.ntruss.com/custom/v1/your-domain/your-api-version/general";

      let extracted: MenuItemType[] = [];

      if (GOOGLE_VISION_API_KEY && GOOGLE_VISION_API_KEY !== API_KEYS.GOOGLE_VISION) {
        const base64 = await readImageAsBase64(imageUri);
        extracted = await processWithGoogleVision(base64, GOOGLE_VISION_API_KEY);
      } else if (NAVER_CLOVA_SECRET && NAVER_CLOVA_SECRET !== "YOUR_NAVER_CLOVA_API_KEY") {
        extracted = await processWithNaverClova(imageUri, NAVER_CLOVA_SECRET, NAVER_CLOVA_ENDPOINT);
      } else {
        // 더미
        await new Promise((r) => setTimeout(r, 1500));
        extracted = [
          { id: Date.now().toString() + "_1", name: "김치찌개", price: "8,000원", description: "" },
          { id: Date.now().toString() + "_2", name: "제육볶음", price: "12,000원", description: "" },
          { id: Date.now().toString() + "_3", name: "된장찌개", price: "7,000원", description: "" },
        ];
      }

      if (extracted.length === 0) {
        Alert.alert("스캔 결과", "메뉴를 인식할 수 없습니다. 다시 시도해주세요.");
      } else {
        setMenuItems(extracted);
        Alert.alert("스캔 완료", `${extracted.length}개의 메뉴를 인식했습니다.\n메뉴를 터치하여 이미지와 설명을 추가해주세요.`);
      }
    } catch (e) {
      console.error("OCR Processing error:", e);
      Alert.alert("오류", "OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsScanning(false);
    }
  };

  /** 메뉴 편집 */
  const handleEditMenu = (id: string) => {
    setEditingMenuId(id);
    setEditModalVisible(true);
  };
  const handleSaveMenuEdit = () => {
    setEditingMenuId(null);
    setEditModalVisible(false);
  };
  const updateMenuItem = (id: string, field: keyof MenuItemType, value: string) => {
    setMenuItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const removeMenuItem = (id: string) => setMenuItems((prev) => prev.filter((i) => i.id !== id));
  const handleAddMenuImage = async (menuId: string) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("권한 필요", "갤러리 접근 권한이 필요합니다.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled) updateMenuItem(menuId, "imageUri", result.assets[0].uri);
    } catch (e) {
      console.error("Menu image add error:", e);
      Alert.alert("오류", "이미지 추가 중 오류가 발생했습니다.");
    }
  };

  /** Step4 동의 */
  const toggleAgreement = (key: keyof typeof agreementsState) =>
    setAgreementsState((p) => ({ ...p, [key]: !p[key] }));

  /** 네비게이션/제출 */
  const getCurrentTitle = () => {
    if (currentStep === 1) return "기본 정보 입력";
    if (currentStep === 2) return "사업자 등록증 첨부";
    if (currentStep === 3) return "메뉴 이미지 · 이름 · 설명 등록";
    if (currentStep === 4) return "고객 리뷰 활용 및 메뉴판 제작 동의";
    return "";
  };
  const getButtonText = () => (currentStep < totalSteps ? "다음 단계" : "가입하기");

  const validateStep1 = () => {
    const f = formData;
    if (!f.email.trim() || !f.password.trim() || !f.passwordConfirm.trim() || !f.storeName.trim() || !f.storeLocation.trim()) {
      Alert.alert("알림", "모든 필드를 입력해주세요.");
      return false;
    }
    if (!emailRegex.test(f.email)) return Alert.alert("알림", "올바른 이메일 형식이 아닙니다."), false;
    if (f.password.length < 8) return Alert.alert("알림", "비밀번호는 8자 이상이어야 합니다."), false;
    if (f.password !== f.passwordConfirm) return Alert.alert("알림", "비밀번호가 일치하지 않습니다."), false;
    if (duplicateCheckStates.email !== "success") return Alert.alert("알림", "이메일 중복 검사를 완료해주세요."), false;
    return true;
  };
  const validateStep2 = () => true;
  const validateStep3 = () => true;

  const handleSubmit = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
    } else {
      if (!agreementsState.terms || !agreementsState.marketing) {
        Alert.alert("알림", "필수 동의 항목을 모두 체크해주세요.");
        return;
      }
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    try {
      const registrationData = { ...formData, businessLicenseUri, menuItems, agreements: agreementsState };
      console.log("Registration data:", registrationData);
      setModalType("success");
      setModalVisible(true);
    } catch (e) {
      console.error("Registration error:", e);
      setModalType("failure");
      setModalVisible(true);
    }
  };

  const handleBack = () => (currentStep > 1 ? setCurrentStep((s) => s - 1) : navigation.goBack());
  const handlePrevStep = () => {
    setCurrentStep((s) => s - 1);
    setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100);
  };
  const handleModalClose = () => {
    setModalVisible(false);
    navigation.navigate("Login");
  };
  const dismissKeyboard = () => Keyboard.dismiss();

  /** Step 렌더링 */
  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <MakerStep1BasicInfo
            formData={formData}
            validationErrors={validationErrors}
            validationTypes={validationTypes}
            duplicateCheckStates={duplicateCheckStates}
            onChange={handleInputChange}
            onEmailDuplicateCheck={handleEmailDuplicateCheck}
            onFieldFocus={(idx) => {
              const y = idx * (btnHeight + height * 0.015 + 30);
              scrollViewRef.current?.scrollTo({ y, animated: true });
            }}
            btnHeight={btnHeight}
          />
        );
      case 2:
        return (
          <MakerStep2BusinessLicense
            businessLicenseUri={businessLicenseUri}
            onUpload={handleBusinessLicenseUpload}
          />
        );
      case 3:
        return (
          <MakerStep3MenuOCR
            isScanning={isScanning}
            menuItems={menuItems}
            onScan={handleMenuScan}
            editModalVisible={editModalVisible}
            editingMenuId={editingMenuId}
            onCloseEdit={() => setEditModalVisible(false)}
            onSaveEdit={handleSaveMenuEdit}
            onUpdateMenuItem={updateMenuItem}
            onRemoveMenuItem={removeMenuItem}
            onAddMenuImage={handleAddMenuImage}
            onOpenEdit={handleEditMenu}
          />
        );
      case 4:
        return (
          <MakerStep4Agreements
            agreements={agreementsState}
            toggle={toggleAgreement}
          />
        );
      default:
        return null;
    }
  };

  const renderButtons = () =>
    currentStep === 1 ? (
      (() => {
        const ready = isStep1NextEnabled();
        return (
          <TouchableOpacity
            style={[
              styles.submitButton,
              styles.fullWidthButton,
              { backgroundColor: ready ? secondaryColor : "#ccc", height: btnHeight },
            ]}
            onPress={handleSubmit}
            disabled={!ready}
          >
            <Text style={[styles.submitButtonText, { fontSize: width * 0.04, color: ready ? "#fff" : "#999" }]}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        );
      })()
    ) : (
      <>
        <TouchableOpacity style={[styles.prevButton, { height: btnHeight }]} onPress={handlePrevStep}>
          <Text style={[styles.prevButtonText, { fontSize: width * 0.04 }]}>이전 단계</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: secondaryColor, height: btnHeight }]}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, { fontSize: width * 0.04 }]}>{getButtonText()}</Text>
        </TouchableOpacity>
      </>
    );

  return (
    <View style={styles.container}>
      <ImageBackground source={require("../../../assets/white-background.png")} style={styles.background} resizeMode="cover">
        <SafeAreaView style={[styles.content, { paddingVertical: height * 0.02 }]}>
          <View style={[styles.header, { paddingTop: height * 0.048 }]}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={[styles.backArrow, { fontSize: width * 0.06 }]}>←</Text>
            </TouchableOpacity>
            <Text style={[textStyles.logo, { fontSize: width * 0.068 }]}>
              Create <Text style={{ color: secondaryColor }}>Maker</Text>
            </Text>
            <View style={styles.placeholder} />
          </View>

          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} activeColor={secondaryColor} />
          <Text style={[styles.title, { fontSize: width * 0.045, color: "#333" }]}>{getCurrentTitle()}</Text>

          <KeyboardAvoidingView style={styles.keyboardAvoidingView} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <ScrollView
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {renderContent()}
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

          <View style={styles.bottomButtonsContainer}>{renderButtons()}</View>

          <ResultModal
            visible={modalVisible}
            type={modalType}
            message={modalType === "success" ? "회원가입이 완료되었습니다!" : "회원가입 중 오류가 발생했습니다."}
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
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingBottom: 20, paddingHorizontal: 20,
  },
  backArrow: { color: COLORS.text, fontWeight: "bold" },
  placeholder: { width: 30 },
  title: { textAlign: "center", fontWeight: "700", marginBottom: 20, paddingHorizontal: 20 },
  keyboardAvoidingView: { flex: 1 },
  scrollViewContent: { paddingHorizontal: 20, paddingBottom: 20, flexGrow: 1 },

  bottomButtonsContainer: { flexDirection: "row", paddingHorizontal: 20, paddingBottom: 20, gap: 10, minHeight: 55 },
  prevButton: { backgroundColor: COLORS.gray300, borderRadius: 10, justifyContent: "center", alignItems: "center", flex: 1 },
  prevButtonText: { color: COLORS.text, fontWeight: "600" },
  submitButton: {
    backgroundColor: COLORS.secondaryMaker, borderRadius: 10, justifyContent: "center", alignItems: "center",
    flex: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  fullWidthButton: { flex: 1, width: "100%" },
  submitButtonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
});
