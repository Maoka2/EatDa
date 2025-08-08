// src/screens/Register/steps/MakerStep1BasicInfo.tsx
import React from "react";
import { View, useWindowDimensions } from "react-native";
import InputGroup from "../../../components/InputGroup";

import {
  FormData,
  ValidationErrors,
  ValidationTypes,
  DuplicateCheckStates,
} from "../types";

type Props = {
  formData: FormData;
  validationErrors: ValidationErrors;
  validationTypes: ValidationTypes;
  duplicateCheckStates: DuplicateCheckStates;
  onChange: (key: keyof FormData, value: string) => void;
  onEmailDuplicateCheck: () => void;
  onFieldFocus: (index: number) => void;
  btnHeight: number;
};

const makerStep1Fields = [
  { key: "email", label: "이메일", placeholder: "이메일을 입력해주세요", keyboardType: "email-address" },
  { key: "password", label: "비밀번호", placeholder: "비밀번호를 입력해주세요", secureTextEntry: true },
  { key: "passwordConfirm", label: "비밀번호 확인", placeholder: "비밀번호를 다시 입력해주세요", secureTextEntry: true },
  { key: "storeName", label: "가게 이름", placeholder: "가게 이름을 입력해주세요" },
  { key: "storeLocation", label: "가게 주소", placeholder: "가게 주소를 입력해주세요" },
] as const;

export default function MakerStep1BasicInfo({
  formData,
  validationErrors,
  validationTypes,
  duplicateCheckStates,
  onChange,
  onEmailDuplicateCheck,
  onFieldFocus,
  btnHeight,
}: Props) {
  const { width, height } = useWindowDimensions();

  return (
    <View>
      {makerStep1Fields.map((f, index) => {
        // key를 분리해서 InputGroup에 전달하지 않음
        const { key: fieldKey, ...fieldProps } = f;
        const typedKey = fieldKey as keyof FormData;

        return (
          <View key={fieldKey}>
            <InputGroup
              {...fieldProps} // key 제외한 나머지만 전달
              value={formData[typedKey]}
              userRole="maker"
              onChangeText={(text: string) => onChange(typedKey, text)}
              style={{
                height: btnHeight,
                paddingHorizontal: width * 0.04,
              }}
              validation={validationErrors[typedKey] || ""}
              validationType={validationTypes[typedKey] || "none"}
              onFocus={() => setTimeout(() => onFieldFocus(index), 300)}
              {...(fieldKey === "email" && {
                showDuplicateCheck: true,
                duplicateCheckDisabled: duplicateCheckStates.email === "success",
                duplicateCheckLoading: duplicateCheckStates.email === "checking",
                onDuplicateCheck: onEmailDuplicateCheck,
              })}
            />
          </View>
        );
      })}
    </View>
  );
}
