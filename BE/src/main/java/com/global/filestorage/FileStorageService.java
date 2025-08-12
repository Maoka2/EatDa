package com.global.filestorage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 파일 저장소 서비스 인터페이스
 */
public interface FileStorageService {
    /**
     * 이미지 파일을 저장소에 저장
     *
     * @param file         저장할 이미지 파일
     * @param relativePath 저장할 도메인 또는 하위 디렉토리 경로
     * @param originalName 원본 파일명
     * @param convertToWebp true면 webp로 변환, false면 원본 확장자 유지
     * @return 저장된 파일의 경로
     */
    String storeImage(MultipartFile file, String relativePath, String originalName, boolean convertToWebp);

    // 파일 그냥 저장
    String storeImage(final MultipartFile file, final String relativePath, final String originalName);

    /**
     * 비디오 파일을 저장소에 저장
     *
     * @param file         저장할 비디오 파일
     * @param relativePath 상대 경로
     * @param originalName 원본 파일명
     * @return 저장된 파일의 경로
     */
    String storeVideo(MultipartFile file, String relativePath, String originalName);

    /**
     * 저장된 파일을 Resource로 로드
     *
     * @param filePath 파일 경로 (전체 경로)
     * @return Spring Resource 객체
     */
    Resource loadAsResource(String filePath);
}
