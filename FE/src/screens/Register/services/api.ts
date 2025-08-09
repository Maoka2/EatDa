// src/screens/Register/services/api.ts
import {
  MakerFormData,
  MenuItemType,
  ApiResponse,
  MakerSignupResponse,
} from "../types";
import { DuplicateCheckResponse } from "../types";

/**
 * 서버 경로 설정
 * - 운영/개발에 따라 /test 프리픽스가 없을 수 있음
 *   => /ai 404가 나면 BASE_PREFIX를 ""로 변경하세요.
 */
const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test"; // 필요 없으면 "" 로!
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai`;

/** 1) 기본 정보 + (선택) 사업자등록증 업로드 */
export const createMaker = async (
  formData: MakerFormData,
  businessLicenseUri: string | null
): Promise<MakerSignupResponse> => {
  const fd = new FormData();

  // JSON은 문자열로 전송 (RN Blob 이슈 회피)
  const basicInfoData = {
    email: formData.email,
    password: formData.password,
    passwordConfirm: formData.passwordConfirm,
    name: formData.storeName,
    address: formData.storeLocation,
  };
  fd.append("basicInfo", JSON.stringify(basicInfoData));

  if (businessLicenseUri) {
    fd.append("license", {
      uri: businessLicenseUri,
      name: "business_license.jpg",
      type: "image/jpeg",
    } as any);
  }

  const url = `${BASE_API_URL}/makers`;
  console.log("[createMaker] POST", url);

  const response = await fetch(url, {
    method: "POST",
    body: fd, // Content-Type 수동 설정 금지
  });

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    let err: any;
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text };
    }
    console.log("[createMaker] status:", response.status, "payload:", text);
    throw new Error(err.message || "회원가입 실패");
  }

  const result: ApiResponse<MakerSignupResponse> = text
    ? JSON.parse(text)
    : ({} as any);
  return result.data;
};

// (원래 이름도 필요하면 아래 라인 주석 해제)
// export const submitBasicInfo = createMaker;

/** 2) 메뉴 OCR 요청 (FastAPI) — ⛳️ /ai 경로 사용, 로그인 불필요 */
export const requestMenuOCR = async (
  imageUri: string
): Promise<{ assetId: number }> => {
  const fd = new FormData();
  fd.append("image", {
    uri: imageUri,
    name: "menu.jpg",
    type: "image/jpeg",
  } as any);

  const url = `${BASE_AI_URL}/reviews/menu-extraction`;
  console.log("[requestMenuOCR] POST", url);

  const res = await fetch(url, { method: "POST", body: fd });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[requestMenuOCR] status:", res.status);
    console.log("[requestMenuOCR] payload:", text);
    throw new Error(text || "OCR 요청 실패");
  }

  let json: any = {};
  try {
    json = JSON.parse(text || "{}");
  } catch {
    json = {};
  }
  const assetId = json.assetId ?? json?.data?.assetId;
  if (typeof assetId !== "number") {
    throw new Error("잘못된 OCR 응답 형식입니다.");
  }
  return { assetId };
};

/** 3) 메뉴 OCR 결과 조회 (FastAPI) — ⛳️ /ai 경로 사용 */
export const getOCRResult = async (
  assetId: number
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
  extractedMenus?: Array<{ name: string; price: number | null }>;
  storeId?: number;
}> => {
  const url = `${BASE_AI_URL}/reviews/menu-extraction/${assetId}/result`;
  const res = await fetch(url);

  if (!res.ok) {
    const payload = await res.text().catch(() => "");
    console.log("[getOCRResult] status:", res.status, "payload:", payload);
    throw new Error("OCR 결과 조회 실패");
  }

  const result: ApiResponse | any = await res.json();

  // 스프링 포맷과 동일하게 맞춰져 있다면
  if (result.code === "MENU_EXTRACTION_SUCCESS") {
    return {
      status: "SUCCESS",
      extractedMenus: result.data?.extractedMenus ?? [],
      storeId: result.data?.storeId,
    };
  } else if (result.code === "MENU_EXTRACTION_PENDING") {
    return { status: "PENDING" };
  } else if (result.code === "MENU_EXTRACTION_FAILED") {
    return { status: "FAILED" };
  }

  // 단순 포맷 대비
  if (
    result.status === "SUCCESS" ||
    result.status === "PENDING" ||
    result.status === "FAILED"
  ) {
    return {
      status: result.status,
      extractedMenus: result.extractedMenus,
      storeId: result.storeId,
    };
  }

  return { status: "PENDING" };
};

/** 4) 메뉴 등록 (스프링) */
export const submitMenus = async (
  makerId: number,
  storeId: number,
  menuItems: MenuItemType[]
): Promise<void> => {
  const fd = new FormData();

  const menusData = menuItems.map((item) => ({
    name: item.name,
    price: parseInt(item.price.replace(/[^0-9]/g, ""), 10) || null,
    description: item.description || null,
  }));

  fd.append("storeId", String(storeId));
  fd.append("menus", JSON.stringify(menusData));

  // 이미지가 있을 때만 append
  menuItems.forEach((item, i) => {
    if (item.imageUri) {
      fd.append("images", {
        uri: item.imageUri,
        name: `menu_${i}.jpg`,
        type: "image/jpeg",
      } as any);
    }
  });

  const url = `${BASE_API_URL}/owners/${makerId}/menus`;
  console.log("[submitMenus] POST", url);

  const response = await fetch(url, { method: "POST", body: fd });
  const text = await response.text().catch(() => "");

  if (!response.ok) {
    let err: any;
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text };
    }
    console.log("[submitMenus] status:", response.status, "payload:", text);
    throw new Error(err.message || "메뉴 등록 실패");
  }
};

/** 5) 최종 동의 및 회원가입 완료 (스프링) */
export const completeSignup = async (
  makerId: number,
  storeId: number
): Promise<void> => {
  const url = `${BASE_API_URL}/owners/${makerId}/agreement`;
  console.log("[completeSignup] PATCH", url);

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let err: any;
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text };
    }
    console.log("[completeSignup] status:", response.status, "payload:", text);
    throw new Error(err.message || "회원가입 완료 실패");
  }
};

/** 6) 이메일 중복 체크 (스프링) — 필요 시 여기서도 제공 */
export const checkEmailDuplicateApi = async (
  email: string
): Promise<DuplicateCheckResponse> => {
  const url = `${BASE_API_URL}/makers/check-email`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const text = await res.text().catch(() => "");
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { message: text, status: res.status };
  }
  return json;
};
