// 5. CompleteModal.tsx
import React from "react";
import EventResultModal from "../../components/EventResultModal";

interface CompleteProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  menuInfo?: string;
  contentType?: "image" | "video" | null;
  reviewText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDownload: () => void;
}

export default function CompleteModal({
  visible,
  onClose,
  generatedContent,
  onConfirm,
  onDownload,
  onCancel,
}: CompleteProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <EventResultModal
      visible={visible}
      onClose={onClose}
      generatedContent={generatedContent}
      title="이벤트 포스터 생성 완료!"
      subtitle="이벤트 게시판에 업로드하시겠습니까?"
      retryButtonText="다시 만들기"
      downloadButtonText="파일로 저장"
      uploadButtonText="업로드하기"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
      onDownload={onDownload}
    />
  );
}
