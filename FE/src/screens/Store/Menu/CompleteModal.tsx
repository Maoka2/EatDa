// src/screens/Store/Menu/CompleteModal.tsx
import React, { useRef, useState } from "react";
import AICompleteModal from "../../../components/AICompleteModal";
import ResultModal from "../../../components/ResultModal";
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

  // ResultModal 상태
  const [resVisible, setResVisible] = useState(false);
  const [resType, setResType] = useState<"success" | "failure">("failure");
  const [resTitle, setResTitle] = useState<string>("");
  const [resMessage, setResMessage] = useState<string>("");

  // 성공 후 실행할 액션(확인 버튼 누를 때 호출)
  const pendingActionRef = useRef<(() => void) | null>(null);

  const openResult = (
    type: "success" | "failure",
    title: string,
    message: string,
    onAfterClose?: () => void
  ) => {
    setResType(type);
    setResTitle(title);
    setResMessage(message);
    pendingActionRef.current = onAfterClose ?? null;
    setResVisible(true);
  };

  const closeResult = () => {
    setResVisible(false);
    const fn = pendingActionRef.current;
    pendingActionRef.current = null;
    if (fn) fn();
  };

  const handleConfirm = async () => {
    if (!menuPosterId || submitting) return;

    try {
      setSubmitting(true);
      const res = await sendMenuPoster({ menuPosterId });
      setSubmitting(false);

      // ✅ 성공: ResultModal → 확인 누르면 onSent() → onClose()
      openResult(
        "success",
        "성공",
        res?.message || "포스터가 전송되었습니다.",
        () => {
          onSent?.();
          onClose();
        }
      );
    } catch (err: any) {
      setSubmitting(false);

      // ✅ 실패: ResultModal만 닫힘
      openResult(
        "failure",
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
    <>
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

      <ResultModal
        visible={resVisible}
        type={resType}
        title={resTitle}
        message={resMessage}
        onClose={closeResult}
      />
    </>
  );
}
