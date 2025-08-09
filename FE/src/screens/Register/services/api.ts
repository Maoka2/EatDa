// src/screens/Register/services/api.ts
import {
  MakerFormData,
  MenuItemType,
  ApiResponse,
  MakerSignupResponse,
} from "../types";

const BASE_URL = "https://i13a609.p.ssafy.io/test/api";

/**
 * [최종 제출용 1/3]
 * 사장님(메이커) 생성: multipart/form-data 한 번으로 기본정보 + (선택)사업자등록증 파일 전송
 * - RN FormData: JSON은 개별 필드로 append, 파일은 { uri, name, type }
 */
export const createMaker = async (
  formData: MakerFormData,
  businessLicenseUri: string | null
): Promise<MakerSignupResponse> => {
  const fd = new FormData();
  fd.append("email", formData.email);
  fd.append("password", formData.password);
  fd.append("passwordConfirm", formData.passwordConfirm);
  fd.append("name", formData.storeName);
  fd.append("address", formData.storeLocation);

  if (businessLicenseUri) {
    fd.append("license", {
      uri: businessLicenseUri,
      name: "business_license.jpg",
      type: "image/jpeg",
    } as any);
  }

  const res = await fetch(`${BASE_URL}/makers`, {
    method: "POST",
    body: fd, // Content-Type 자동 설정 (boundary 포함)
  });

  const text = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  console.log("[createMaker] status:", res.status);
  console.log("[createMaker] payload:", payload);

  if (!res.ok) {
    throw new Error(payload?.message || "사장님 생성 실패");
  }

  const result = payload as ApiResponse<MakerSignupResponse>;
  return result.data;
};

/**
 * [Step3 OCR] FastAPI 엔드포인트로 직접 업로드
 * - makerId 의존성 제거 (요청 스펙상 이미지 파일만 필요)
 * - 응답: { assetId: number } 가정
 */
export const requestMenuOCR = async (
  imageUri: string
): Promise<{ assetId: number }> => {
  const fd = new FormData();
  // 지원 확장자: jpg/jpeg/png/pdf/tiff(tif)
  // 여기서는 촬영/선택한 이미지를 image/jpeg로 업로드
  fd.append("image", {
    uri: imageUri,
    name: "menu.jpg",
    type: "image/jpeg",
  } as any);

  const res = await fetch(`${BASE_URL}/reviews/menu-extraction`, {
    method: "POST",
    body: fd,
  });

  const text = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    // FastAPI 에러문자열 등
    throw new Error(text || "OCR 요청 실패");
  }

  console.log("[requestMenuOCR] status:", res.status);
  console.log("[requestMenuOCR] payload:", payload);

  if (!res.ok) {
    throw new Error(payload?.message || "OCR 요청 실패");
  }

  // 예: { assetId: 92 }
  return { assetId: payload.assetId };
};

/**
 * [Step3 OCR 결과 폴링] Spring 프록시 조회
 * - 성공 시: { code: "MENU_EXTRACTION_SUCCESS", data: { storeId, extractedMenus } }
 * - 처리중: { code: "MENU_EXTRACTION_PENDING" }
 * - 실패:   { code: "MENU_EXTRACTION_FAILED" }
 */
export const getOCRResult = async (
  assetId: number
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
  storeId?: number;
  extractedMenus?: Array<{ name: string; price: number | null }>;
}> => {
  const res = await fetch(
    `${BASE_URL}/reviews/menu-extraction/${assetId}/result`
  );
  const text = await res.text().catch(() => "");
  let payload: ApiResponse<any> | null = null;
  try {
    payload = text ? (JSON.parse(text) as ApiResponse<any>) : null;
  } catch {
    throw new Error("OCR 결과 조회 실패(파싱)");
  }

  console.log("[getOCRResult] status:", res.status);
  console.log("[getOCRResult] payload:", payload);

  if (!res.ok || !payload) {
    throw new Error("OCR 결과 조회 실패");
  }

  if (payload.code === "MENU_EXTRACTION_SUCCESS") {
    return {
      status: "SUCCESS",
      storeId: payload.data?.storeId,
      extractedMenus: payload.data?.extractedMenus,
    };
  } else if (payload.code === "MENU_EXTRACTION_PENDING") {
    return { status: "PENDING" };
  } else {
    return { status: "FAILED" };
  }
};

/**
 * [최종 제출용 2/3]
 * 메뉴 + (선택)이미지 업로드
 * - 서버가 "이미지 수 = 메뉴 수"를 강제한다면, 빈 이미지 placeholder가 필요할 수 있음.
 * - 현재 구현: 이미지가 있을 때만 append (서버가 인덱스 매칭을 강제하지 않는다는 전제)
 *   만약 필요하면 placeholder(1x1 png 등)로 채우는 로직을 추가하세요.
 */
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

  menuItems.forEach((item, i) => {
    if (item.imageUri) {
      fd.append("images", {
        uri: item.imageUri,
        name: `menu_${i}.jpg`,
        type: "image/jpeg",
      } as any);
    }
  });

  const res = await fetch(`${BASE_URL}/owners/${makerId}/menus`, {
    method: "POST",
    body: fd,
  });

  const text = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  console.log("[submitMenus] status:", res.status);
  console.log("[submitMenus] payload:", payload);

  if (!res.ok) {
    throw new Error(payload?.message || "메뉴 등록 실패");
  }
};

/**
 * [최종 제출용 3/3]
 * 동의 완료
 */
export const completeSignup = async (
  makerId: number,
  storeId: number
): Promise<void> => {
  const res = await fetch(`${BASE_URL}/owners/${makerId}/agreement`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ storeId }),
  });

  const text = await res.text().catch(() => "");
  let payload: any = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  console.log("[completeSignup] status:", res.status);
  console.log("[completeSignup] payload:", payload);

  if (!res.ok) {
    throw new Error(payload?.message || "회원가입 완료 실패");
  }
};
