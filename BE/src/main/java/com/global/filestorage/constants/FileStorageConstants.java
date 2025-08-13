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
    public static final String NULL = "null";

    // ===== 이미지 최적화 기본 설정값 =====
    public static final int DEFAULT_IMAGE_WIDTH = 720; // 이미지 리사이징 시 기본 너비
    public static final int WEBP_QUALITY = 80;     // WebP 품질 설정 (0 = 낮음, 100 = 최고)
    public static final int WEBP_COMPRESSION_METHOD = 4;     // WebP 압축 알고리즘 단계 (0~6, 높을수록 느리지만 압축률 높음)
    public static final int WEBP_COMPRESSION_LEVEL = 6;     // WebP 압축 수준 (0~9, 높을수록 용량 감소)

    // ===== 이미지 포맷 상수 =====
    public static final String FORMAT_WEBP = "WEBP"; // WEBP 포맷 문자열

    // ===== 파일 저장 관련 로그 메시지 =====
    public static final String FILE_STORAGE_FILE_UPLOAD_ERROR =
            "[LocalFileStorageService] 파일 저장 실패: {}"; // 원본 파일명 포함

    public static final String FILE_STORAGE_INVALID_FILE_TYPE =
            "[LocalFileStorageService] MIME 타입 미지원: {}"; // 지원하지 않는 MIME 타입

    // ===== 이미지 최적화 관련 로그 메시지 =====
    public static final String IMAGE_OPTIMIZER_SKIP_WEBP_SAME_SIZE =
            "[ImageOptimizer] WebP + 사이즈 동일 → 최적화 생략: {}";

    public static final String IMAGE_OPTIMIZER_SKIP_RESIZE =
            "[ImageOptimizer] 리사이징 생략: {}";

    public static final String IMAGE_OPTIMIZER_DECODING_FAILED =
            "[ImageOptimizer] 유효하지 않은 이미지 파일입니다: {}"; // 파일명 포함

    public static final String IMAGE_OPTIMIZER_UNEXPECTED_ERROR =
            "[ImageOptimizer] 이미지 최적화 실패 - 포맷: {}, 파일명: {}, 원인: {}"; // 포맷, 파일명, 예외 메시지 포함

    // ===== Content-Type 검사용 문자열 상수 추가 =====
    public static final String MIME_TYPE_WEBP = "image/webp";

    // ===== 이미지 최적화 관련 예외 메시지 =====
    public static final String EXCEPTION_ENCODER_NOT_FOUND = "지원하지 않는 이미지 포맷입니다: %s";
    public static final String EXCEPTION_DECODING_FAILED = "유효하지 않은 이미지 파일입니다: %s";
    public static final String EXCEPTION_ENCODING_FAILED = "이미지 인코딩 실패 (포맷: %s, 파일명: %s)";


    // ===== 비디오 최적화 관련 파일명/확장자 상수 =====
    public static final String FORMAT_MP4 = "mp4";
    public static final int DEFAULT_VIDEO_HEIGHT = 720;
    public static final String VIDEO_CODEC = "libx264";
    public static final String AUDIO_CODEC = "aac";
    public static final String FFMPEG_PRESET = "fast";
    public static final String FFMPEG_CRF = "23";
    public static final String TEMP_VIDEO_INPUT_PREFIX = "input-";
    public static final String TEMP_VIDEO_OUTPUT_PREFIX = "output-";
    public static final String TEMP_FILE_EXTENSION_TMP = ".tmp";
    public static final String TEMP_FILE_EXTENSION_MP4 = ".mp4";


    // ===== 비디오 최적화 로그 메시지 =====
    public static final String VIDEO_OPTIMIZER_FFMPEG_LOG =
            "[VideoOptimizer] FFmpeg 로그: {}";

    public static final String VIDEO_OPTIMIZER_UNEXPECTED_ERROR =
            "[VideoOptimizer] 비디오 최적화 실패 - 파일명: {}, 원인: {}";

    public static final String VIDEO_OPTIMIZER_FFMPEG_FAILED =
            "[VideoOptimizer] FFmpeg 처리 실패 (exitCode={}): {}";

    // ===== 비디오 최적화 관련 예외 메시지 =====
    public static final String EXCEPTION_VIDEO_FFMPEG_FAILED =
            "[VideoOptimizer] FFmpeg 처리 실패 - exit code %d. Output: %s";

    // Utility 클래스 생성자 제한
    private FileStorageConstants() {
        throw new UnsupportedOperationException(UTILITY_CLASS_ERROR.message());
    }
}
