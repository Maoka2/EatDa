import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import OCRStep from "./OCRStep";
import MenuSelectStep from "./MenuSelectStep";
import GenerateStep from "./GenerateStep";
import WriteStep from "./WriteStep";
import CompleteModal from "./CompleteModal";

// GenerateStep과 동일한 타입으로 맞춤
type ContentType = "image" | "shorts_ray2" | "shorts_gen4" | null;

export default function ReviewWriteScreen({
  onClose,
}: {
  onClose: () => void;
}) {
  type Step = "ocr" | "menu" | "gen" | "write";
  const [step, setStep] = useState<Step>("ocr");
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<ContentType>(null); // 타입 변경
  const [imgs, setImgs] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [aiOk, setAiOk] = useState(false);
  const [text, setText] = useState("");
  const [doneModal, setDoneModal] = useState(false);

  const nextGen = () => {
    setGenLoading(true);
    setTimeout(() => {
      setAiOk(true);
      setGenLoading(false);
      setStep("write");
    }, 2000);
  };

  const finish = () => text.trim() && setDoneModal(true);
  const closeDone = () => {
    setDoneModal(false);
    onClose();
  };

  const nextMenu = () => {
    if (selected.length) setStep("gen");
  };

  // 이미지 추가 함수 - imageUrl 매개변수 받도록 수정
  const handleAddImage = (imageUrl: string) => {
    setImgs((prev) => [...prev, imageUrl]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {step === "ocr" && (
        <OCRStep
          onSuccess={() => setStep("menu")}
          onFailure={() => onClose()}
        />
      )}

      {step === "menu" && (
        <>
          <MenuSelectStep
            selected={selected}
            onToggle={(id) =>
              setSelected((p) =>
                p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
              )
            }
          />
          <View style={styles.absoluteBottom}>
            <TouchableOpacity
              style={[styles.button, !selected.length && styles.disabled]}
              onPress={nextMenu}
              disabled={!selected.length}
            >
              <Text style={styles.buttonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === "gen" && (
        <GenerateStep
          contentType={type}
          uploadedImages={imgs}
          prompt={prompt}
          onType={setType}
          onAdd={handleAddImage} // 수정된 함수 전달
          onRemove={(i) => setImgs((p) => p.filter((_, idx) => idx !== i))}
          onPrompt={setPrompt}
          onNext={nextGen}
        />
      )}

      {step === "write" && (
        <WriteStep
          isGenerating={genLoading}
          aiDone={aiOk}
          text={text}
          onChange={setText}
          onNext={finish}
          onBack={() => setStep("gen")}
          onClose={onClose}
        />
      )}

      <CompleteModal
        visible={doneModal}
        onClose={closeDone}
        generatedContent={null}
        reviewText={text}
        contentType={
          type === "shorts_ray2" || type === "shorts_gen4" ? "video" : "image"
        } // 수정
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  absoluteBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 34,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    zIndex: 10,
  },
  button: {
    backgroundColor: "#FF69B4",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
