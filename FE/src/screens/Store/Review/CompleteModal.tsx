// CompleteModal.tsx
import React from "react";
import AICompleteModal from "../../../components/AICompleteModal";

interface CompleteProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  contentType?: "IMAGE" | "SHORTS_RAY_2" | "SHORTS_GEN_4" | null;
  menuInfo?: string;
  reviewText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function CompleteModal({
  visible,
  onClose,
  generatedContent,
  contentType,
  onConfirm,
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

  // 콘텐츠 타입에 따른 제목과 설명 변경
  const getModalContent = () => {
    if (contentType === "SHORTS_RAY_2") {
      return {
        title: "예쁜 쇼츠 생성 완료!",
        subtitle: "고품질 AI 쇼츠가 생성되었습니다.생성된 리뷰를 게시하시겠습니까?"
      };
    } else if (contentType === "SHORTS_GEN_4") {
      return {
        title: "빠른 쇼츠 생성 완료!",
        subtitle: "빠르게 생성된 AI 쇼츠입니다. 생성된 리뷰를 게시하시겠습니까?"
      };
    } else {
      return {
        title: "AI 이미지 생성 완료!",
        subtitle: "AI가 생성한 이미지를 확인하고 리뷰를 게시하시겠습니까?"
      };
    }
  };

  const modalContent = getModalContent();

  // 디버깅용 로그
  console.log("[CompleteModal] Props:", {
    visible,
    contentType,
    hasGeneratedContent: !!generatedContent,
    generatedContentLength: generatedContent?.length || 0
  });

  return (
    <AICompleteModal
      visible={visible}
      onClose={onClose}
      generatedContent={generatedContent}
      contentType={contentType}
      title={modalContent.title}
      subtitle={modalContent.subtitle}
      confirmButtonText="게시하기"
      cancelButtonText="취소"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}