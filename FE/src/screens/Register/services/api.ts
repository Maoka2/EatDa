// src/screens/Register/services/api.ts
import { MakerFormData, MenuItemType } from "../types";
import { DuplicateCheckResponse } from "../types";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

/* =========================
   서버 경로 설정
   ========================= */
const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test"; // 필요 없으면 "" 로!
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

/* =========================================================
   로컬 noImg 에셋 → 파일 URI로 변환
   ========================================================= */
const NOIMG: number = require("../../../../assets/noImg.jpg");

async function resolveAssetFileUri(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  try {
    await asset.downloadAsync(); // 로컬 캐시에 확보
  } catch {}
  return asset.localUri ?? asset.uri; // file:// 우선
}

function guessImageMime(uri: string) {
  const clean = uri.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return { type: "image/png", ext: "png" };
  if (clean.endsWith(".webp")) return { type: "image/webp", ext: "webp" };
  if (clean.endsWith(".gif")) return { type: "image/gif", ext: "gif" };
  if (clean.endsWith(".heic") || clean.endsWith(".heif"))
    return { type: "image/heic", ext: "heic" };
  if (clean.endsWith(".jpg") || clean.endsWith(".jpeg"))
    return { type: "image/jpeg", ext: "jpg" };
  // 기본값
  return { type: "image/jpeg", ext: "jpg" };
}

/* =========================================================
   이미지 파일 배열 생성 (메뉴 개수와 동일하게)
   ========================================================= */
async function buildImageFiles(
  menus: MenuItemType[]
): Promise<Array<{ uri: string; name: string; type: string }>> {
  const placeholder = await resolveAssetFileUri(NOIMG);

  // Promise.all 제거하고 동기적으로 처리하여 무한루프 방지
  const imageFiles: Array<{ uri: string; name: string; type: string }> = [];
  
  for (let i = 0; i < menus.length; i++) {
    const menu = menus[i];
    const chosenUri = menu.imageUri || placeholder;
    const { type, ext } = guessImageMime(chosenUri);
    
    imageFiles.push({
      uri: chosenUri,
      name: `menu_${i}.${ext}`,
      type,
    });
  }

  return imageFiles;
}

/* =========================================================
   1) 메뉴 OCR 요청 (FastAPI)
   - POST /ai/api/menu-extraction
   - 필드명: file
   - 성공: { code:"MENUBOARD_REQUESTED", assetId:number, ... }
   ========================================================= */
export const requestMenuOCR = async (
  imageUri: string
): Promise<{ assetId: number }> => {
  const fd = new FormData();
  fd.append("file", {
    uri: imageUri,
    name: "menu.jpg",
    type: "image/jpeg",
  } as any);

  const url = `${BASE_AI_URL}/menu-extraction`;
  console.log("[requestMenuOCR] POST", url);

  const res = await fetch(url, { method: "POST", body: fd });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[requestMenuOCR] status:", res.status, "payload:", text);
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

/* =========================================================
   2) 메뉴 OCR 결과 조회 (FastAPI 폴링)
   - GET /ai/api/menu-extraction/{assetId}/result
   - 코드: MENUBOARD_PENDING | MENUBOARD_SUCCESS | MENUBOARD_FAIL
   ========================================================= */
export const getOCRResult = async (
  assetId: number
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
  extractedMenus?: Array<{ name: string; price: number | null }>;
}> => {
  const url = `${BASE_AI_URL}/menu-extraction/${assetId}/result`;
  const res = await fetch(url);
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[getOCRResult] status:", res.status, "payload:", text);
    throw new Error("OCR 결과 조회 실패");
  }

  let result: any = {};
  try {
    result = JSON.parse(text || "{}");
  } catch {}

  if (result.code === "MENUBOARD_PENDING") {
    return { status: "PENDING" };
  }
  if (result.code === "MENUBOARD_SUCCESS") {
    return {
      status: "SUCCESS",
      extractedMenus:
        result.extractedMenus ?? result.data?.extractedMenus ?? [],
    };
  }
  if (result.code === "MENUBOARD_FAIL") {
    return { status: "FAILED" };
  }

  if (["PENDING", "SUCCESS", "FAILED"].includes(result?.status)) {
    return {
      status: result.status,
      extractedMenus: result.extractedMenus ?? result.data?.extractedMenus,
    };
  }

  return { status: "PENDING" };
};

/* =========================================================
   3) 사장님 회원가입 (원샷)
   - POST /api/makers
   - multipart/form-data
     · base: JSON (email, password, passwordConfirm, name, address, latitude, longitude)
     · license: file
     · menus: JSON (배열)
     · images: file[] ← 항상 menus.length 개를 전송
   ========================================================= */
type SignupAllInOneInput = {
  formData: MakerFormData;
  licenseUri: string | null;
  menus: MenuItemType[];
};

export const signupMakerAllInOne = async ({
  formData,
  licenseUri,
  menus,
}: SignupAllInOneInput): Promise<{ userId: number; storeId: number }> => {
  const fd = new FormData();

  // ✅ base: JSON을 임시 파일로 저장해서 보내기
  const basePayload = {
    email: formData.email,
    password: formData.password,
    passwordConfirm: formData.passwordConfirm,
    name: formData.storeName,
    address: formData.storeLocation,
    latitude: formData.latitude != null ? Number(formData.latitude) : undefined,
    longitude: formData.longitude != null ? Number(formData.longitude) : undefined,
  };

  // base JSON을 임시 파일로 저장
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const baseJsonPath = `${FileSystem.cacheDirectory}base_${timestamp}_${random}.json`;
  await FileSystem.writeAsStringAsync(baseJsonPath, JSON.stringify(basePayload));
  fd.append('base', {
    uri: baseJsonPath,
    name: 'base.json',
    type: 'application/json',
  } as any);
  console.log("basePayload:", JSON.stringify(basePayload));

  // license 파일 (선택)
  if (licenseUri) {
    fd.append("license", {
      uri: licenseUri,
      name: "business_license.jpg",
      type: "image/jpeg",
    } as any);
  }

  // menus: JSON을 임시 파일로 저장 (데이터 검증 추가)
  const menusPayload = menus.map((m, index) => {
    // 가격 처리 개선
    let price: number | null = null;
    if (m.price) {
      const numericPrice = parseInt(String(m.price).replace(/[^0-9]/g, ""), 10);
      price = isNaN(numericPrice) ? null : numericPrice;
    }
    
    return {
      name: m.name?.trim() || `메뉴 ${index + 1}`, // 이름 검증
      price,
      description: m.description?.trim() || null,
    };
  });

  let menusJsonPath: string | null = null;
  if (menusPayload.length > 0) {
    // 고유한 파일명 생성
    menusJsonPath = `${FileSystem.cacheDirectory}menus_${timestamp}_${random}.json`;
    
    await FileSystem.writeAsStringAsync(menusJsonPath, JSON.stringify(menusPayload));
    
    // 파일이 제대로 생성되었는지 확인
    const fileInfo = await FileSystem.getInfoAsync(menusJsonPath);
    console.log("Menus file info:", fileInfo);
    
    // Content-Type을 명시적으로 application/json으로 설정
    fd.append('menus', {
      uri: menusJsonPath,
      name: 'menus.json',
      type: 'application/json',
    } as any);
    console.log("menusPayload:", JSON.stringify(menusPayload));
    console.log("menusJsonPath:", menusJsonPath);
  }

  // ✅ images: 항상 menus.length 개 전송 (각 메뉴별로 이미지 여부 확인)
  const imageFiles = await buildImageFiles(menus);
  
  // 로깅으로 확인
  const customImages = menus.filter(m => m.imageUri).length;
  const defaultImages = menus.length - customImages;
  console.log(
    `[signupMakerAllInOne] Total images: ${imageFiles.length}, Custom: ${customImages}, Default: ${defaultImages}`
  );
  
  imageFiles.forEach((f, i) => {
    console.log(`Image ${i}: ${f.name} (${f.type})`);
    fd.append("images", f as any);
  });

  const url = `${BASE_API_URL}/makers`;
  console.log("[signupMakerAllInOne] POST", url);

  try {
    const response = await fetch(url, { 
      method: "POST", 
      body: fd,
    });
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
  } finally {
    // 임시 파일 정리
    try {
      await FileSystem.deleteAsync(baseJsonPath, { idempotent: true });
      if (menusJsonPath) {
        await FileSystem.deleteAsync(menusJsonPath, { idempotent: true });
      }
    } catch (e) {
      console.log("임시 파일 삭제 실패:", e);
    }
  }
};

/* =========================================================
   4) 이메일 중복 체크
   - POST /api/makers/check-email
   ========================================================= */
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