import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import InputGroup from "../../../components/InputGroup";
import { COLORS } from "../../../constants/theme";

// 타입은 type-only import 권장
import type {
  MakerFormData,
  ValidationErrors,
  ValidationTypes,
  DuplicateCheckStates,
} from "../types";

type Props = {
  formData: MakerFormData;
  validationErrors: ValidationErrors;
  validationTypes: ValidationTypes;
  duplicateCheckStates: DuplicateCheckStates;
  onChange: (key: keyof MakerFormData, value: string) => void;
  onEmailDuplicateCheck: () => void;
  onAddressValidate: (address: string) => void;
  onFieldFocus: (index: number) => void;
  btnHeight: number;
};

const makerStep1Fields = [
  {
    key: "email",
    label: "이메일",
    placeholder: "이메일을 입력해주세요",
    keyboardType: "email-address",
  },
  {
    key: "password",
    label: "비밀번호",
    placeholder: "비밀번호를 입력해주세요 (8자 이상)",
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
    placeholder: "정확한 주소를 입력해주세요 (예: 서울 강남구 강남대로 123)",
  },
] as const;

export default function MakerStep1BasicInfo({
  formData,
  validationErrors,
  validationTypes,
  duplicateCheckStates,
  onChange,
  onEmailDuplicateCheck,
  onAddressValidate,
  onFieldFocus,
  btnHeight,
}: Props) {
  const { width } = useWindowDimensions();

  const handleTestEmailCheck = () => {
    console.log("🧪 테스트 이메일 중복 확인 버튼 클릭됨");
    onEmailDuplicateCheck();
  };

  const handleTestAddressCheck = () => {
    console.log("🧪 테스트 주소 확인 버튼 클릭됨");
    onAddressValidate(formData.storeLocation);
  };

  return (
    <View>
      {makerStep1Fields.map((f, index) => {
        const { key: fieldKey, ...fieldProps } = f;
        const typedKey = fieldKey as keyof MakerFormData;

        return (
          <View key={fieldKey}>
            <InputGroup
              {...fieldProps}
              value={String(formData[typedKey] ?? "")}
              userRole="maker"
              onChangeText={(text: string) => onChange(typedKey, text)}
              style={{ height: btnHeight, paddingHorizontal: width * 0.04 }}
              validation={validationErrors[typedKey] || ""}
              validationType={validationTypes[typedKey] || "none"}
              onFocus={() => setTimeout(() => onFieldFocus(index), 300)}
              {...(fieldKey === "email" && {
                showDuplicateCheck: true,
                duplicateCheckDisabled:
                  duplicateCheckStates.email === "success",
                duplicateCheckLoading:
                  duplicateCheckStates.email === "checking",
                onDuplicateCheck: handleTestEmailCheck,
              })}
              {...(fieldKey === "storeLocation" && {
                showDuplicateCheck: true,
                duplicateCheckDisabled:
                  validationTypes.coordinates === "success",
                duplicateCheckLoading:
                  validationTypes.coordinates === "loading",
                onDuplicateCheck: handleTestAddressCheck,
                duplicateCheckText: "주소 확인",
              })}
            />

            {fieldKey === "storeLocation" && formData.formattedAddress && (
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { fontSize: width * 0.03 }]}>
                  확인된 주소:
                </Text>
                <Text style={[styles.addressText, { fontSize: width * 0.03 }]}>
                  {formData.formattedAddress}
                </Text>
                <Text style={[styles.coordsText, { fontSize: width * 0.025 }]}>
                  위도: {formData.latitude?.toFixed(6)}, 경도:{" "}
                  {formData.longitude?.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  addressInfo: {
    marginTop: 8,
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondaryMaker,
  },
  addressLabel: { color: COLORS.inactive, marginBottom: 4, fontWeight: "500" },
  addressText: { color: COLORS.text, lineHeight: 18, marginBottom: 4 },
  coordsText: { color: COLORS.inactive, fontSize: 12 },
});
