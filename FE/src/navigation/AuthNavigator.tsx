import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import screens
import LoginScreen from "../screens/Login/LoginScreen";
import EaterLoginScreen from "../screens/Login/EaterLoginScreen";
import MakerLoginScreen from "../screens/Login/MakerLoginScreen";

import EaterRegisterScreen from "../screens/Register/EaterRegisterScreen";
import MakerRegisterScreen from "../screens/Register/MakerRegisterScreen";
import RegisterScreen from "../screens/Register/RegisterScreen";
import RoleSelectionScreen from "../screens/Register/RoleSelectionScreen";

import ReviewTabScreen from "../screens/Review/ReviewTabScreen";

import ActiveEventScreen from "../screens/EventMaking/ActiveEventScreen";
import EventMakingScreen from "../screens/EventMaking/EventMakingScreen";

import StoreScreen from "../screens/Store/StoreScreen";

import MapScreen from "../screens/Store/Map/MapScreen";
import MenuCustomScreen from "../screens/Store/Menu/MenuCustomScreen";

import MypageScreen from "../screens/Mypage/MypageScreen";

// Review 관련
import ReviewWriteScreen from "../screens/Store/Review/ReviewWriteScreen";

export type AuthStackParamList = {
  Login: undefined;
  EaterLoginScreen: undefined;
  MakerLoginScreen: undefined;

  RegisterScreen: {
    role?: "eater" | "maker";
  };

  EaterRegisterScreen: undefined;
  MakerRegisterScreen: undefined;
  RoleSelectionScreen: undefined;

  // 메인 앱 화면들
  ReviewTabScreen: undefined;
  ActiveEventScreen: undefined;
  EventMakingScreen: undefined;

  MapScreen: undefined;

  StoreScreen: undefined;
  StoreEventScreen: undefined;
  StoreMenuScreen: undefined;
  StoreReviewScreen: undefined;
  DetailEventScreen: undefined;

  MenuCustomScreen: undefined;

  MypageScreen: undefined;

  CompleteModal: undefined;
  GenerateStep: undefined;
  MenuSelectStep: undefined;
  OCRStep: undefined;
  ReviewWriteScreen: undefined;
  WriteStep: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* 로그인 관련 */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EaterLoginScreen" component={EaterLoginScreen} />
      <Stack.Screen name="MakerLoginScreen" component={MakerLoginScreen} />

      {/* 회원가입 관련 */}
      <Stack.Screen
        name="RoleSelectionScreen"
        component={RoleSelectionScreen}
      />
      <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
      <Stack.Screen
        name="EaterRegisterScreen"
        component={EaterRegisterScreen}
      />
      <Stack.Screen
        name="MakerRegisterScreen"
        component={MakerRegisterScreen}
      />

      {/* 메인 앱 화면들 */}
      <Stack.Screen name="ReviewTabScreen" component={ReviewTabScreen} />
      <Stack.Screen name="ActiveEventScreen" component={ActiveEventScreen} />
      <Stack.Screen name="EventMakingScreen" component={EventMakingScreen} />

      <Stack.Screen name="MapScreen" component={MapScreen} />

      {/* 마이페이지 관련 */}
      <Stack.Screen name="MypageScreen" component={MypageScreen} />

      {/* 스토어 관련 */}
      <Stack.Screen name="StoreScreen" component={StoreScreen} />

      {/* 메뉴 관련 */}
      <Stack.Screen name="MenuCustomScreen" component={MenuCustomScreen} />

      {/* 리뷰 작성 관련 */}
      <Stack.Screen name="ReviewWriteScreen" component={ReviewWriteScreen} />
    </Stack.Navigator>
  );
}
