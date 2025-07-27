import { useWindowDimensions } from "react-native";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    wp: (percent: number) => width * percent,
    hp: (percent: number) => height * percent,
  };
}
