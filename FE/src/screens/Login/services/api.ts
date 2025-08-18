// src/screens/Login/services/api.ts
export type SignInRole = "EATER" | "MAKER";

export interface SignInRequest {
  email: string;
  password: string;
  role: SignInRole;
}

export interface SignInSuccess {
  code: "SIGN_IN_SUCCESS";
  message: string;
  status: number; // 200
  data: {
    accessToken: string;
    refreshToken: string;
  };
  timestamp: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  status: number;
  details?: Record<string, string>;
  timestamp: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, string>;
  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

const BASE_URL = "https://i13a609.p.ssafy.io/test"; 

export async function signIn(body: SignInRequest): Promise<SignInSuccess> {
  const res = await fetch(`${BASE_URL}/api/auth/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // JSON 파싱 실패 시 그대로 처리
  }

  if (!res.ok) {
    // 에러 발생 시
    const payload: ApiErrorPayload = {
      code: json?.code || "UNKNOWN_ERROR",
      message:
        json?.message ||
        (res.status === 401
          ? "이메일 또는 비밀번호가 일치하지 않습니다."
          : "요청 처리 중 오류가 발생했습니다."),
      status: json?.status || res.status,
      details: json?.details,
      timestamp: json?.timestamp || new Date().toISOString(),
    };
    throw new ApiError(payload);
  }

  return json as SignInSuccess;
}