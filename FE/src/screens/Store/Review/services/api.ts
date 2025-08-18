// src/screens/Review/services/api.ts

/* =========================
   서버 경로 설정
   ========================= */
const BASE_HOST = "https://i13a609.p.ssafy.io";
const BASE_PREFIX = "/test";
const BASE_API_URL = `${BASE_HOST}${BASE_PREFIX}/api`;
const BASE_AI_URL = `${BASE_HOST}/ai/api`;

/* =========================
   타입 정의 (API 명세서에 맞춤)
   ========================= */
type AssetType = "IMAGE" | "SHORTS_RAY_2" | "SHORTS_GEN_4";

interface ReviewAssetRequest {
  storeId: number;
  menuIds: number[];
  type: AssetType;
  prompt: string;
  images: string[];
}

interface ReviewAssetResponse {
  reviewId: number;
  reviewAssetId: number;
}

interface MenuData {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  price?: number;
}

/* =========================================================
   0) 가게 메뉴 조회 API
   ========================================================= */
export const getStoreMenus = async (
  storeId: number,
  accessToken: string
): Promise<MenuData[]> => {
  const url = `${BASE_API_URL}/menu/${storeId}`;
  console.log("[getStoreMenus] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[getStoreMenus] status:", res.status, "payload:", text);
    throw new Error(text || "메뉴 조회 실패");
  }

  let json: any = {};
  try {
    json = JSON.parse(text || "{}");
  } catch {
    throw new Error("잘못된 응답 형식입니다.");
  }

  const menus = json.data?.menus || json.menus || json.data || [];

  return menus.map((menu: any) => ({
    id: menu.id,
    name: menu.name,
    description: menu.description || "",
    imageUrl: menu.imageUrl,
    price: menu.price,
  }));
};

/* =========================================================
   1) 영수증 OCR 요청 (FastAPI)
   ========================================================= */
export const requestReceiptOCR = async (
  imageUri: string
): Promise<{ assetId: number }> => {
  const fd = new FormData();
  fd.append("file", {
    uri: imageUri,
    name: "receipt.jpg",
    type: "image/jpeg",
  } as any);

  const url = `${BASE_AI_URL}/reviews/ocr-verification`;
  console.log("[requestReceiptOCR] POST", url);

  const res = await fetch(url, { method: "POST", body: fd });
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[requestReceiptOCR] status:", res.status, "payload:", text);
    throw new Error(text || "영수증 OCR 요청 실패");
  }

  let json: any = {};
  try {
    json = JSON.parse(text || "{}");
  } catch {
    throw new Error("잘못된 응답 형식입니다.");
  }

  const assetId =
    typeof json.assetId === "number"
      ? json.assetId
      : typeof json?.data?.assetId === "number"
      ? json.data.assetId
      : null;

  if (typeof assetId !== "number") {
    console.log("[requestReceiptOCR] unexpected response:", json);
    throw new Error("잘못된 영수증 OCR 응답 형식입니다.(assetId 누락)");
  }

  return { assetId };
};

/* =========================================================
   2) 영수증 OCR 결과 조회 (FastAPI 폴링)
   ========================================================= */
export const getReceiptOCRResult = async (
  assetId: number
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
}> => {
  const url = `${BASE_AI_URL}/reviews/ocr-verification/${assetId}/result`;
  const res = await fetch(url);
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[getReceiptOCRResult] status:", res.status, "payload:", text);
    throw new Error("영수증 OCR 결과 조회 실패");
  }

  let result: any = {};
  try {
    result = JSON.parse(text || "{}");
  } catch {
    throw new Error("잘못된 응답 형식입니다.");
  }

  if (result.code === "RECEIPT_PENDING") {
    return { status: "PENDING" };
  }
  if (result.code === "RECEIPT_SUCCESS") {
    return { status: "SUCCESS" };
  }
  if (result.code === "RECEIPT_FAILED") {
    return { status: "FAILED" };
  }

  if (["PENDING", "SUCCESS", "FAIL"].includes(result?.result)) {
    return {
      status: result.result === "FAIL" ? "FAILED" : result.result,
    };
  }

  return { status: "PENDING" };
};

/* =========================================================
   3) AI 리뷰 에셋 생성 요청 (Spring Backend) - URL 수정
   ========================================================= */
export const requestReviewAsset = async (
  request: ReviewAssetRequest,
  accessToken: string
): Promise<ReviewAssetResponse> => {
  const fd = new FormData();

  // 기본 파라미터들
  fd.append("storeId", request.storeId.toString());
  fd.append("type", request.type);
  fd.append("prompt", request.prompt);

  // menuIds 배열 처리 - 각각 개별적으로 추가
  request.menuIds.forEach((menuId) => {
    fd.append("menuIds", menuId.toString());
  });

  // 이미지 파일들 추가 - 각각 "image" 필드명으로 추가
  request.images.forEach((imageUri, index) => {
    fd.append("image", {
      uri: imageUri,
      name: `reference_${index}.jpg`,
      type: "image/jpeg",
    } as any);
  });

  // ⭐ URL 수정: /request 제거
  const url = `${BASE_API_URL}/reviews/assets`;
  console.log("[requestReviewAsset] POST", url);
  console.log("[requestReviewAsset] Request data:", {
    storeId: request.storeId,
    type: request.type,
    prompt: request.prompt,
    menuIds: request.menuIds,
    imagesCount: request.images.length,
  });

  // 요청 전에 모든 필드가 올바른지 검증
  if (!request.storeId || request.storeId <= 0) {
    throw new Error("유효하지 않은 가게 ID입니다.");
  }

  if (!request.menuIds || request.menuIds.length === 0) {
    throw new Error("최소 하나의 메뉴를 선택해주세요.");
  }

  if (
    !request.type ||
    !["IMAGE", "SHORTS_RAY_2", "SHORTS_GEN_4"].includes(request.type)
  ) {
    throw new Error("유효하지 않은 생성 타입입니다.");
  }

  if (!request.prompt || request.prompt.trim().length === 0) {
    throw new Error("프롬프트를 입력해주세요.");
  }

  if (!request.images || request.images.length === 0) {
    throw new Error("최소 하나의 참고 이미지를 업로드해주세요.");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // multipart/form-data는 자동으로 설정됨
      },
      body: fd,
    });

    const text = await res.text().catch(() => "");

    console.log("[requestReviewAsset] Response status:", res.status);
    console.log("[requestReviewAsset] Response body:", text);

    if (!res.ok) {
      console.log("[requestReviewAsset] 요청 실패:", {
        status: res.status,
        statusText: res.statusText,
        payload: text,
      });

      // 에러 메시지 파싱 시도
      try {
        const errorJson = JSON.parse(text);
        const errorMessage = errorJson.message || errorJson.details || text;
        throw new Error(errorMessage);
      } catch (parseError) {
        // JSON 파싱 실패 시 원본 텍스트 사용
        throw new Error(
          text || `서버 오류 (${res.status}): 리뷰 에셋 생성 요청 실패`
        );
      }
    }

    let json: any = {};
    try {
      json = JSON.parse(text || "{}");
    } catch (parseError) {
      console.error("[requestReviewAsset] JSON 파싱 실패:", parseError);
      throw new Error("서버 응답 형식이 올바르지 않습니다.");
    }

    console.log("[requestReviewAsset] Parsed response:", json);

    // API 명세서에 따른 응답 구조 확인
    const data = json.data;
    if (
      !data ||
      typeof data.reviewId !== "number" ||
      typeof data.reviewAssetId !== "number"
    ) {
      console.log("[requestReviewAsset] 예상치 못한 응답 구조:", json);
      throw new Error("서버 응답 데이터가 올바르지 않습니다.");
    }

    return {
      reviewId: data.reviewId,
      reviewAssetId: data.reviewAssetId,
    };
  } catch (error: any) {
    console.error("[requestReviewAsset] 요청 중 오류 발생:", error);

    // 네트워크 오류와 서버 오류 구분
    if (error.name === "TypeError" && error.message.includes("Network")) {
      throw new Error("네트워크 연결을 확인해주세요.");
    }

    // 이미 처리된 오류 메시지는 그대로 전달
    throw error;
  }
};

/* =========================================================
   4) OCR 폴링 유틸리티 함수
   ========================================================= */
export const pollReceiptOCR = async (
  assetId: number,
  onProgress?: (attempt: number) => void
): Promise<"SUCCESS" | "FAILED"> => {
  let attempts = 0;
  const maxAttempts = 30; // 최대 30번 (30초)

  while (attempts < maxAttempts) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
      attempts++;

      if (onProgress) {
        onProgress(attempts);
      }

      const result = await getReceiptOCRResult(assetId);

      if (result.status === "SUCCESS") {
        return "SUCCESS";
      } else if (result.status === "FAILED") {
        return "FAILED";
      }
      // PENDING인 경우 계속 반복
    } catch (error) {
      console.error("OCR polling error:", error);
      // 에러가 나도 계속 시도
    }
  }

  // 타임아웃
  throw new Error("영수증 처리 시간이 초과되었습니다");
};

/* =========================================================
   5) 리뷰 에셋 결과 조회 (Spring Backend 폴링) - 에러 처리 개선
   ========================================================= */
export const getReviewAssetResult = async (
  reviewAssetId: number,
  accessToken: string
): Promise<{
  status: "PENDING" | "SUCCESS" | "FAILED";
  type?: string;
  imageUrl?: string;
  shortsUrl?: string;
}> => {
  const url = `${BASE_API_URL}/reviews/assets/${reviewAssetId}/result`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const text = await res.text().catch(() => "");

    // ⭐ 400, 404 에러는 정상적인 PENDING 상태로 처리 (에러 로그 안 찍음)
    if (res.status === 400 || res.status === 404) {
      return { status: "PENDING" };
    }

    if (!res.ok) {
      // ⭐ 500 이상의 심각한 에러만 실제 에러로 처리
      if (res.status >= 500) {
        console.error(
          "[getReviewAssetResult] 서버 내부 오류:",
          res.status,
          text
        );
        throw new Error("서버 내부 오류가 발생했습니다.");
      }

      // 그 외는 조용히 PENDING으로 처리
      return { status: "PENDING" };
    }

    let result: any = {};
    try {
      result = JSON.parse(text || "{}");
    } catch {
      // JSON 파싱 실패도 PENDING으로 처리
      return { status: "PENDING" };
    }

    // API 명세서에 따른 응답 코드 확인
    if (result.code === "REVIEW_ASSET_GENERATION_SUCCESS") {
      console.log("[getReviewAssetResult] ✅ 생성 완료:", result.data);
      return {
        status: "SUCCESS",
        type: result.data?.type,
        imageUrl: result.data?.imageUrl,
        shortsUrl: result.data?.shortsUrl,
      };
    }

    if (
      result.code === "RECEIPT_FAILED" ||
      result.code === "REVIEW_ASSET_GENERATION_FAILED"
    ) {
      console.log("[getReviewAssetResult] ❌ 생성 실패:", result.code);
      return { status: "FAILED" };
    }

    // 기본값은 PENDING
    return { status: "PENDING" };
  } catch (error: any) {
    // ⭐ 네트워크 오류도 조용히 PENDING으로 처리 (에러 로그 제거)
    return { status: "PENDING" };
  }
};

/* =========================================================
   6) 리뷰 최종 등록 (Spring Backend) - menuIds 추가
   ========================================================= */
interface ReviewFinalizeRequest {
  reviewId: number;
  reviewAssetId: number;
  description: string;
  type: string;
  menuIds: number[]; // ⭐ menuIds 추가
}

export const finalizeReview = async (
  request: ReviewFinalizeRequest,
  accessToken: string
): Promise<{ reviewId: number }> => {
  const url = `${BASE_API_URL}/reviews/finalize`;

  // ⭐ 더 자세한 요청 로깅
  console.log("[finalizeReview] POST", url);
  console.log("[finalizeReview] Request Headers:", {
    Authorization: `Bearer ${accessToken.substring(0, 20)}...`,
    "Content-Type": "application/json",
  });
  console.log(
    "[finalizeReview] Request Body:",
    JSON.stringify(request, null, 2)
  );

  // 요청 전 검증
  if (!request.reviewId || request.reviewId <= 0) {
    throw new Error("유효하지 않은 리뷰 ID입니다.");
  }

  if (!request.reviewAssetId || request.reviewAssetId <= 0) {
    throw new Error("유효하지 않은 리뷰 에셋 ID입니다.");
  }

  if (!request.description || request.description.trim().length < 30) {
    throw new Error("리뷰는 30자 이상 작성해주세요.");
  }

  if (
    !request.type ||
    !["IMAGE", "SHORTS_RAY_2", "SHORTS_GEN_4"].includes(request.type)
  ) {
    throw new Error("유효하지 않은 에셋 타입입니다.");
  }

  // ⭐ menuIds 검증 추가
  if (!request.menuIds || request.menuIds.length === 0) {
    throw new Error("최소 하나의 메뉴를 선택해주세요.");
  }

  if (!request.menuIds.every((id) => typeof id === "number" && id > 0)) {
    console.error("[finalizeReview] 잘못된 menuIds:", request.menuIds);
    throw new Error("유효하지 않은 메뉴 ID가 포함되어 있습니다.");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const text = await res.text().catch(() => "");

    // ⭐ 응답 상세 로깅
    console.log("[finalizeReview] Response Status:", res.status);
    console.log(
      "[finalizeReview] Response Headers:",
      Object.fromEntries(res.headers.entries())
    );
    console.log("[finalizeReview] Response Body:", text);

    if (!res.ok) {
      console.error("[finalizeReview] ❌ HTTP 오류 발생:", {
        status: res.status,
        statusText: res.statusText,
        url,
        requestBody: request,
        responseBody: text,
      });

      // ⭐ 500 에러 특별 처리
      if (res.status === 500) {
        console.error(
          "[finalizeReview] 🚨 서버 내부 오류 - 요청 데이터 검토 필요"
        );

        // 서버 에러 응답 파싱 시도
        try {
          const errorJson = JSON.parse(text);
          console.error("[finalizeReview] 서버 에러 상세:", errorJson);
          const errorMessage =
            errorJson.message ||
            errorJson.error ||
            "서버 내부 오류가 발생했습니다.";
          throw new Error(`서버 오류: ${errorMessage}`);
        } catch (parseError) {
          throw new Error(
            `서버 내부 오류가 발생했습니다. (Status: ${res.status})`
          );
        }
      }

      // 기타 에러 처리
      try {
        const errorJson = JSON.parse(text);
        const errorMessage =
          errorJson.message || errorJson.details?.description || text;
        throw new Error(errorMessage);
      } catch (parseError) {
        throw new Error(text || `서버 오류 (${res.status}): 리뷰 등록 실패`);
      }
    }

    let json: any = {};
    try {
      json = JSON.parse(text || "{}");
    } catch {
      throw new Error("서버 응답 형식이 올바르지 않습니다.");
    }

    console.log("[finalizeReview] ✅ 성공 응답:", json);

    const data = json.data;
    if (!data || typeof data.reviewId !== "number") {
      console.log("[finalizeReview] 예상치 못한 응답:", json);
      throw new Error("서버 응답 데이터가 올바르지 않습니다.");
    }

    return {
      reviewId: data.reviewId,
    };
  } catch (error: any) {
    console.error("[finalizeReview] 🔥 최종 에러:", {
      name: error.name,
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 3).join("\n"), // 스택 트레이스 일부만
    });

    if (error.name === "TypeError" && error.message.includes("Network")) {
      throw new Error("네트워크 연결을 확인해주세요.");
    }

    throw error;
  }
};

/* =========================================================
   7) 리뷰 에셋 폴링 유틸리티 함수 - 5초 간격으로 수정
   ========================================================= */
export const pollReviewAsset = async (
  reviewAssetId: number,
  accessToken: string,
  onProgress?: (attempt: number) => void
): Promise<{
  status: "SUCCESS" | "FAILED";
  type?: string;
  imageUrl?: string;
  shortsUrl?: string;
}> => {
  let attempts = 0;
  const maxAttempts = 60; // 최대 60번 (5분) - 5초씩 60번 = 300초
  const pollInterval = 5000; // ⭐ 5초 간격으로 변경

  console.log(
    `[pollReviewAsset] 폴링 시작 (reviewAssetId: ${reviewAssetId}) - ${
      pollInterval / 1000
    }초 간격`
  );

  while (attempts < maxAttempts) {
    try {
      // ⭐ 첫 번째 시도가 아닐 때만 대기
      if (attempts > 0) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval)); // 5초 대기
      }

      attempts++;

      if (onProgress) {
        onProgress(attempts);
      }

      // ⭐ 6회마다(30초마다) 진행상황 로그 출력
      if (attempts % 6 === 0) {
        console.log(
          `[pollReviewAsset] AI 생성 대기 중... ${attempts * 5}초 경과`
        );
      }

      const result = await getReviewAssetResult(reviewAssetId, accessToken);

      if (result.status === "SUCCESS") {
        console.log(
          `[pollReviewAsset] ✅ AI 생성 완료! (${attempts * 5}초 소요)`
        );
        console.log(`[pollReviewAsset] 결과:`, {
          type: result.type,
          imageUrl: result.imageUrl ? "있음" : "없음",
          shortsUrl: result.shortsUrl ? "있음" : "없음",
        });
        return {
          status: "SUCCESS",
          type: result.type,
          imageUrl: result.imageUrl,
          shortsUrl: result.shortsUrl,
        };
      } else if (result.status === "FAILED") {
        console.log(
          `[pollReviewAsset] ❌ AI 생성 실패 (${attempts * 5}초 소요)`
        );
        return { status: "FAILED" };
      }

      // PENDING인 경우 조용히 계속 진행
    } catch (error) {
      // ⭐ 에러 로그도 6회마다(30초마다)만 출력
      if (attempts % 6 === 0) {
        console.warn(
          `[pollReviewAsset] 폴링 중 오류 (${attempts * 5}초): 계속 시도 중...`
        );
      }
    }
  }

  // 타임아웃
  console.log(`[pollReviewAsset] ⏰ 폴링 타임아웃 (${maxAttempts * 5}초)`);
  throw new Error(
    "리뷰 생성 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요."
  );
};

// 해당 가게에 대한 리뷰 전체 조회
export interface StoreReviewItem {
  description: string;
  imageUrl?: string | null;
  shortsUrl?: string | null;
  thumbnailUrl?: string | null;
}

export const getStoreReviews = async (
  storeId: number,
  accessToken: string
): Promise<StoreReviewItem[]> => {
  if (!storeId || storeId <= 0) throw new Error("유효하지 않은 가게 ID입니다.");
  if (!accessToken) throw new Error("인증 토큰이 없습니다.");

  const url = `${BASE_API_URL}/reviews?storeId=${encodeURIComponent(
    String(storeId)
  )}`;
  console.log("[getStoreReviews] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // GET에서는 Content-Type 지정 불필요. Accept만 명시.
      Accept: "application/json",
    },
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    console.log("[getStoreReviews] status:", res.status, "payload:", text);
    throw new Error(text || "리뷰 조회 실패");
  }

  // content-type 확인 후 파싱
  const ct = res.headers.get("content-type") || "";
  let json: any = {};
  if (ct.includes("application/json")) {
    try {
      json = JSON.parse(text || "{}");
    } catch {
      throw new Error("잘못된 응답 형식입니다.");
    }
  } else {
    // 스웨거가 string으로 표시되는 경우 대비: 서버가 JSON을 문자열로 반환하면 에러 처리
    try {
      json = JSON.parse(text); // 혹시 문자열로 JSON이 올 때
    } catch {
      throw new Error("서버가 JSON이 아닌 응답을 반환했습니다.");
    }
  }

  // 명세: data가 배열(마이페이지/스토어 둘 다 커버)
  const arr = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.reviews)
    ? json.reviews
    : Array.isArray(json)
    ? json
    : [];

  return arr.map(
    (it: any): StoreReviewItem => ({
      description: String(it?.description ?? ""),
      imageUrl: it?.imageUrl ?? null,
      shortsUrl: it?.shortsUrl ?? null,
      thumbnailUrl: it?.thumbnailUrl ?? null,
    })
  );
};
