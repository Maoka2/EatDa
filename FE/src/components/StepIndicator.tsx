import React from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import { COLORS } from "../constants/theme";

type Props = { currentStep: number; totalSteps: number; activeColor?: string };

export default function StepIndicator({
  currentStep,
  totalSteps,
  activeColor = COLORS.primaryMaker,
}: Props) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.container, { marginVertical: width * 0.05 }]}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step <= currentStep;
        const isDone = step < currentStep;
        return (
          <React.Fragment key={step}>
            <View
              style={[
                styles.step,
                {
                  width: width * 0.1,
                  height: width * 0.1,
                  backgroundColor: isActive
                    ? activeColor
                    : COLORS.inactive + "30",
                  borderColor: isActive ? activeColor : "#ddd",
                },
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    fontSize: width * 0.04,
                    color: isActive ? "#fff" : COLORS.inactive,
                  },
                ]}
              >
                {isDone ? "✓" : step}
              </Text>
            </View>
            {step < totalSteps && (
              <View
                style={[
                  styles.connector,
                  {
                    width: width * 0.15,
                    backgroundColor:
                      step < currentStep ? activeColor : COLORS.inactive + "30",
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  step: {
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: { fontWeight: "600" },
  connector: { height: 3, borderRadius: 1.5 },
});
