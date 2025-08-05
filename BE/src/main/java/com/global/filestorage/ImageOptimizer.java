package com.global.filestorage;

import static com.global.constants.ErrorCode.IMAGE_PROCESSING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.DEFAULT_IMAGE_WIDTH;
import static com.global.filestorage.constants.FileStorageConstants.EXCEPTION_DECODING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.FORMAT_WEBP;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_DECODING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_SKIP_RESIZE;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_SKIP_WEBP_SAME_SIZE;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_UNEXPECTED_ERROR;
import static com.global.filestorage.constants.FileStorageConstants.MIME_TYPE_WEBP;
import static com.global.filestorage.constants.FileStorageConstants.WEBP_COMPRESSION_LEVEL;
import static com.global.filestorage.constants.FileStorageConstants.WEBP_COMPRESSION_METHOD;
import static com.global.filestorage.constants.FileStorageConstants.WEBP_QUALITY;

import com.global.exception.GlobalException;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Objects;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 이미지 최적화 컴포넌트 - 업로드된 이미지에 대해 리사이징 및 WebP 포맷 변환 처리
 */
@Slf4j
@Component
public class ImageOptimizer {

    /**
     * 이미지 최적화 메인 진입점 - WebP + 크기 동일 → 변환 생략 - WebP + 작음 → 리사이징만 생략, 인코딩도 생략 - WebP + 큼  → 리사이징 + 인코딩 - WebP 아님 → 리사이징
     * 조건 판단 후 무조건 인코딩
     */
    public InputStream optimize(final MultipartFile file) {
        try {
            BufferedImage original = decode(file);
            int width = original.getWidth();
            boolean isWebp = isWebp(file);

            // WebP + 이미 최적화된 사이즈라면 그대로 반환
            if (isWebp && width == DEFAULT_IMAGE_WIDTH) {
                log.debug(IMAGE_OPTIMIZER_SKIP_WEBP_SAME_SIZE, file.getOriginalFilename());
                return file.getInputStream();
            }

            // 리사이징 필요 여부 확인
            ImmutableImage image = prepareImage(original, width, file.getOriginalFilename());

            // 인코딩 여부 판단
            if (!isWebp || width > DEFAULT_IMAGE_WIDTH) {
                return encodeAsStream(image);
            }

            // WebP이고 리사이징도 안 한 경우
            return file.getInputStream();

        } catch (IOException e) {
            log.error(IMAGE_OPTIMIZER_UNEXPECTED_ERROR, FORMAT_WEBP, file.getOriginalFilename(), e.getMessage());
            throw new GlobalException(IMAGE_PROCESSING_FAILED,
                    file.getOriginalFilename() + " : " + e.getMessage(), e);
        }
    }

    /**
     * MultipartFile을 BufferedImage로 디코딩 유효하지 않은 이미지면 예외 발생
     */
    private BufferedImage decode(final MultipartFile file) throws IOException {
        BufferedImage original = ImageIO.read(file.getInputStream());
        if (Objects.isNull(original)) {
            log.error(IMAGE_OPTIMIZER_DECODING_FAILED, file.getOriginalFilename());
            throw new IOException(String.format(EXCEPTION_DECODING_FAILED, file.getOriginalFilename()));
        }
        return original;
    }

    /**
     * MIME 타입이 WebP인지 확인
     */
    private boolean isWebp(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null && contentType.equalsIgnoreCase(MIME_TYPE_WEBP);
    }

    /**
     * 이미지 리사이징 여부 판단 후 ImmutableImage 생성
     */
    private ImmutableImage prepareImage(BufferedImage image, int width, String filename) {
        ImmutableImage immutable = ImmutableImage.fromAwt(image);
        if (width > DEFAULT_IMAGE_WIDTH) {
            return immutable.scaleToWidth(DEFAULT_IMAGE_WIDTH);
        }
        log.debug(IMAGE_OPTIMIZER_SKIP_RESIZE, filename);
        return immutable;
    }

    /**
     * ImmutableImage를 WebP로 인코딩하고 InputStream으로 반환
     */
    private InputStream encodeAsStream(ImmutableImage image) throws IOException {
        WebpWriter writer = WebpWriter.DEFAULT
                .withQ(WEBP_QUALITY)
                .withM(WEBP_COMPRESSION_METHOD)
                .withZ(WEBP_COMPRESSION_LEVEL);

        byte[] bytes = image.bytes(writer);
        return new ByteArrayInputStream(bytes);
    }
}
