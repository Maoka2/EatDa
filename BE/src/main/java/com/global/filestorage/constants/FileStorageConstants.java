package com.global.filestorage.constants;

import static com.global.constants.Messages.UTILITY_CLASS_ERROR;

import java.util.Map;

/**
 * 파일 저장 및 이미지 최적화 관련 상수 정의
 */
public final class FileStorageConstants {

    // ===== MIME 타입과 확장자 매핑 =====
    public static final Map<String, String> MIME_TO_EXT = Map.ofEntries(
            Map.entry("image/jpeg", ".jpg"),
            Map.entry("image/png", ".png"),
            Map.entry("image/webp", ".webp"),
            Map.entry("image/avif", ".avif"),
            Map.entry("video/mp4", ".mp4"),
            Map.entry("video/webm", ".webm")
    );

    // ===== 파일명 처리용 문자열 상수 =====
    public static final String EMPTY = ""; // 빈 문자열
    public static final String HYPHEN = "-"; // 하이픈 문자

    // ===== 이미지 최적화 기본 설정값 =====
    public static final int DEFAULT_IMAGE_WIDTH = 720; // 이미지 리사이징 시 기본 너비
    public static final float DEFAULT_IMAGE_QUALITY = 0.85f; // 이미지 압축 시 기본 품질 수준

    // ===== 이미지 포맷 상수 =====
    public static final String FORMAT_AVIF = "AVIF"; // AVIF 포맷 문자열
    public static final String FORMAT_JPEG = "JPEG"; // JPEG 포맷 문자열

    // ===== 파일 저장 관련 로그 메시지 =====
    public static final String FILE_STORAGE_FILE_UPLOAD_ERROR =
            "[LocalFileStorageService] 파일 저장 실패: {}"; // 원본 파일명 포함

    public static final String FILE_STORAGE_INVALID_FILE_TYPE =
            "[LocalFileStorageService] MIME 타입 미지원: {}"; // 지원하지 않는 MIME 타입

    // ===== 이미지 최적화 관련 로그 메시지 =====
    public static final String IMAGE_OPTIMIZER_DECODING_FAILED =
            "[ImageOptimizer] 유효하지 않은 이미지 파일입니다: {}"; // 파일명 포함

    public static final String IMAGE_OPTIMIZER_ENCODER_NOT_FOUND =
            "[ImageOptimizer] ImageIO 인코더가 등록되지 않음 - 포맷: {}"; // 포맷 포함

    public static final String IMAGE_OPTIMIZER_ENCODING_FAILED =
            "[ImageOptimizer] 이미지 인코딩 실패 - 포맷: {}, 파일명: {}"; // 포맷, 파일명 포함

    public static final String IMAGE_OPTIMIZER_UNEXPECTED_ERROR =
            "[ImageOptimizer] 이미지 최적화 실패 - 포맷: {}, 파일명: {}, 원인: {}"; // 포맷, 파일명, 예외 메시지 포함

    // ===== 이미지 최적화 관련 예외 메시지 =====
    public static final String EXCEPTION_ENCODER_NOT_FOUND = "지원하지 않는 이미지 포맷입니다: %s";
    public static final String EXCEPTION_DECODING_FAILED = "유효하지 않은 이미지 파일입니다: %s";
    public static final String EXCEPTION_ENCODING_FAILED = "이미지 인코딩 실패 (포맷: %s, 파일명: %s)";
    
    // Utility 클래스 생성자 제한
    private FileStorageConstants() {
        throw new UnsupportedOperationException(UTILITY_CLASS_ERROR.message());
    }
}
