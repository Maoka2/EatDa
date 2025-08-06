// 5. CompleteModal.tsx
import React from "react";
import AICompleteModal from "../../../components/AICompleteModal";

interface CompleteProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  reviewText?: string;
  contentType?: "image" | "video" | null;
  onConfirm?: () => void; // 게시하기 버튼 핸들러
  onCancel?: () => void; // 취소 버튼 핸들러
}

export default function CompleteModal(props: CompleteProps) {
  return <AICompleteModal {...props} />;
}
