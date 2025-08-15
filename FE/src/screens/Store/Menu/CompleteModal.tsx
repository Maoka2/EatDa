// src/screens/Store/Menu/CompleteModal.tsx

import React, { useState } from "react";
import { Alert } from "react-native";
import AICompleteModal from "../../../components/AICompleteModal";
import { sendMenuPoster } from "./services/api";

interface CompleteProps {
  visible: boolean;
  onClose: () => void;

  // UI 표시용 (이미지 URL 등)
  generatedContent?: string | null;
  menuInfo?: string;
  contentType?: "image" | "video" | null;
  reviewText?: string;

  // 전송 성공 후 상위에서 후속 진행할 때 호출
  onSent?: () => void;

  // 실제 전송 대상
  menuPosterId: number;
}

export default function CompleteModal({
  visible,
  onClose,
  generatedContent,
  onSent,
  menuPosterId,
}: CompleteProps) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!menuPosterId || submitting) return;

    try {
      setSubmitting(true);
      const res = await sendMenuPoster({ menuPosterId });
      Alert.alert("성공", res?.message || "포스터가 전송되었습니다.");
      setSubmitting(false);

      onSent?.();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert(
        "전송 실패",
        err?.message || "포스터 전송 중 문제가 발생했습니다."
      );
    }
  };

  const handleCancel = () => {
    if (submitting) return; // 전송 중일 땐 닫기 방지
    onClose();
  };

  return (
    <AICompleteModal
      visible={visible}
      onClose={onClose}
      generatedContent={generatedContent}
      title="메뉴판 생성 완료!"
      subtitle="사장님께 메뉴판을 전송하시겠습니까?"
      confirmButtonText={submitting ? "전송 중..." : "전송하기"}
      cancelButtonText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
