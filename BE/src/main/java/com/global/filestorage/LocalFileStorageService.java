package com.global.filestorage;

import static com.global.constants.ErrorCode.FILE_UPLOAD_ERROR;
import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;
import static com.global.filestorage.constants.FileStorageConstants.EMPTY;
import static com.global.filestorage.constants.FileStorageConstants.HYPHEN;
import static com.global.filestorage.constants.FileStorageConstants.MIME_TO_EXT;
import static com.global.filestorage.constants.FileStorageConstants.MIME_TYPE_WEBP;
import static com.global.filestorage.constants.FileStorageConstants.NULL;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import com.global.utils.ImageOptimizationUtils;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로컬 디스크에 파일을 저장하는 구현체
 */
@Service
@RequiredArgsConstructor
@Getter
public class LocalFileStorageService implements FileStorageService {

    private final FileStorageProperties properties;

    /**
     * 이미지 파일을 저장소에 저장 - WebP 변환 및 리사이징 등 최적화 수행 후 저장
     *
     * @param file         업로드된 원본 이미지 파일
     * @param relativePath 저장 경로 (루트 기준 상대경로)
     * @param originalName 원본 파일명 (로깅/예외 용도)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeImage(final MultipartFile file, final String relativePath, final String originalName,
                             final boolean convertToWebp) {

        try {
            String originalMimeType = extractAndValidateMimeType(file);
            InputStream optimizedStream = ImageOptimizationUtils.optimize(file, convertToWebp);
            String targetMimeType = convertToWebp ? MIME_TYPE_WEBP : originalMimeType;

            return storeOptimizedImage(optimizedStream, targetMimeType, properties.getImageRoot(), relativePath);
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 비디오 파일을 저장소에 저장 - 현재는 인코딩/리사이징 없이 원본 그대로 저장
     *
     * @param file         업로드된 비디오 파일
     * @param relativePath 저장 경로 (루트 기준 상대경로)
     * @param originalName 원본 파일명 (로깅/예외 용도)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeVideo(final MultipartFile file, final String relativePath, final String originalName) {
        return storeOptimizedVideo(file, properties.getVideoRoot(), relativePath, originalName);
    }

    /**
     * 비디오 파일을 최적화하여 저장소에 저장 (MultipartFile 기반)
     *
     * @param file         업로드된 비디오 파일
     * @param baseDir      저장소 루트 디렉토리 (비디오용)
     * @param relativePath 루트 기준 상대 경로
     * @param originalName 원본 파일명 (예외 메시지용)
     * @return 저장된 파일의 전체 경로
     */
    private String storeOptimizedVideo(final MultipartFile file, final String baseDir, final String relativePath,
                                       final String originalName) {
        try {
            String contentType = file.getContentType();
            String extension = resolveExtensionFromMimeType(contentType);
            Path fullPath = generateFullPath(baseDir, relativePath, extension);

            // 파일을 디스크에 저장
            file.transferTo(fullPath.toFile());
            return fullPath.toString();
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 최적화된 이미지 파일을 저장소에 저장 (InputStream 기반)
     *
     * @param inputStream  이미지 데이터 스트림
     * @param mimeType     이미지 MIME 타입
     * @param imageRoot    저장소 루트 디렉토리 (이미지용)
     * @param relativePath 루트 기준 상대 경로
     * @return 저장된 파일의 전체 경로
     */
    private String storeOptimizedImage(final InputStream inputStream, final String mimeType,
                                       final String imageRoot, final String relativePath) throws IOException {
        String extension = resolveExtensionFromMimeType(mimeType);

        Path root = Paths.get(imageRoot).toAbsolutePath().normalize();
        Path fullPath = root.resolve(sanitize(relativePath))  // 아래 sanitize 참고
                .resolve(UUID.randomUUID().toString().replace(HYPHEN, EMPTY) + extension)
                .normalize();

        // 방어: 루트 밖으로 나가지 못하게
        if (!fullPath.startsWith(root)) {
            throw new SecurityException("Invalid path: " + fullPath);
        }

        System.out.printf("[FileStorage] root=%s, rel=%s, FULL=%s, user.home=%s, active=%s%n",
                root, relativePath, fullPath,
                System.getProperty("user.home"),
                System.getProperty("spring.profiles.active"));

        Files.createDirectories(fullPath.getParent());
        Files.copy(inputStream, fullPath);
        return fullPath.toString();
    }

    private String sanitize(String relativePath) {
        if (relativePath == null) {
            return "";
        }
        String cleaned = relativePath.replace("\\", "/")
                .replaceAll("^/+", "")   // 선행 슬래시 제거
                .replaceAll("/+", "/");  // 중복 슬래시 정리
        if (cleaned.contains("..")) {
            throw new IllegalArgumentException("Invalid relativePath: " + cleaned);
        }
        return cleaned;
    }


    /**
     * 고유 파일명을 포함한 전체 파일 경로 생성 + 필요한 디렉토리 생성
     *
     * @param baseDir      루트 디렉토리
     * @param relativePath 상대 경로
     * @param extension    확장자 ('.webp', '.mp4' 등 포함)
     * @return 전체 경로가 포함된 Path 객체
     */
    private Path generateFullPath(final String baseDir, final String relativePath, final String extension)
            throws IOException {
        // UUID 기반 고유 파일명 생성
        String filename = UUID.randomUUID().toString().replace(HYPHEN, EMPTY) + extension;
        Path fullPath = Paths.get(baseDir, relativePath, filename);

        // 디렉토리 없으면 생성
        Files.createDirectories(fullPath.getParent());
        return fullPath;
    }

    /**
     * 유효한 MIME 타입인지 확인하고 반환
     *
     * @param file 업로드된 파일
     * @return 유효한 MIME 타입 (null 이거나 등록되지 않은 경우 예외 발생)
     */
    private String extractAndValidateMimeType(final MultipartFile file) {
        String mimeType = Optional.ofNullable(file.getContentType())
                .orElseThrow(() -> new GlobalException(INVALID_FILE_TYPE, NULL));

        if (!MIME_TO_EXT.containsKey(mimeType)) {
            throw new GlobalException(INVALID_FILE_TYPE, mimeType);
        }

        return mimeType;
    }

    /**
     * MIME 타입에 해당하는 파일 확장자를 반환 - 등록되지 않은 타입이면 예외 발생
     *
     * @param mimeType 파일의 Content-Type
     * @return 파일 확장자 (예: ".webp", ".mp4")
     */
    private String resolveExtensionFromMimeType(final String mimeType) {
        return Optional.ofNullable(MIME_TO_EXT.get(mimeType))
                .orElseThrow(() -> new GlobalException(INVALID_FILE_TYPE, mimeType));
    }
}
