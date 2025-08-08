// src/screens/Register/services/ocr.ts
import * as FileSystem from "expo-file-system";
import { MenuItemType } from "../types";

/** 메뉴 텍스트 파싱 (디자인 유지용 로직 그대로) */
export const parseMenuFromText = (text: string): MenuItemType[] => {
  const lines = text.split("\n").filter((line) => line.trim().length > 0);
  const menuItems: MenuItemType[] = [];

  const menuPattern = /(.+?)\s*(\d{1,3}(?:,\d{3})*원|\d+원)/g;
  const matches = text.match(menuPattern);

  if (matches) {
    matches.forEach((match, index) => {
      const parts = match.match(/(.+?)\s*(\d{1,3}(?:,\d{3})*원|\d+원)/);
      if (parts && parts[1] && parts[2]) {
        const menuName = parts[1].trim();
        const price = parts[2].trim();
        if (menuName.length >= 2 && !menuName.match(/^[0-9\s]+$/)) {
          menuItems.push({
            id: Date.now().toString() + "_" + index,
            name: menuName,
            price,
            description: "",
          });
        }
      }
    });
  }

  if (menuItems.length === 0) {
    for (let i = 0; i < lines.length - 1; i++) {
      const currentLine = lines[i].trim();
      const nextLine = lines[i + 1].trim();
      if (
        currentLine.length >= 2 &&
        !currentLine.match(/^[0-9\s,원]+$/) &&
        nextLine.match(/^\d{1,3}(?:,\d{3})*원$|^\d+원$/)
      ) {
        menuItems.push({
          id: Date.now().toString() + "_" + i,
          name: currentLine,
          price: nextLine,
          description: "",
        });
        i++;
      }
    }
  }

  return menuItems;
};

/** Google Vision API */
export const processWithGoogleVision = async (
  base64Image: string,
  apiKey: string
): Promise<MenuItemType[]> => {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "TEXT_DETECTION", maxResults: 10 }],
          },
        ],
      }),
    }
  );

  const result = await response.json();
  if (result?.responses?.[0]?.textAnnotations) {
    const detectedText = result.responses[0].textAnnotations[0].description;
    return parseMenuFromText(detectedText);
  }
  throw new Error("텍스트를 인식할 수 없습니다.");
};

/** NAVER CLOVA OCR */
export const processWithNaverClova = async (
  imageUri: string,
  secret: string,
  endpoint: string // 예: "https://naveropenapi.apigw.ntruss.com/custom/v1/your-domain/your-api-version/general"
): Promise<MenuItemType[]> => {
  const formData = new FormData();
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "menu.jpg",
  } as any);
  formData.append(
    "message",
    JSON.stringify({
      version: "V2",
      requestId: "menu-ocr-" + Date.now(),
      timestamp: Date.now(),
      images: [{ format: "jpg", name: "menu" }],
    })
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-OCR-SECRET": secret,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  const result = await response.json();
  if (result?.images?.[0]?.fields) {
    const fields = result.images[0].fields;
    const detectedText = fields.map((f: any) => f.inferText).join("\n");
    return parseMenuFromText(detectedText);
  }
  throw new Error("텍스트를 인식할 수 없습니다.");
};

/** 이미지 파일을 base64로 읽기 */
export const readImageAsBase64 = (imageUri: string) =>
  FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
