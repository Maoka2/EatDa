// src/screens/Register/types.ts
export type MenuItemType = {
  id: string;
  name: string;
  price: string;
  description: string;
  imageUri?: string;
};

export interface DuplicateCheckResponse {
  code: string;
  message: string;
  status: number;
  data: boolean; // true면 중복
}

export interface MakerFormData {
  email: string;
  password: string;
  passwordConfirm: string;
  storeName: string;
  storeLocation: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  storeName?: string;
  storeLocation?: string;
  coordinates?: string; // 좌표 관련 에러
}

export interface ValidationTypes {
  email?: "error" | "success" | "none";
  password?: "error" | "success" | "none";
  passwordConfirm?: "error" | "success" | "none";
  storeName?: "error" | "success" | "none";
  storeLocation?: "error" | "success" | "none";
  coordinates?: "none" | "success" | "error" | "loading";
}

export interface DuplicateCheckStates {
  email: "none" | "checking" | "success" | "duplicate";
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface ApiResponse<T = any> {
  code: string;
  message: string;
  status: number;
  data: T;
  timestamp: string;
}

export interface MakerSignupResponse {
  id: number;
}

export interface ValidationErrorDetails {
  [key: string]: string;
}

export interface SignupState {
  makerId?: number;
  storeId?: number; // OCR 성공 시 내려오는 storeId
  assetId?: number;
  step1Complete: boolean;
  step2Complete: boolean;
  step3Complete: boolean;
  step4Complete: boolean;
}
