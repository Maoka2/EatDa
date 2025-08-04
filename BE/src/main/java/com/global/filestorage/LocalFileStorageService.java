package com.global.filestorage;

import static com.global.constants.ErrorCode.FILE_UPLOAD_ERROR;
import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 로컬 디스크에 파일을 저장하는 구현체
 */
@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {
    private static final String EMPTY = "";
    private static final String HYPHEN = "-";
    private static final String DOT = ".";

    private final FileStorageProperties properties;

    /**
     * 이미지 파일을 저장
     *
     * @param file         업로드된 이미지 파일
     * @param relativePath 저장할 상대 경로 (예: menus/42)
     * @param originalName 원본 파일명 (확장자 추출용)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeImage(final MultipartFile file, final String relativePath, final String originalName) {
        return storeFile(file, properties.getImageRoot(), relativePath, originalName);
    }

    /**
     * 비디오 파일을 저장
     *
     * @param file         업로드된 비디오 파일
     * @param relativePath 저장할 상대 경로 (예: reviews/17)
     * @param originalName 원본 파일명 (확장자 추출용)
     * @return 저장된 파일의 전체 경로
     */
    @Override
    public String storeVideo(final MultipartFile file, final String relativePath, final String originalName) {
        return storeFile(file, properties.getVideoRoot(), relativePath, originalName);
    }

    /**
     * 파일 저장 로직 (공통 내부 처리)
     *
     * @param file         업로드된 파일
     * @param baseDir      저장 루트 디렉토리
     * @param relativePath 상대 저장 경로
     * @param originalName 원본 파일명
     * @return 저장된 파일의 전체 경로
     */
    private String storeFile(final MultipartFile file, final String baseDir, final String relativePath,
                             final String originalName) {
        try {
            // 확장자 추출
            String extension = getFileExtension(originalName);

            // UUID 기반 파일명 생성 (중복 방지)
            String filename = UUID.randomUUID().toString().replace(HYPHEN, EMPTY) + extension;

            // 저장 경로 구성
            Path fullPath = Paths.get(baseDir, relativePath, filename);
            Files.createDirectories(fullPath.getParent()); // 상위 폴더 없으면 생성

            // 파일 실제 저장
            file.transferTo(fullPath.toFile());

            // 저장된 전체 경로 반환
            return fullPath.toString();
        } catch (IOException e) {
            throw new GlobalException(FILE_UPLOAD_ERROR, originalName, e);
        }
    }

    /**
     * 파일명에서 확장자 추출 (소문자 반환)
     */
    private String getFileExtension(final String filename) {
        String ext = FilenameUtils.getExtension(filename);
        if (Objects.isNull(ext) || ext.isBlank()) {
            throw new GlobalException(INVALID_FILE_TYPE, filename);
        }
        return DOT + ext.toLowerCase();
    }
}
