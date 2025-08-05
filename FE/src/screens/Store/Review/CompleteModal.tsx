// 5. CompleteModal.tsx
import React from "react";
import AICompleteModal from "../../../components/AICompleteModal";

interface CompleteProps {
  visible: boolean;
  onClose: () => void;
  generatedContent?: string | null;
  reviewText?: string;
  contentType?: "image" | "video" | null;
}
export default function CompleteModal(props: CompleteProps) {
  return <AICompleteModal {...props} />;
}
