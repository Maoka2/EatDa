// src/navigation/AuthNavigator.tsx
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

// 메뉴 관련
import MenuCustomScreen from "../screens/Store/Menu/MenuCustomScreen";
import GenerateStep from "../screens/Store/Menu/GenerateStep";
import MenuPosterWriteStep from "../screens/Store/Menu/WriteStep";

import MypageScreen from "../screens/Mypage/MypageScreen";

// Review 관련
import ReviewWriteScreen from "../screens/Store/Review/ReviewWriteScreen";

export type AuthStackParamList = {
  Login: undefined;
  EaterLoginScreen: undefined;
  MakerLoginScreen: undefined;

  RegisterScreen: { role?: "eater" | "maker" };
  EaterRegisterScreen: undefined;
  MakerRegisterScreen: undefined;
  RoleSelectionScreen: undefined;

  // 메인 앱 화면들
  ReviewTabScreen: undefined;
  ActiveEventScreen: undefined;
  EventMakingScreen: undefined;

  MapScreen: undefined;

  // ✅ StoreScreen은 storeId를 반드시 받는다
  StoreScreen: {
    storeId: number;
    storeName?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  StoreEventScreen: undefined;
  StoreMenuScreen: undefined;
  StoreReviewScreen: undefined;
  DetailEventScreen: undefined;

  MenuCustomScreen: {
    storeId: number;
    storeName?: string;
    address?: string;
  };

  MypageScreen: undefined;

  CompleteModal: undefined;
  GenerateStep: {
    storeId: number;
    selectedMenuIds: number[];
  };
  MenuSelectStep: undefined;
  OCRStep: undefined;
  ReviewWriteScreen: undefined;
  MenuPosterWriteStep: { menuPosterId: number, assetId: number, };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      {/* 로그인 관련 */}
      <Stack.Screen name="Login" component={LoginScreen}></Stack.Screen>
      <Stack.Screen
        name="EaterLoginScreen"
        component={EaterLoginScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="MakerLoginScreen"
        component={MakerLoginScreen}
      ></Stack.Screen>

      {/* 회원가입 관련 */}
      <Stack.Screen
        name="RoleSelectionScreen"
        component={RoleSelectionScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="RegisterScreen"
        component={RegisterScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="EaterRegisterScreen"
        component={EaterRegisterScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="MakerRegisterScreen"
        component={MakerRegisterScreen}
      ></Stack.Screen>

      {/* 메인 앱 화면들 */}
      <Stack.Screen
        name="ReviewTabScreen"
        component={ReviewTabScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="ActiveEventScreen"
        component={ActiveEventScreen}
      ></Stack.Screen>
      <Stack.Screen
        name="EventMakingScreen"
        component={EventMakingScreen}
      ></Stack.Screen>

      <Stack.Screen name="MapScreen" component={MapScreen}></Stack.Screen>

      {/* 마이페이지 관련 */}
      <Stack.Screen name="MypageScreen" component={MypageScreen}></Stack.Screen>

      {/* 스토어 관련 */}
      <Stack.Screen name="StoreScreen" component={StoreScreen}></Stack.Screen>

      {/* 메뉴 관련 */}
      <Stack.Screen
        name="MenuCustomScreen"
        component={MenuCustomScreen}
      ></Stack.Screen>
      <Stack.Screen name="GenerateStep" component={GenerateStep} />
      <Stack.Screen
        name="MenuPosterWriteStep"
        component={MenuPosterWriteStep}
      />

      {/* 리뷰 작성 관련 */}
      <Stack.Screen
        name="ReviewWriteScreen"
        component={ReviewWriteScreen}
      ></Stack.Screen>
    </Stack.Navigator>
  );
}
