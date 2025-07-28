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
  Modal,
  TextInput,
  Image,
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
  imageUri?: string;
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

  // 새로 추가된 state들
  const [isScanning, setIsScanning] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

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

  // 개선된 OCR 메뉴 스캔 함수
  const handleMenuScan = () => {
    setIsScanning(true);

    // 실제로는 카메라 열고 OCR API 호출
    setTimeout(() => {
      const sampleMenus: MenuItemType[] = [
        {
          id: "1",
          name: "김치찌개",
          price: "8000",
          description: "",
        },
        {
          id: "2",
          name: "된장찌개",
          price: "7000",
          description: "",
        },
        {
          id: "3",
          name: "불고기",
          price: "15000",
          description: "",
        },
        {
          id: "4",
          name: "계란찜",
          price: "6000",
          description: "",
        },
      ];
      setMenuItems(sampleMenus);
      setSelectedMenuImage("scanned_menu.jpg");
      setIsScanning(false);
      Alert.alert("스캔 완료", `${sampleMenus.length}개의 메뉴를 찾았습니다!`);
    }, 2000);
  };

  // 메뉴 편집 함수들
  const handleEditMenu = (menuId: string) => {
    setEditingMenuId(menuId);
    setEditModalVisible(true);
  };

  const handleSaveMenuEdit = () => {
    setEditModalVisible(false);
    setEditingMenuId(null);
  };

  const handleImagePick = (menuId: string) => {
    Alert.alert("이미지 선택", "메뉴 이미지를 어떻게 추가하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "카메라",
        onPress: () => {
          updateMenuItem(menuId, "imageUri", "camera_image.jpg");
        },
      },
      {
        text: "갤러리",
        onPress: () => {
          updateMenuItem(menuId, "imageUri", "gallery_image.jpg");
        },
      },
    ]);
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
    Alert.alert("메뉴 삭제", "이 메뉴를 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setMenuItems((prev) => prev.filter((item) => item.id !== id));
        },
      },
    ]);
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

  // Step 3: 개선된 메뉴 정보 입력
  const renderStep3Content = () => {
    const editingMenu = menuItems.find((item) => item.id === editingMenuId);

    return (
      <View style={styles.step3Container}>
        {/* OCR 스캔 영역 */}
        <Text style={[styles.step2Description, { fontSize: width * 0.035 }]}>
          메뉴판을 촬영하여 메뉴 정보를 자동으로 가져오세요
        </Text>

        <TouchableOpacity
          style={[
            styles.scanButton,
            {
              height: menuItems.length > 0 ? height * 0.15 : height * 0.25,
              marginBottom: height * 0.03,
              opacity: isScanning ? 0.7 : 1,
            },
          ]}
          onPress={handleMenuScan}
          disabled={isScanning}
        >
          {selectedMenuImage ? (
            <View style={styles.scanResult}>
              <Text style={[styles.scanResultText, { fontSize: width * 0.04 }]}>
                📷 메뉴판 스캔 완료
              </Text>
              <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
                {menuItems.length}개 메뉴 감지됨
              </Text>
              <TouchableOpacity
                style={styles.rescanButton}
                onPress={handleMenuScan}
              >
                <Text style={[styles.rescanText, { fontSize: width * 0.03 }]}>
                  다시 스캔하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanPlaceholder}>
              <Text style={styles.scanIcon}>{isScanning ? "📱" : "📷"}</Text>
              <Text style={[styles.scanText, { fontSize: width * 0.04 }]}>
                {isScanning
                  ? "메뉴판 스캔 중..."
                  : "메뉴판을 촬영하여 OCR 스캔"}
              </Text>
              <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
                {isScanning
                  ? "잠시만 기다려주세요"
                  : "메뉴 이름과 가격을 자동으로 인식합니다"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 메뉴 리스트 */}
        {menuItems.length > 0 && (
          <View style={styles.menuItemsContainer}>
            <View style={styles.menuHeaderRow}>
              <Text style={[styles.menuItemsTitle, { fontSize: width * 0.04 }]}>
                인식된 메뉴 ({menuItems.length}개)
              </Text>
              <Text style={[styles.menuHelpText, { fontSize: width * 0.03 }]}>
                각 메뉴를 터치하여 상세 정보를 입력하세요
              </Text>
            </View>

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemCard}
                onPress={() => handleEditMenu(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemContent}>
                  {/* 메뉴 이미지 */}
                  <View
                    style={[
                      styles.menuImageContainer,
                      {
                        width: width * 0.15,
                        height: width * 0.15,
                      },
                    ]}
                  >
                    {item.imageUri ? (
                      <View style={styles.menuImageWrapper}>
                        <Text style={styles.menuImagePlaceholder}>🍽️</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addImageButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleImagePick(item.id);
                        }}
                      >
                        <Text style={styles.addImageIcon}>📷</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* 메뉴 정보 */}
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuName, { fontSize: width * 0.04 }]}>
                      {item.name}
                    </Text>
                    <Text
                      style={[styles.menuPrice, { fontSize: width * 0.035 }]}
                    >
                      {Number(item.price).toLocaleString()}원
                    </Text>
                    <Text
                      style={[
                        styles.menuDescription,
                        { fontSize: width * 0.03 },
                      ]}
                    >
                      {item.description || "설명을 추가해주세요"}
                    </Text>
                  </View>

                  {/* 편집 버튼 */}
                  <TouchableOpacity
                    style={[
                      styles.editButton,
                      { backgroundColor: secondaryColor },
                    ]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditMenu(item.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.editButtonText,
                        { fontSize: width * 0.03 },
                      ]}
                    >
                      편집
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 완성도 표시 */}
                <View style={styles.completionIndicator}>
                  <View style={styles.completionDots}>
                    <View
                      style={[
                        styles.completionDot,
                        {
                          backgroundColor: item.name
                            ? secondaryColor
                            : "#E5E5E5",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.completionDot,
                        {
                          backgroundColor: item.price
                            ? secondaryColor
                            : "#E5E5E5",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.completionDot,
                        {
                          backgroundColor: item.description
                            ? secondaryColor
                            : "#E5E5E5",
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.completionDot,
                        {
                          backgroundColor: item.imageUri
                            ? secondaryColor
                            : "#E5E5E5",
                        },
                      ]}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 메뉴 편집 모달 */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={[styles.modalCancel, { fontSize: width * 0.04 }]}>
                  취소
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontSize: width * 0.045 }]}>
                메뉴 편집
              </Text>
              <TouchableOpacity onPress={handleSaveMenuEdit}>
                <Text
                  style={[
                    styles.modalSave,
                    { fontSize: width * 0.04, color: secondaryColor },
                  ]}
                >
                  완료
                </Text>
              </TouchableOpacity>
            </View>

            {editingMenu && (
              <ScrollView style={styles.modalContent}>
                {/* 이미지 섹션 */}
                <View style={styles.modalSection}>
                  <Text
                    style={[
                      styles.modalSectionTitle,
                      { fontSize: width * 0.04 },
                    ]}
                  >
                    메뉴 이미지
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleImagePick(editingMenu.id)}
                    style={[
                      styles.imagePickerButton,
                      {
                        width: width * 0.3,
                        height: width * 0.3,
                      },
                    ]}
                  >
                    {editingMenu.imageUri ? (
                      <Text
                        style={[
                          styles.imagePickerIcon,
                          { fontSize: width * 0.1 },
                        ]}
                      >
                        🍽️
                      </Text>
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.imagePickerIcon,
                            { fontSize: width * 0.1 },
                          ]}
                        >
                          📷
                        </Text>
                        <Text
                          style={[
                            styles.imagePickerText,
                            { fontSize: width * 0.032 },
                          ]}
                        >
                          이미지 추가
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* 메뉴명 */}
                <View style={styles.modalSection}>
                  <Text
                    style={[
                      styles.modalSectionTitle,
                      { fontSize: width * 0.04 },
                    ]}
                  >
                    메뉴명
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { fontSize: width * 0.04 }]}
                    value={editingMenu.name}
                    onChangeText={(text) =>
                      updateMenuItem(editingMenu.id, "name", text)
                    }
                    placeholder="메뉴명을 입력하세요"
                  />
                </View>

                {/* 가격 */}
                <View style={styles.modalSection}>
                  <Text
                    style={[
                      styles.modalSectionTitle,
                      { fontSize: width * 0.04 },
                    ]}
                  >
                    가격
                  </Text>
                  <TextInput
                    style={[styles.modalInput, { fontSize: width * 0.04 }]}
                    value={editingMenu.price}
                    onChangeText={(text) =>
                      updateMenuItem(editingMenu.id, "price", text)
                    }
                    placeholder="가격을 입력하세요"
                    keyboardType="numeric"
                  />
                </View>

                {/* 설명 */}
                <View style={styles.modalSection}>
                  <Text
                    style={[
                      styles.modalSectionTitle,
                      { fontSize: width * 0.04 },
                    ]}
                  >
                    메뉴 설명
                  </Text>
                  <TextInput
                    style={[
                      styles.modalDescriptionInput,
                      { fontSize: width * 0.035 },
                    ]}
                    value={editingMenu.description}
                    onChangeText={(text) =>
                      updateMenuItem(editingMenu.id, "description", text)
                    }
                    placeholder="메뉴에 대한 설명을 입력하세요&#10;예) 매콤하고 고소한 김치볶음밥입니다"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* 메뉴 삭제 버튼 */}
                <View style={styles.modalSection}>
                  <TouchableOpacity
                    style={styles.modalDeleteMenuButton}
                    onPress={() => {
                      removeMenuItem(editingMenu.id);
                      setEditModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalDeleteMenuText,
                        { fontSize: width * 0.04 },
                      ]}
                    >
                      메뉴 삭제
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </SafeAreaView>
        </Modal>
      </View>
    );
  };

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

  // Step 3 스타일 (개선됨)
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
  rescanButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "#ccc",
    borderColor: "#ccc",
  },
  rescanText: {
    color: "#fff",
    fontWeight: "500",
  },

  // 메뉴 리스트 스타일
  menuItemsContainer: {
    marginBottom: 20,
  },
  menuHeaderRow: {
    marginBottom: 15,
  },
  menuItemsTitle: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 5,
  },
  menuHelpText: {
    color: COLORS.inactive,
  },
  menuItemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  menuImageContainer: {
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuImageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  menuImagePlaceholder: {
    fontSize: 30,
  },
  addImageButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
  },
  addImageIcon: {
    fontSize: 20,
    color: COLORS.inactive,
  },
  menuInfo: {
    flex: 1,
  },
  menuName: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  menuPrice: {
    color: COLORS.secondaryMaker,
    fontWeight: "500",
    marginBottom: 4,
  },
  menuDescription: {
    color: COLORS.inactive,
    lineHeight: 16,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFF",
    fontWeight: "500",
  },
  completionIndicator: {
    alignItems: "center",
  },
  completionDots: {
    flexDirection: "row",
    gap: 4,
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalCancel: {
    color: "#999",
  },
  modalTitle: {
    fontWeight: "600",
    color: COLORS.text,
  },
  modalSave: {
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalSection: {
    marginTop: 20,
  },
  modalSectionTitle: {
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },
  imagePickerButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  imagePickerIcon: {
    marginBottom: 5,
  },
  imagePickerText: {
    color: "#999",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
  },
  modalDescriptionInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    minHeight: 80,
  },

  // 모달 내 삭제 버튼
  modalDeleteMenuButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FF4444",
    alignItems: "center",
    marginTop: 10,
  },
  modalDeleteMenuText: {
    color: "#FFF",
    fontWeight: "600",
  },

  // 기존 메뉴 아이템 스타일 (호환성 유지)
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
