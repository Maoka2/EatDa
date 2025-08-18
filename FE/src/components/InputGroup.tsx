// src/components/InputGroup.tsx
import React from "react";
import { View, Text, StyleSheet, TextInputProps, TouchableOpacity } from "react-native";
import CustomInput from "./CustomInput";
import { COLORS } from "../constants/theme";
import { useResponsive } from "../utils/useResponsive";

interface Props extends TextInputProps {
  label: string;
  validation: string;
  validationType?: 'error' | 'success' | 'none';
  showDuplicateCheck?: boolean;
  duplicateCheckDisabled?: boolean;
  onDuplicateCheck?: () => void;
  duplicateCheckLoading?: boolean;
  userRole?: "eater" | "maker";
}

export default function InputGroup({ 
  label, 
  style, 
  validation, 
  validationType = 'none',
  showDuplicateCheck = false,
  duplicateCheckDisabled = false,
  onDuplicateCheck,
  duplicateCheckLoading = false,
  userRole,
  ...inputProps 
}: Props) {
  const { hp, wp } = useResponsive();
  const duplicateCheckColor = userRole === "eater" ? COLORS.secondaryEater : COLORS.secondaryMaker;
  return (
    <View style={{ marginBottom: hp(0.02) }}>
      {label ? (
        <Text
          style={[
            styles.label,
            { fontSize: wp(0.035), marginBottom: hp(0.015) },
          ]}
        >
          {label}
        </Text>
      ) : null}
      
      <View style={styles.inputContainer}>
        <View style={[styles.inputWrapper, showDuplicateCheck && styles.inputWithButton]}>
          <CustomInput 
            {...inputProps} 
            style={[
              style,
              showDuplicateCheck && { flex: 1 }
            ]} 
            validation={validation}
            validationType={validationType}
          />
        </View>
        
        {showDuplicateCheck && (
          <TouchableOpacity
            style={[
              styles.duplicateButton,
              {backgroundColor: duplicateCheckColor},
              duplicateCheckDisabled && styles.duplicateButtonDisabled
            ]}
            onPress={onDuplicateCheck}
            disabled={duplicateCheckDisabled || duplicateCheckLoading}
          >
            <Text style={[
              styles.duplicateButtonText,
              duplicateCheckDisabled && styles.duplicateButtonTextDisabled
            ]}>
              {duplicateCheckLoading ? '확인중...' : '중복확인'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { 
    color: COLORS.text, 
    fontWeight: "500" 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  inputWithButton: {
    flex: 1,
  },
  duplicateButton: {
    // backgroundColor: COLORS.secondaryEater,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
    height: 45, // CustomInput과 동일한 높이
  },
  duplicateButtonDisabled: {
    backgroundColor: '#ccc', // 성공 시 초록색
  },
  duplicateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  duplicateButtonTextDisabled: {
    color: 'white',
  },
});