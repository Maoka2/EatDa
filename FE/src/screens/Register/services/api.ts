// src/screens/Register/services/api.ts
import {
  MakerFormData,
  MenuItemType,
} from "../types";
import { DuplicateCheckResponse } from "../types";

/* =========================
   서버 경로 설정
   ========================= */
const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test"; // 필요 없으면 "" 로!
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

/* =========================
   1) 메뉴 OCR 요청 (FastAPI)
   - POST /ai/api/menu-extraction
   - 필드명: imageUrl (URL 문자열 또는 파일)
   - 성공 응답: { code:"MENUBOARD_REQUESTED", status:200, assetId:number, ... }
   ========================= */
export const requestMenuOCR = async (
  imageUriOrUrl: string
): Promise<{ assetId: number }> => {
  const fd = new FormData();

  if (/^https?:\/\//.test(imageUriOrUrl)) {
    // URL로 전송
    fd.append("imageUrl", imageUriOrUrl);
  } else {
    // 로컬 파일로 전송 (RN)
    fd.append("imageUrl", {
      uri: imageUriOrUrl,
      name: "menu.jpg",
      type: "image/jpeg",
    } as any);
  }

  const url = `${BASE_AI_URL}/menu-extraction`;
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
  } catch {}

  const assetId =
    typeof json.assetId === "number"
      ? json.assetId
      : typeof json?.data?.assetId === "number"
      ? json.data.assetId
      : null;

  if (typeof assetId !== "number") {
    console.log("[requestMenuOCR] unexpected response:", json);
    throw new Error("잘못된 OCR 응답 형식입니다.(assetId 누락)");
  }

  return { assetId };
};

/* =========================
   2) 메뉴 OCR 결과 조회 (FastAPI 폴링)
   - 보통: GET /ai/api/menu-extraction/{assetId}/result
   - 백엔드 구현 차이를 대비해 2~3 패턴 순차 시도
   - 반환: { status: PENDING|SUCCESS|FAILED, extractedMenus?, storeId? }
   ========================= */
export const getOCRResult = async (
  assetId: number
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
  extractedMenus?: Array<{ name: string; price: number | null }>;
  storeId?: number;
}> => {
  const urls = [
    `${BASE_AI_URL}/menu-extraction/${assetId}/result`,
    `${BASE_AI_URL}/menu-extraction/result/${assetId}`,
    `${BASE_AI_URL}/menu-extraction/${assetId}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text().catch(() => "");

      if (!res.ok) {
        console.log("[getOCRResult]", url, "->", res.status, text);
        continue;
      }

      let result: any = {};
      try {
        result = JSON.parse(text || "{}");
      } catch {}

      // code 기반 성공/대기/실패
      if (result.code === "MENU_EXTRACTION_SUCCESS" || result.code === "MENUBOARD_EXTRACTION_SUCCESS") {
        return {
          status: "SUCCESS",
          extractedMenus: result.data?.extractedMenus ?? [],
          storeId: result.data?.storeId,
        };
      }
      if (result.code === "MENU_EXTRACTION_PENDING" || result.code === "MENUBOARD_EXTRACTION_PENDING") {
        return { status: "PENDING" };
      }
      if (result.code === "MENU_EXTRACTION_FAILED" || result.code === "MENUBOARD_EXTRACTION_FAILED") {
        return { status: "FAILED" };
      }

      // status 필드 기반
      if (["PENDING", "SUCCESS", "FAILED"].includes(result?.status)) {
        return {
          status: result.status,
          extractedMenus: result.extractedMenus ?? result.data?.extractedMenus,
          storeId: result.storeId ?? result.data?.storeId,
        };
      }

      // 알 수 없는 포맷이면 대기로 간주
      return { status: "PENDING" };
    } catch (e: any) {
      console.log("[getOCRResult] error for", url, e?.message || e);
    }
  }

  throw new Error("OCR 결과 조회 실패");
};

/* =========================
   3) 사장님 회원가입 (원샷)
   - POST /api/makers
   - multipart/form-data 로 기본정보 + license + menus(JSON) + images[] 한 번에 전송
   - 성공: { code:"MAKERS_SIGNUP", data:{ userId, storeId }, ... }
   ========================= */
export const signupMakerAllInOne = async (
  formData: MakerFormData,
  businessLicenseUri: string | null,
  menuItems: MenuItemType[]
): Promise<{ userId: number; storeId: number }> => {
  const fd = new FormData();

  // 기본 텍스트 필드
  fd.append("email", formData.email);
  fd.append("password", formData.password);
  fd.append("passwordConfirm", formData.passwordConfirm);
  fd.append("name", formData.storeName);
  fd.append("address", formData.storeLocation);

  if (formData.latitude != null) fd.append("latitude", String(formData.latitude));
  if (formData.longitude != null) fd.append("longitude", String(formData.longitude));

  // 사업자 등록증 (선택)
  if (businessLicenseUri) {
    fd.append("license", {
      uri: businessLicenseUri,
      name: "business_license.jpg",
      type: "image/jpeg",
    } as any);
  }

  // 메뉴 JSON (가격 문자열 → 정수 변환)
  const menusPayload = menuItems.map((m) => ({
    name: m.name,
    price: m.price ? parseInt(String(m.price).replace(/[^0-9]/g, ""), 10) || null : null,
    description: m.description || null,
  }));
  fd.append("menus", JSON.stringify(menusPayload));

  // 메뉴 이미지 (있을 때만 첨부)
  menuItems.forEach((m, i) => {
    if (m.imageUri) {
      fd.append("images", {
        uri: m.imageUri,
        name: `menu_${i}.jpg`,
        type: "image/jpeg",
      } as any);
    }
  });

  const url = `${BASE_API_URL}/makers`;
  console.log("[signupMakerAllInOne] POST", url);

  const response = await fetch(url, { method: "POST", body: fd });
  const text = await response.text().catch(() => "");

  if (!response.ok) {
    let err: any;
    try {
      err = JSON.parse(text);
    } catch {
      err = { message: text };
    }
    console.log("[signupMakerAllInOne] status:", response.status, "payload:", text);
    throw new Error(err.message || "회원가입 실패");
  }

  let json: any = {};
  try {
    json = JSON.parse(text || "{}");
  } catch {}

  const userId = json?.data?.userId ?? json?.userId;
  const storeId = json?.data?.storeId ?? json?.storeId;

  if (typeof userId !== "number" || typeof storeId !== "number") {
    console.log("[signupMakerAllInOne] unexpected response:", json);
    throw new Error("회원가입 응답 파싱 실패(userId/storeId 누락)");
  }

  return { userId, storeId };
};

/* =========================
   4) 이메일 중복 체크
   - POST /api/makers/check-email
   ========================= */
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
