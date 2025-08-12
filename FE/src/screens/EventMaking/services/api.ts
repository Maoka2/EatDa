import { getTokens } from "../../Login/services/tokenStorage";
import { normalizeImageForUpload } from "../../../utils/normalizeImage";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

const BASE_URL = "https://i13a609.p.ssafy.io/test";

// API에 보낼 데이터의 타입
export interface EventAssetRequestData {
  // storeId: number;
  title: string;
  startDate: string;
  endDate: string;
  prompt: string;
  type: string;
  images?: {
    uri: string;
    type: string;
    name: string;
  }[];
}

// ------------------------------
// 업로드한 파일 크기 로그 유틸
// ------------------------------
const fmtBytes = (bytes?: number | null) => {
  if (bytes == null) return "unknown";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
};

// FileSystem.getInfoAsync는 존재하지 않는 파일 케이스가 있어 size가 항상 보장되지 않음
async function statUri(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    const size = (info as any).size; // 런타임에 존재하는 경우가 많아 안전 캐스팅
    return typeof size === "number" ? size : null;
  } catch {
    return null;
  }
}

async function logImageSizes(
  tag: string,
  files: { uri: string; name?: string }[]
) {
  const sizes = await Promise.all(files.map((f) => statUri(f.uri)));
  let total = 0;
  console.log(`[#${tag}] images=${files.length}`);
  files.forEach((f, i) => {
    const sz = sizes[i];
    if (typeof sz === "number") total += sz;
    console.log(
      `[#${tag}] [${i}] name=${f.name ?? "(no-name)"} size=${fmtBytes(
        sz
      )} uri=${f.uri}`
    );
  });
  console.log(`[#${tag}] total=${fmtBytes(total)}\n`);
}

export type EventAssetResp = { eventAssetId: number; eventId: number };

// 기존 함수 시그니처 변경 + 응답 파싱 보강
export const requestEventAsset = async (
  data: EventAssetRequestData
): Promise<EventAssetResp> => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const fd = new FormData();
  fd.append("title", data.title);
  fd.append("type", "IMAGE");
  fd.append("startDate", data.startDate);
  fd.append("endDate", data.endDate);
  fd.append("prompt", data.prompt);

  if (data.images?.length) {
    await logImageSizes("RAW", data.images as any);
    const normed = await Promise.all(
      data.images.map((img, i) => normalizeImageForUpload(img, i))
    );
    await logImageSizes("NORMED", normed as any);
    normed.forEach((img) => {
      fd.append("image", {
        uri: img.uri,
        type: img.type,
        name: img.name,
      } as any);
    });
    await logImageSizes("FINAL", normed as any);
  }

  console.log("🚀 API 요청 전송 직전 데이터 확인");
  console.log(JSON.stringify((fd as any)._parts, null, 2));

  const res = await fetch(`${BASE_URL}/api/events/assets/request`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: fd,
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("EVENT ASSET ERROR", { status: res.status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${res.status}`
    );
  }

  // ← 여기서 유연하게 파싱 (data 안/밖 모두 대응)
  const dataObj = json?.data ?? json;
  const eventAssetId =
    typeof dataObj?.eventAssetId === "number"
      ? dataObj.eventAssetId
      : typeof dataObj?.id === "number"
      ? dataObj.id
      : NaN;

  const eventId =
    typeof dataObj?.eventId === "number"
      ? dataObj.eventId
      : typeof dataObj?.event?.id === "number"
      ? dataObj.event.id
      : NaN;

  if (!Number.isFinite(eventAssetId) || !Number.isFinite(eventId)) {
    console.warn("[requestEventAsset] unexpected response shape:", json);
    throw new Error("eventId / eventAssetId 파싱 실패");
  }

  return { eventAssetId, eventId };
};

// 이벤트 asset 결과 조회
export const getEventAssetResult = async (eventAssetId: number) => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const res = await fetch(
    `${BASE_URL}/api/events/assets/${eventAssetId}/result`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("GET ASSET RESULT ERROR", { status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${status}`
    );
  }

  return json;
};

// 이벤트 최종 등록
export interface FinalizeEventData {
  eventId: number;
  eventAssetId: number;
  description: string;
}

export const finalizeEvent = async (data: FinalizeEventData) => {
  // 토큰 받아오기
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다. 다시 로그인 해주세요.");
  }

  const body = {
    eventId: data.eventId,
    eventAssetId: data.eventAssetId,
    description: data.description,
    type: "IMAGE",
  };

  console.log("🚀 이벤트 최종 등록 요청 데이터:", body);

  const res = await fetch(`${BASE_URL}/api/events/finalize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}
  if (!res.ok) {
    console.error("FINALIZE EVENT ERROR", { status: res.status, raw, json });

    throw new Error(
      (json && (json.message || json.details)) || raw || `HTTP ${res.status}`
    );
  }

  console.log("✅ 이벤트 최종 등록 성공 응답:", json);
  return json;
};

// 이벤트 asset 다운로드
export const downloadEventAsset = async (eventAssetId: number) => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "권한 필요",
      "이미지를 앨범에 저장하려면 접근 권한이 필요합니다."
    );
    return;
  }


  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error("인증 정보가 없습니다.");
  }

  const fileName = `event-poster-${eventAssetId}.webp`;
  const fileUri = FileSystem.cacheDirectory + fileName;
  const downloadUrl = `${BASE_URL} /api/events/assets/download?eventAssetId=${eventAssetId}`;
  console.log(`🚀 이미지 다운로드 시작: ${downloadUrl}`);

  try{
    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      fileUri,
      {
        headers:{
          Authorization : `Bearer ${accessToken}`,
        },
      }
    );

    if(downloadResult.status !== 200){
      throw new Error("파일을 다운로드 하는데 실패하였습니다.")
    }

    console.log(`다운로드 완료, 임시 경로 : ${downloadResult.uri}`);

    const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
    await MediaLibrary.createAlbumAsync("EatDa",asset,false);
    Alert.alert("저장 완료", "이미지가 갤러리에 성공적으로 저장되었습니다.")
  } catch (error: any){
    console.error("이미지 저장 실패 : ", error);
    Alert.alert("오류", "이미지를 저장하는 중 오류가 발생했습니다.")
  }
};

// 사장님별 이벤트 조회
export const getMyEvents = async (lastEventId?: number) => {
  const { accessToken } = await getTokens();
  if (!accessToken)
    throw new Error("인증 정보가 없습니다. 다시 로그인해주세요");

  const url = lastEventId
    ? `${BASE_URL}/api/events/my?lastEventId=${lastEventId}`
    : `${BASE_URL}/api/events/my`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const status = res.status;
  const raw = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    console.error("GET MY EVENTS ERROR", { status, raw });
    throw new Error(
      (json && (json.message || json.error)) || raw || `HTTP ${status}`
    );
  }

  return json?.data;
};
