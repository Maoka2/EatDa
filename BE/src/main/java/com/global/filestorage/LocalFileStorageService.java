package com.global.filestorage;

import static com.global.constants.ErrorCode.FILE_UPLOAD_ERROR;
import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로컬 디스크에 파일을 저장하는 구현체
 */
@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    // UUID 파일명 생성 시 사용할 문자열 상수
    private static final String EMPTY = "";
    private static final String HYPHEN = "-";

    // MIME 타입에 따른 확장자 매핑 (저장 시 사용)
    private static final Map<String, String> MIME_TO_EXT = Map.ofEntries(
            Map.entry("image/jpeg", ".jpg"),
            Map.entry("image/png", ".png"),
            Map.entry("image/webp", ".webp"),
            Map.entry("image/avif", ".avif"),
            Map.entry("video/mp4", ".mp4"),
            Map.entry("video/webm", ".webm")
    );

    private final FileStorageProperties properties;

    /**
     * 이미지 파일을 저장소에 저장
     *
     * @param file         업로드된 이미지 파일
     * @param relativePath 상대 경로 (예: menus/42)
     * @param originalName 원본 파일명 (예외 메시지용)
     * @return 실제 저장된 파일의 전체 경로
     */
    @Override
    public String storeImage(final MultipartFile file, final String relativePath, final String originalName) {
        return storeFile(file, properties.getImageRoot(), relativePath, originalName);
    }

    /**
     * 비디오 파일을 저장소에 저장
     *
     * @param file         업로드된 비디오 파일
     * @param relativePath 상대 경로 (예: reviews/17)
     * @param originalName 원본 파일명 (예외 메시지용)
     * @return 실제 저장된 파일의 전체 경로
     */
    @Override
    public String storeVideo(final MultipartFile file, final String relativePath, final String originalName) {
        return storeFile(file, properties.getVideoRoot(), relativePath, originalName);
    }

    /**
     * 실제 파일 저장 로직 (이미지/비디오 공통)
     */
    private String storeFile(final MultipartFile file, final String baseDir, final String relativePath,
                             final String originalName) {
        try {
            final String contentType = file.getContentType();
            final String extension = resolveExtensionFromMimeType(contentType);

            final String filename = UUID.randomUUID().toString().replace(HYPHEN, EMPTY) + extension;
            final Path fullPath = Paths.get(baseDir, relativePath, filename);

            Files.createDirectories(fullPath.getParent()); // 상위 디렉토리 없을 경우 생성
            file.transferTo(fullPath.toFile()); // 파일 저장

            return fullPath.toString();
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * MIME 타입에 따른 확장자 결정
     */
    private String resolveExtensionFromMimeType(final String mimeType) {
        return Optional.ofNullable(MIME_TO_EXT.get(mimeType))
                .orElseThrow(() -> new GlobalException(INVALID_FILE_TYPE, mimeType));
    }
}
