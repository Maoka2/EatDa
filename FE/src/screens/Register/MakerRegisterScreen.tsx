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
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { API_KEYS } from "../../../config/apiKeys";

type Props = {
  onBack: () => void;
  onComplete: () => void;
};

type MenuItemType = {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUri?: string;
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

// OCR API 설정 - 실제 사용 시 환경변수나 설정 파일에서 관리
const GOOGLE_VISION_API_KEY = API_KEYS.GOOGLE_VISION; // 실제 API 키로 교체
const NAVER_CLOVA_API_KEY = ""; // 사용하지 않으므로 빈 문자열
const NAVER_CLOVA_SECRET = ""; // 사용하지 않으므로 빈 문자열

export default function MakerRegisterScreen({ onBack, onComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const totalSteps = 4;
  const secondaryColor = COLORS.secondaryMaker;
  const btnHeight = height * 0.055;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    storeName: "",
    storeLocation: "",
  });
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [businessLicenseUri, setBusinessLicenseUri] = useState<string | null>(
    null
  );
  const [agreementsState, setAgreementsState] = useState({
    terms: false,
    marketing: false,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "failure">("success");

  // Step titles & buttons
  const getCurrentTitle = () => {
    if (currentStep === 1) return "기본 정보 입력";
    if (currentStep === 2) return "사업자 등록증 첨부";
    if (currentStep === 3) return "메뉴 이미지 · 이름 · 설명 등록";
    if (currentStep === 4) return "고객 리뷰 활용 및 메뉴판 제작 동의";
    return "";
  };

  const getButtonText = () =>
    currentStep < totalSteps ? "다음 단계" : "가입하기";

  // Form validation
  const validateStep1 = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.passwordConfirm ||
      !formData.storeName ||
      !formData.storeLocation
    ) {
      Alert.alert("알림", "모든 필드를 입력해주세요.");
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    // if (!businessLicenseUri) {
    //   Alert.alert("알림", "사업자 등록증을 업로드해주세요.");
    //   return false;
    // }
    return true;
  };

  const validateStep3 = () => {
    // if (menuItems.length === 0) {
    //   Alert.alert("알림", "최소 1개 이상의 메뉴를 등록해주세요.");
    //   return false;
    // }
    return true;
  };

  // Navigation
  const handleSubmit = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
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
      const registrationData = {
        ...formData,
        businessLicenseUri,
        menuItems,
        agreements: agreementsState,
      };

      console.log("Registration data:", registrationData);
      setModalType("success");
      setModalVisible(true);
    } catch (error) {
      console.error("Registration error:", error);
      setModalType("failure");
      setModalVisible(true);
    }
  };

  const handleBack = () =>
    currentStep > 1 ? setCurrentStep((s) => s - 1) : onBack();
  const handlePrevStep = () => setCurrentStep((s) => s - 1);
  const handleModalClose = () => {
    setModalVisible(false);
    onComplete();
  };

  // Form data update
  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 사업자 등록증 업로드
  const handleBusinessLicenseUpload = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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
    } catch (error) {
      console.error("Business license upload error:", error);
      Alert.alert("오류", "사업자 등록증 업로드 중 오류가 발생했습니다.");
    }
  };

  // Google Vision API를 사용한 OCR
  const processWithGoogleVision = async (base64Image: string) => {
    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: "TEXT_DETECTION",
                    maxResults: 10,
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (
        result.responses &&
        result.responses[0] &&
        result.responses[0].textAnnotations
      ) {
        const detectedText = result.responses[0].textAnnotations[0].description;
        return parseMenuFromText(detectedText);
      } else {
        throw new Error("텍스트를 인식할 수 없습니다.");
      }
    } catch (error) {
      console.error("Google Vision API error:", error);
      throw error;
    }
  };

  // 네이버 클로바 OCR API 사용
  const processWithNaverClova = async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "menu.jpg",
      } as any);

      formData.append(
        "message",
        JSON.stringify({
          version: "V2",
          requestId: "menu-ocr-" + Date.now(),
          timestamp: Date.now(),
          images: [
            {
              format: "jpg",
              name: "menu",
            },
          ],
        })
      );

      const response = await fetch(
        "https://naveropenapi.apigw.ntruss.com/custom/v1/your-domain/your-api-version/general",
        {
          method: "POST",
          headers: {
            "X-OCR-SECRET": NAVER_CLOVA_SECRET,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.images && result.images[0] && result.images[0].fields) {
        const fields = result.images[0].fields;
        const detectedText = fields
          .map((field: any) => field.inferText)
          .join("\n");
        return parseMenuFromText(detectedText);
      } else {
        throw new Error("텍스트를 인식할 수 없습니다.");
      }
    } catch (error) {
      console.error("Naver Clova OCR error:", error);
      throw error;
    }
  };

  // 텍스트에서 메뉴 정보 파싱
  const parseMenuFromText = (text: string): MenuItemType[] => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0);
    const menuItems: MenuItemType[] = [];

    // 한국어 메뉴명과 가격 패턴 매칭
    const menuPattern = /(.+?)\s*(\d{1,3}(?:,\d{3})*원|\d+원)/g;
    const matches = text.match(menuPattern);

    if (matches) {
      matches.forEach((match, index) => {
        const parts = match.match(/(.+?)\s*(\d{1,3}(?:,\d{3})*원|\d+원)/);
        if (parts && parts[1] && parts[2]) {
          const menuName = parts[1].trim();
          const price = parts[2].trim();

          // 메뉴명이 너무 짧거나 의미없는 텍스트 제외
          if (menuName.length >= 2 && !menuName.match(/^[0-9\s]+$/)) {
            menuItems.push({
              id: Date.now().toString() + "_" + index,
              name: menuName,
              price: price,
              description: "",
              imageUri: undefined,
            });
          }
        }
      });
    }

    // 패턴 매칭이 실패한 경우, 라인별로 분석
    if (menuItems.length === 0) {
      for (let i = 0; i < lines.length - 1; i++) {
        const currentLine = lines[i].trim();
        const nextLine = lines[i + 1].trim();

        // 현재 라인이 메뉴명, 다음 라인이 가격인 경우
        if (
          currentLine.length >= 2 &&
          !currentLine.match(/^[0-9\s,원]+$/) &&
          nextLine.match(/^\d{1,3}(?:,\d{3})*원$|^\d+원$/)
        ) {
          menuItems.push({
            id: Date.now().toString() + "_" + i,
            name: currentLine,
            price: nextLine,
            description: "",
            imageUri: undefined,
          });
          i++; // 다음 라인은 건너뜀
        }
      }
    }

    return menuItems;
  };

  // OCR을 통한 메뉴 스캔
  const handleMenuScan = async () => {
    setIsScanning(true);

    try {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        mediaLibraryPermission.status !== "granted"
      ) {
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

            if (!result.canceled) {
              await processMenuImage(result.assets[0].uri);
            } else {
              setIsScanning(false);
            }
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

            if (!result.canceled) {
              await processMenuImage(result.assets[0].uri);
            } else {
              setIsScanning(false);
            }
          },
        },
        {
          text: "취소",
          style: "cancel",
          onPress: () => setIsScanning(false),
        },
      ]);
    } catch (error) {
      console.error("Menu scan error:", error);
      Alert.alert("오류", "메뉴 스캔 중 오류가 발생했습니다.");
      setIsScanning(false);
    }
  };

  // 메뉴 이미지 OCR 처리
  const processMenuImage = async (imageUri: string) => {
    try {
      // OCR API 선택 (우선순위: Google Vision > Naver Clova)
      let extractedMenuItems: MenuItemType[] = [];

      if (
        GOOGLE_VISION_API_KEY &&
        GOOGLE_VISION_API_KEY !== "YOUR_GOOGLE_VISION_API_KEY"
      ) {
        // Google Vision API 사용
        const base64Image = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        extractedMenuItems = await processWithGoogleVision(base64Image);
      } else if (
        NAVER_CLOVA_API_KEY &&
        NAVER_CLOVA_API_KEY !== "YOUR_NAVER_CLOVA_API_KEY"
      ) {
        // 네이버 클로바 OCR 사용
        extractedMenuItems = await processWithNaverClova(imageUri);
      } else {
        // API 키가 설정되지 않은 경우, 테스트용 더미 데이터
        console.warn(
          "OCR API 키가 설정되지 않았습니다. 테스트용 더미 데이터를 사용합니다."
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        extractedMenuItems = [
          {
            id: Date.now().toString() + "_1",
            name: "김치찌개",
            price: "8,000원",
            description: "",
            imageUri: undefined,
          },
          {
            id: Date.now().toString() + "_2",
            name: "제육볶음",
            price: "12,000원",
            description: "",
            imageUri: undefined,
          },
          {
            id: Date.now().toString() + "_3",
            name: "된장찌개",
            price: "7,000원",
            description: "",
            imageUri: undefined,
          },
        ];
      }

      if (extractedMenuItems.length === 0) {
        Alert.alert(
          "스캔 결과",
          "메뉴를 인식할 수 없습니다. 다시 시도해주세요."
        );
      } else {
        setMenuItems(extractedMenuItems);
        Alert.alert(
          "스캔 완료",
          `${extractedMenuItems.length}개의 메뉴를 인식했습니다.\n메뉴를 터치하여 이미지와 설명을 추가해주세요.`
        );
      }

      setIsScanning(false);
    } catch (error) {
      console.error("OCR Processing error:", error);
      Alert.alert(
        "오류",
        "OCR 처리 중 오류가 발생했습니다. 다시 시도해주세요."
      );
      setIsScanning(false);
    }
  };

  // 메뉴 편집
  const handleEditMenu = (id: string) => {
    setEditingMenuId(id);
    setEditModalVisible(true);
  };

  const handleSaveMenuEdit = () => {
    setEditingMenuId(null);
    setEditModalVisible(false);
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

  const removeMenuItem = (id: string) =>
    setMenuItems((prev) => prev.filter((i) => i.id !== id));

  // 메뉴 이미지 추가
  const handleAddMenuImage = async (menuId: string) => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
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

      if (!result.canceled) {
        updateMenuItem(menuId, "imageUri", result.assets[0].uri);
      }
    } catch (error) {
      console.error("Menu image add error:", error);
      Alert.alert("오류", "이미지 추가 중 오류가 발생했습니다.");
    }
  };

  // 동의 토글
  const toggleAgreement = (key: keyof typeof agreementsState) =>
    setAgreementsState((prev) => ({ ...prev, [key]: !prev[key] }));

  // Renderers
  const renderStep1 = () => (
    <View>
      {makerStep1Fields.map((f) => {
        const { key, ...fieldProps } = f;
        return (
          <InputGroup
            key={key}
            {...fieldProps}
            value={formData[key as keyof typeof formData]}
            onChangeText={(text: string) => updateFormData(key, text)}
            style={{
              height: btnHeight,
              paddingHorizontal: width * 0.04,
              marginBottom: height * 0.02,
            }}
          />
        );
      })}
    </View>
  );

  const renderStep2 = () => (
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
        {businessLicenseUri ? (
          <Image
            source={{ uri: businessLicenseUri }}
            style={styles.uploadedImage}
            resizeMode="contain"
          />
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

  const renderStep3 = () => (
    <View style={styles.step3Container}>
      <Text style={[styles.step2Description, { fontSize: width * 0.035 }]}>
        카메라로 메뉴판을 찍어{"\n"}간편하게 메뉴를 등록해보세요
      </Text>
      {/* OCR 스캔 영역 */}
      <TouchableOpacity
        style={[
          styles.scanButton,
          { height: height * 0.25, marginBottom: height * 0.03 },
        ]}
        onPress={handleMenuScan}
        disabled={isScanning}
      >
        {menuItems.length === 0 ? (
          <View style={styles.scanPlaceholder}>
            <Text style={styles.scanIcon}>{isScanning ? "⏳" : "📷"}</Text>
            <Text style={[styles.scanText, { fontSize: width * 0.04 }]}>
              {isScanning ? "메뉴판을 분석 중..." : "메뉴판을 촬영해주세요"}
            </Text>
            <Text style={[styles.scanSubText, { fontSize: width * 0.03 }]}>
              메뉴 이름과 가격을 자동으로 인식합니다
            </Text>
          </View>
        ) : (
          <View style={styles.scanResult}>
            <Text style={styles.scanIcon}>✅</Text>
            <Text style={[styles.scanResultText, { fontSize: width * 0.04 }]}>
              {menuItems.length}개 메뉴를 찾았습니다
            </Text>
            <TouchableOpacity
              style={[
                styles.rescanButton,
                { backgroundColor: COLORS.secondaryMaker },
              ]}
              onPress={handleMenuScan}
            >
              <Text style={[styles.rescanText, { fontSize: width * 0.03 }]}>
                다시 스캔하기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>

      {/* 메뉴 아이템 목록 */}
      {menuItems.length > 0 && (
        <View style={styles.menuItemsContainer}>
          <View style={styles.menuHeaderRow}>
            <Text style={[styles.menuItemsTitle, { fontSize: width * 0.04 }]}>
              인식된 메뉴 목록
            </Text>
            <Text style={[styles.menuHelpText, { fontSize: width * 0.03 }]}>
              메뉴를 터치하여 수정할 수 있습니다
            </Text>
          </View>

          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItemCard}
              onPress={() => handleEditMenu(item.id)}
            >
              <View style={styles.menuItemContent}>
                <View
                  style={[
                    styles.menuImageContainer,
                    { width: width * 0.15, height: width * 0.15 },
                  ]}
                >
                  {item.imageUri ? (
                    <Image
                      source={{ uri: item.imageUri }}
                      style={styles.menuImageWrapper}
                      resizeMode="cover"
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.addImageButton}
                      onPress={() => handleEditMenu(item.id)}
                    >
                      <Text style={styles.addImageIcon}>📷</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.menuInfo}>
                  <Text style={[styles.menuName, { fontSize: width * 0.04 }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.menuPrice, { fontSize: width * 0.035 }]}>
                    {item.price}
                  </Text>
                  {item.description && (
                    <Text
                      style={[
                        styles.menuDescription,
                        { fontSize: width * 0.03 },
                      ]}
                    >
                      {item.description}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.editButton,
                    { backgroundColor: COLORS.secondaryMaker },
                  ]}
                  onPress={() => handleEditMenu(item.id)}
                >
                  <Text
                    style={[styles.editButtonText, { fontSize: width * 0.03 }]}
                  >
                    수정
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}

          {/* 완료 표시 */}
          <View
            style={[styles.completionIndicator, { marginTop: height * 0.02 }]}
          >
            <View style={styles.completionDots}>
              {[...Array(3)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.completionDot,
                    {
                      backgroundColor:
                        i < 2 ? COLORS.secondaryMaker : COLORS.inactive,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 메뉴 편집 모달 */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={[styles.modalCancel, { fontSize: width * 0.04 }]}>
                취소
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontSize: width * 0.045 }]}>
              메뉴 수정
            </Text>
            <TouchableOpacity onPress={handleSaveMenuEdit}>
              <Text
                style={[
                  styles.modalSave,
                  { fontSize: width * 0.04, color: COLORS.secondaryMaker },
                ]}
              >
                저장
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {editingMenuId &&
              (() => {
                const menuItem = menuItems.find(
                  (item) => item.id === editingMenuId
                );
                if (!menuItem) return null;

                return (
                  <>
                    {/* 이미지 선택 */}
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
                        style={[
                          styles.imagePickerButton,
                          {
                            height: height * 0.15,
                            marginBottom: height * 0.02,
                          },
                        ]}
                        onPress={() => handleAddMenuImage(editingMenuId)}
                      >
                        {menuItem.imageUri ? (
                          <Image
                            source={{ uri: menuItem.imageUri }}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 10,
                            }}
                            resizeMode="cover"
                          />
                        ) : (
                          <>
                            <Text
                              style={[
                                styles.imagePickerIcon,
                                { fontSize: width * 0.08 },
                              ]}
                            >
                              📷
                            </Text>
                            <Text
                              style={[
                                styles.imagePickerText,
                                { fontSize: width * 0.035 },
                              ]}
                            >
                              이미지 추가
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* 메뉴 이름 */}
                    <View style={styles.modalSection}>
                      <Text
                        style={[
                          styles.modalSectionTitle,
                          { fontSize: width * 0.04 },
                        ]}
                      >
                        메뉴 이름
                      </Text>
                      <TextInput
                        style={[styles.modalInput, { fontSize: width * 0.04 }]}
                        value={menuItem.name}
                        onChangeText={(text) =>
                          updateMenuItem(editingMenuId, "name", text)
                        }
                        placeholder="메뉴 이름을 입력하세요"
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
                        value={menuItem.price}
                        onChangeText={(text) =>
                          updateMenuItem(editingMenuId, "price", text)
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
                          { fontSize: width * 0.04 },
                        ]}
                        value={menuItem.description}
                        onChangeText={(text) =>
                          updateMenuItem(editingMenuId, "description", text)
                        }
                        placeholder="메뉴 설명을 입력하세요"
                        multiline
                        textAlignVertical="top"
                      />
                    </View>

                    {/* 메뉴 삭제 버튼 */}
                    <TouchableOpacity
                      style={styles.modalDeleteMenuButton}
                      onPress={() => {
                        removeMenuItem(editingMenuId);
                        setEditModalVisible(false);
                        setEditingMenuId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.modalDeleteMenuText,
                          { fontSize: width * 0.04 },
                        ]}
                      >
                        이 메뉴 삭제하기
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.step4Container}>
      {/* 동의 항목들 */}
      <View style={styles.agreementsContainer}>
        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => toggleAgreement("terms")}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreementsState.terms
                  ? COLORS.secondaryMaker
                  : COLORS.inactive,
                backgroundColor: agreementsState.terms
                  ? COLORS.secondaryMaker
                  : "transparent",
              },
            ]}
          >
            {agreementsState.terms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.agreementText, { fontSize: width * 0.035 }]}>
            고객 리뷰를 활용한 메뉴판 제작에 동의합니다. {"\n"}
            고객들의 솔직한 리뷰를 통해 {"\n"} 더 매력적인 메뉴판을
            만들어드립니다.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.agreementItem}
          onPress={() => toggleAgreement("marketing")}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: agreementsState.marketing
                  ? COLORS.secondaryMaker
                  : COLORS.inactive,
                backgroundColor: agreementsState.marketing
                  ? COLORS.secondaryMaker
                  : "transparent",
              },
            ]}
          >
            {agreementsState.marketing && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text style={[styles.agreementText, { fontSize: width * 0.035 }]}>
            마케팅 정보 수신에 동의합니다. {"\n"}
            새로운 기능 업데이트와 이벤트 정보를 {"\n"} 받아보실 수 있습니다.
          </Text>
        </TouchableOpacity>
      </View>

      {/* 추가 안내 텍스트 */}
      <View style={{ alignItems: "center", marginTop: height * 0.02 }}>
        <Text
          style={[
            styles.step2Description,
            { fontSize: width * 0.03, textAlign: "center" },
          ]}
        >
          회원가입 완료 후 관리자 승인을 거쳐{"\n"}
          서비스를 이용하실 수 있습니다.
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  const renderButtons = () =>
    currentStep === 1 ? (
      <TouchableOpacity
        style={[
          styles.submitButton,
          styles.fullWidthButton,
          { backgroundColor: secondaryColor, height: btnHeight },
        ]}
        onPress={handleSubmit}
      >
        <Text style={[styles.submitButtonText, { fontSize: width * 0.04 }]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
    ) : (
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
            { backgroundColor: secondaryColor, height: btnHeight },
          ]}
          onPress={handleSubmit}
        >
          <Text style={[styles.submitButtonText, { fontSize: width * 0.04 }]}>
            {getButtonText()}
          </Text>
        </TouchableOpacity>
      </>
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
          <View style={[styles.header, { paddingTop: height * 0.048 }]}>
            <TouchableOpacity onPress={handleBack}>
              <Text style={[styles.backArrow, { fontSize: width * 0.06 }]}>
                ←
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.logo, { fontSize: width * 0.068 }]}>
              Create <Text style={{ color: secondaryColor }}>Maker</Text>
            </Text>
            <View style={styles.placeholder} />
          </View>
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            activeColor={secondaryColor}
          />
          <Text
            style={[styles.title, { fontSize: width * 0.045, color: "#333" }]}
          >
            {getCurrentTitle()}
          </Text>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
          >
            {renderContent()}
          </ScrollView>
          <View style={styles.bottomButtonsContainer}>{renderButtons()}</View>
          <ResultModal
            visible={modalVisible}
            type={modalType}
            message={
              modalType === "success"
                ? "회원가입이 완료되었습니다!"
                : "회원가입 중 오류가 발생했습니다."
            }
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
  scrollViewContent: { paddingHorizontal: 20, paddingBottom: 20 },
  step2Container: { alignItems: "center" },
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
  uploadSubtext: {
    color: COLORS.inactive,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  uploadPlaceholder: { alignItems: "center" },
  uploadIcon: { fontSize: 48, marginBottom: 10 },
  uploadText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  uploadSuccess: { alignItems: "center" },
  uploadSuccessIcon: { fontSize: 48, marginBottom: 10 },
  uploadSuccessText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  uploadFileName: { color: COLORS.inactive },
  step3Container: { flex: 1 },
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
  scanPlaceholder: { alignItems: "center" },
  scanIcon: { fontSize: 48, marginBottom: 10 },
  scanText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  scanSubText: { color: COLORS.inactive, textAlign: "center" },
  scanResult: { alignItems: "center" },
  scanResultText: { color: COLORS.text, fontWeight: "600", marginBottom: 5 },
  rescanButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rescanText: { color: "#FFF", fontWeight: "500" },
  menuItemsContainer: { marginBottom: 20 },
  menuHeaderRow: { marginBottom: 15 },
  menuItemsTitle: { fontWeight: "600", color: COLORS.text, marginBottom: 5 },
  menuHelpText: { color: COLORS.inactive },
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
  menuImageWrapper: { width: "100%", height: "100%", borderRadius: 8 },
  menuImagePlaceholder: { fontSize: 30 },
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
  addImageIcon: { fontSize: 20, color: COLORS.inactive },
  menuInfo: { flex: 1 },
  menuName: { fontWeight: "600", color: COLORS.text, marginBottom: 2 },
  menuPrice: {
    color: COLORS.secondaryMaker,
    fontWeight: "500",
    marginBottom: 4,
  },
  menuDescription: { color: COLORS.inactive, lineHeight: 16 },
  editButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  editButtonText: { color: "#FFF", fontWeight: "500" },
  completionIndicator: { alignItems: "center" },
  completionDots: { flexDirection: "row", gap: 4 },
  completionDot: { width: 6, height: 6, borderRadius: 3 },
  modalContainer: { flex: 1, backgroundColor: "#FFF" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalCancel: { color: "#999" },
  modalTitle: { fontWeight: "600", color: COLORS.text },
  modalSave: { fontWeight: "600" },
  modalContent: { flex: 1, paddingHorizontal: 20 },
  modalSection: { marginTop: 20 },
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
  imagePickerIcon: { marginBottom: 5 },
  imagePickerText: { color: "#999" },
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
  modalDeleteMenuButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#FF4444",
    alignItems: "center",
    marginTop: 10,
  },
  modalDeleteMenuText: { color: "#FFF", fontWeight: "600" },
  step4Container: { flex: 1 },
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
  characterImageContainer: { alignItems: "center", marginBottom: 30 },
  bottomButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
    minHeight: 55,
  },
  prevButton: {
    backgroundColor: COLORS.gray300,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  prevButtonText: { color: COLORS.text, fontWeight: "600" },
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
  fullWidthButton: { flex: 1, width: "100%" },
  submitButtonText: { color: "#fff", fontWeight: "600", textAlign: "center" },
});
