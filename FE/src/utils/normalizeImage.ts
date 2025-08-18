import * as FileSystem from "expo-file-system";

// 파일 이름으로 MIME 타입을 추측하는 함수
function guessMime(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "application/octet-stream"; // 알 수 없는 경우 기본값
}

// 이미지를 업로드 가능한 형태로 변환하고 검사하는 함수
export async function normalizeImageForUpload(
  img: { uri: string; type?: string; name?: string },
  idx: number
) {
  let uri = img.uri;

  // 안드로이드의 content:// 경로를 실제 파일 경로인 file:// 로 복사
  if (uri.startsWith("content://")) {
    const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}_${idx}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    uri = dest;
  }

  // 파일이 실제로 존재하고, 크기가 0이 아닌지 확인
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || (info.size ?? 0) === 0) {
    throw new Error(`업로드 파일이 없거나 비어있습니다: ${uri}`);
  }

  // 파일 이름과 타입을 최종적으로 결정
  const name = img.name || `image_${idx + 1}.jpg`;
  const type = img.type && img.type.includes("/") ? img.type : guessMime(name);

  return { uri, name, type };
}

const BASE_HOST = "https://i13a609.p.ssafy.io";

/**
 * 서버가 imageUrl을 절대 URL이 아닌 로컬 경로나 상대 경로로 줄 수 있어서
 * RN <Image>가 바로 그릴 수 있도록 정규화해준다.
 */
export function normalizePosterUrl(raw?: string | null): string {
  if (!raw) return "";
  const s = String(raw);

  // 이미 절대 URL이면 그대로 사용
  if (/^https?:\/\//i.test(s)) return s;

  // 서버 로컬 경로 → 웹 경로로 치환 (/home/ubuntu/... → https://host/...)
  const HOME_PREFIX = "/home/ubuntu";
  if (s.startsWith(HOME_PREFIX)) {
    return BASE_HOST + s.substring(HOME_PREFIX.length);
  }

  // 루트 상대 경로(/eatda/...) → 호스트 붙이기
  if (s.startsWith("/")) {
    return BASE_HOST + s;
  }

  // 알 수 없는 형식은 빈 값 반환(렌더 제외)
  return "";
}