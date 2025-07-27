// src/screens/Register/MakerRegisterScreen.tsx
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
  Alert,
} from "react-native";
import StepIndicator from "../../components/StepIndicator";
import InputGroup from "../../components/InputGroup";
import { AuthField } from "../../components/AuthForm";
import { COLORS, textStyles } from "../../constants/theme";
import ResultModal from "../../components/ResultModal";

type Props = {
  onBack: () => void;
  onComplete: () => void;
};

const makerStep1Fields: AuthField[] = [
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
  {
    key: "storeName",
    label: "가게 이름",
    placeholder: "가게 이름을 입력해주세요",
  },
  {
    key: "storeLocation",
    label: "가게 주소",
    placeholder: "가게 주소를 입력해주세요",
  },
];

type MenuItemType = {
  id: string;
  name: string;
  price: string;
  description: string;
  image?: string;
};

export default function MakerRegisterScreen({ onBack, onComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const totalSteps = 4;
  const secondaryColor = COLORS.secondaryMaker;

  const btnHeight = height * 0.055;

  const [currentStep, setCurrentStep] = useState(1);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [selectedMenuImage, setSelectedMenuImage] = useState<string | null>(
    null
  );
  const [businessLicense, setBusinessLicense] = useState<string | null>(null);
  const [agreementsState, setAgreementsState] = useState({
    terms: false,
    marketing: false,
  });

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");

  const getCurrentTitle = () => {
    if (currentStep === 1) return "기본 정보 입력";
    if (currentStep === 2) return "사업자 등록증 첨부";
    if (currentStep === 3) return "메뉴 이미지 · 이름 · 설명 등록";
    if (currentStep === 4) return "고객 리뷰 활용 및 메뉴판 제작 동의";
    return "";
  };

  const getButtonText = () => {
    if (currentStep < totalSteps) return "다음 단계 넘어가기";
    return "가입하기";
  };

  const handleSubmit = (): void => {
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      if (!agreementsState.terms || !agreementsState.marketing) {
        Alert.alert("알림", "필수 동의 항목을 모두 체크해주세요.");
        return;
      }
      setModalType("failure");
      setModalVisible(true);
    }
  };

  const handleModalClose = (): void => {
    setModalVisible(false);
    onComplete();
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    } else {
      onBack();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((s) => s - 1);
  };

  // OCR 메뉴 스캔 함수
  const handleMenuScan = () => {
    Alert.alert(
      "메뉴 스캔",
      "카메라로 메뉴판을 촬영하여 OCR 스캔을 시작합니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "촬영하기",
          onPress: () => {
            const sampleMenus: MenuItemType[] = [
              {
                id: "1",
                name: "김치찌개",
                price: "8,000",
                description: "얼큰한 김치찌개",
              },
              {
                id: "2",
                name: "된장찌개",
                price: "7,000",
                description: "구수한 된장찌개",
              },
              {
                id: "3",
                name: "불고기",
                price: "15,000",
                description: "달콤한 불고기",
              },
            ];
            setMenuItems(sampleMenus);
            setSelectedMenuImage("sample_menu.jpg");
          },
        },
      ]
    );
  };

  const updateMenuItem = (
    id: string,
    field: keyof MenuItemType,
    value: string
  ) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBusinessLicenseUpload = () => {
    Alert.alert(
      "사업자 등록증 업로드",
      "사업자 등록증을 촬영하거나 갤러리에서 선택하세요.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "카메라",
          onPress: () => {
            setBusinessLicense("camera_capture.jpg");
          },
        },
        {
          text: "갤러리",
          onPress: () => {
            setBusinessLicense("gallery_image.jpg");
          },
        },
      ]
    );
  };

  const toggleAgreement = (key: keyof typeof agreementsState) => {
    setAgreementsState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Step 1: 기본 정보
  const renderStep1Content = () => (
    <View>
      {makerStep1Fields.map((field) => (
        <InputGroup
          key={field.key}
          label={field.label}
          placeholder={field.placeholder}
          secureTextEntry={field.secureTextEntry}
          keyboardType={field.keyboardType}
          style={{
            height: btnHeight,
            paddingHorizontal: width * 0.04,
            marginBottom: height * 0.02,
          }}
        />
      ))}
    </View>
  );

  // Step 2: 사업자 등록증 업로드
  const renderStep2Content = () => (
    <View style={styles.step2Container}>
      <Text style={[styles.step2Description, { fontSize: width * 0.035 }]}>
        사업자 등록증 이미지를 업로드하시면{"\n"}빠른 심사 후 승인해드립니다
      </Text>

      <TouchableOpacity
        style={[
          styles.uploadArea,
          { height: height * 0.25, marginBottom: height * 0.03 },
        ]}
        onPress={handleBusinessLicenseUpload}
      >
        {businessLicense ? (
          <View style={styles.uploadSuccess}>
            <Text style={styles.uploadSuccessIcon}>✅</Text>
            <Text
              style={[styles.uploadSuccessText, { fontSize: width * 0.04 }]}
            >
              사업자 등록증 업로드 완료
            </Text>
            <Text style={[styles.uploadFileName, { fontSize: width * 0.03 }]}>
              {businessLicense}
            </Text>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={[styles.uploadText, { fontSize: width * 0.04 }]}>
              사업자 등록증을 업로드하세요
            </Text>
            <Text style={[styles.uploadSubtext, { fontSize: width * 0.03 }]}>
              JPG, PNG 파일만 업로드 가능합니다
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Step 3: 메뉴 정보 입력
  const renderStep3Content = () => (
    <View style={styles.step3Container}>
      <Text style={[styles.step2Description, { fontSize: width * 0.035 }]}>
        메뉴판 이미지를 업로드하시면{"\n"}메뉴를 인식해 자동으로 등록 가능합니다
      </Text>
      <TouchableOpacity
        style={[
          styles.scanButton,
          { height: height * 0.25, marginBottom: height * 0.03 },
        ]}
        onPress={handleMenuScan}
      >
        {selectedMenuImage ? (
          <View style={styles.scanResult}>
            <Text style={[styles.scanResultText, { fontSize: width * 0.04 }]}>
              📷 메뉴판 스캔 완료
            </Text>
            <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
              {menuItems.length}개 메뉴 감지됨
            </Text>
          </View>
        ) : (
          <View style={styles.scanPlaceholder}>
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={[styles.scanText, { fontSize: width * 0.04 }]}>
              메뉴판을 촬영하여 OCR 스캔
            </Text>
            <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
              메뉴 이름과 가격을 자동으로 인식합니다
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {menuItems.length > 0 && (
        <View style={styles.menuItemsContainer}>
          <Text style={[styles.menuItemsTitle, { fontSize: width * 0.04 }]}>
            인식된 메뉴 ({menuItems.length}개)
          </Text>
          {menuItems.map((item) => (
            <View key={item.id} style={styles.menuItem}>
              <View style={styles.menuItemHeader}>
                <Text
                  style={[styles.menuItemName, { fontSize: width * 0.035 }]}
                >
                  메뉴 {item.id}
                </Text>
                <TouchableOpacity onPress={() => removeMenuItem(item.id)}>
                  <Text style={styles.removeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <InputGroup
                label="메뉴명"
                value={item.name}
                onChangeText={(text) => updateMenuItem(item.id, "name", text)}
                style={styles.menuInput}
              />

              <InputGroup
                label="가격"
                value={item.price}
                onChangeText={(text) => updateMenuItem(item.id, "price", text)}
                keyboardType="numeric"
                style={styles.menuInput}
              />

              <InputGroup
                label="설명"
                value={item.description}
                onChangeText={(text) =>
                  updateMenuItem(item.id, "description", text)
                }
                placeholder="메뉴 설명을 입력해주세요"
                style={styles.menuInput}
                multiline
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Step 4: 동의 탭
  const renderStep4Content = () => {
    const agreementItems = [
      {
        key: "terms" as keyof typeof agreementsState,
        title:
          "고객의 리뷰 콘텐츠를 활용하여\n가게 서비스 및 제휴 매장을\n홍보하는 데 동의하십니까?",
        required: true,
      },
      {
        key: "marketing" as keyof typeof agreementsState,
        title:
          "고객의 리뷰를 참고하여\n해당 매장의 메뉴판을\n제작 · 활용하는 데 동의하십니까?",
        required: true,
      },
    ];

    return (
      <View style={styles.step4Container}>
        <View style={styles.agreementsContainer}>
          {agreementItems.map((agreement) => (
            <TouchableOpacity
              key={agreement.key}
              style={styles.agreementItem}
              onPress={() => toggleAgreement(agreement.key)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: agreementsState[agreement.key]
                      ? secondaryColor
                      : "#fff",
                    borderColor: agreementsState[agreement.key]
                      ? secondaryColor
                      : "#E5E5E5",
                  },
                ]}
              >
                {agreementsState[agreement.key] && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[styles.agreementText, { fontSize: width * 0.035 }]}>
                {agreement.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.characterImageContainer}></View>
      </View>
    );
  };

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1Content();
      case 2:
        return renderStep2Content();
      case 3:
        return renderStep3Content();
      case 4:
        return renderStep4Content();
      default:
        return null;
    }
  };

  // 버튼 렌더링 함수 - 명확하게 분리
  const renderBottomButtons = () => {
    if (currentStep === 1) {
      // 1단계: 다음 단계만
      return (
        <TouchableOpacity
          style={[
            styles.submitButton,
            styles.fullWidthButton,
            {
              backgroundColor: secondaryColor,
              height: btnHeight,
            },
          ]}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, { fontSize: width * 0.04 }]}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      );
    } else {
      // 2, 3, 4단계: 이전 단계 + 다음 단계/가입하기
      return (
        <>
          <TouchableOpacity
            style={[styles.prevButton, { height: btnHeight }]}
            onPress={handlePrevStep}
          >
            <Text style={[styles.prevButtonText, { fontSize: width * 0.04 }]}>
              이전 단계
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor: secondaryColor,
                height: btnHeight,
              },
            ]}
            onPress={handleSubmit}
          >
            <Text style={[styles.submitButtonText, { fontSize: width * 0.04 }]}>
              {getButtonText()}
            </Text>
          </TouchableOpacity>
        </>
      );
    }
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
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={[styles.backArrow, { fontSize: width * 0.06 }]}>
                ←
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.logo, { fontSize: width * 0.068 }]}>
              Create <Text style={{ color: secondaryColor }}>Maker</Text>
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Step Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            activeColor={secondaryColor}
          />

          {/* Title */}
          <Text
            style={[styles.title, { fontSize: width * 0.045, color: "#333" }]}
          >
            {getCurrentTitle()}
          </Text>

          {/* Content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {renderCurrentStepContent()}
          </ScrollView>

          {/* Bottom Buttons */}
          <View style={styles.bottomButtonsContainer}>
            {renderBottomButtons()}
          </View>

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

  title: {
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 20,
    paddingHorizontal: 20,
  },

  scrollView: { flex: 1 },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Step 2 스타일
  step2Container: {
    alignItems: "center",
  },
  step2Description: {
    color: COLORS.inactive,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
  },
  uploadArea: {
    width: "100%",
    borderWidth: 2,
    borderColor: COLORS.inactive + "50",
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  uploadPlaceholder: {
    alignItems: "center",
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  uploadText: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  uploadSubtext: {
    color: COLORS.inactive,
  },
  uploadSuccess: {
    alignItems: "center",
  },
  uploadSuccessIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  uploadSuccessText: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  uploadFileName: {
    color: COLORS.inactive,
  },

  // Step 3 스타일
  step3Container: {
    flex: 1,
  },
  scanButton: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.inactive + "50",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  scanPlaceholder: {
    alignItems: "center",
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  scanText: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  scanSubText: {
    color: COLORS.inactive,
    textAlign: "center",
  },
  scanResult: {
    alignItems: "center",
  },
  scanResultText: {
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 5,
  },
  menuItemsContainer: {
    marginBottom: 20,
  },
  menuItemsTitle: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  menuItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  menuItemName: {
    fontWeight: "600",
    color: COLORS.text,
  },
  removeButton: {
    color: COLORS.red,
    fontSize: 18,
    fontWeight: "bold",
  },
  menuInput: {
    marginBottom: 10,
  },

  // Step 4 스타일
  step4Container: {
    flex: 1,
  },
  agreementsContainer: {
    marginBottom: 30,
  },
  agreementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 10,
    marginTop: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 15,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  agreementText: {
    flex: 1,
    color: COLORS.text,
    lineHeight: 22,
  },
  characterImageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  characterPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.gray200,
    borderRadius: 12,
    width: "80%",
  },
  characterEmoji: {
    fontSize: 64,
    marginBottom: 10,
  },
  characterText: {
    color: COLORS.inactive,
    fontWeight: "500",
  },

  // Bottom Buttons - 수정된 부분
  bottomButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
    minHeight: 55, // 최소 높이 보장
  },
  prevButton: {
    backgroundColor: COLORS.gray300,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  prevButtonText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.secondaryMaker,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fullWidthButton: {
    flex: 1, // flex: undefined 대신 flex: 1 사용
    width: "100%",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
