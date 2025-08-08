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

export interface FormData {
  email: string;
  password: string;
  passwordConfirm: string;
  storeName: string;
  storeLocation: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  storeName?: string;
  storeLocation?: string;
}

export interface ValidationTypes {
  email?: "error" | "success" | "none";
  password?: "error" | "success" | "none";
  passwordConfirm?: "error" | "success" | "none";
}

export interface DuplicateCheckStates {
  email: "none" | "checking" | "success" | "duplicate";
}
