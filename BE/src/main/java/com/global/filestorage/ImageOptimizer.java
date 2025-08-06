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
     * 이미지 최적화 메인 진입점
     */
    public InputStream optimize(final MultipartFile file) {
        try {
            BufferedImage original = decode(file);
            int width = original.getWidth();
            int height = original.getHeight();
            boolean isWebp = isWebp(file);

            // WebP이며 크기까지 최적화된 경우 → 그대로 반환
            if (isWebp && width <= DEFAULT_IMAGE_WIDTH && height <= DEFAULT_IMAGE_WIDTH) {
                log.debug(IMAGE_OPTIMIZER_SKIP_WEBP_SAME_SIZE, file.getOriginalFilename());
                return file.getInputStream();
            }

            ImmutableImage image = prepareImage(original, file.getOriginalFilename());

            if (!isWebp || shouldResize(width, height)) {
                return encodeAsStream(image);
            }

            return file.getInputStream();
        } catch (IOException e) {
            log.error(IMAGE_OPTIMIZER_UNEXPECTED_ERROR, FORMAT_WEBP, file.getOriginalFilename(), e.getMessage());
            throw new GlobalException(IMAGE_PROCESSING_FAILED,
                    file.getOriginalFilename() + " : " + e.getMessage(), e);
        }
    }

    /**
     * MultipartFile을 BufferedImage로 디코딩 - 실패 시 예외
     */
    private BufferedImage decode(final MultipartFile file) throws IOException {
        try (InputStream input = file.getInputStream()) {
            ImmutableImage image = ImmutableImage.loader().fromStream(input);
            return image.awt();
        } catch (Exception e) {
            log.error(IMAGE_OPTIMIZER_DECODING_FAILED, e.getMessage());
            throw new IOException(String.format(EXCEPTION_DECODING_FAILED, file.getOriginalFilename()), e);
        }
    }

    /**
     * MIME 타입이 WebP인지 확인
     */
    private boolean isWebp(final MultipartFile file) {
        String contentType = file.getContentType();
        return !Objects.isNull(contentType) && contentType.equalsIgnoreCase(MIME_TYPE_WEBP);
    }

    /**
     * 이미지 리사이징 여부 판단 후 ImmutableImage 생성
     */
    private ImmutableImage prepareImage(final BufferedImage image, final String filename) {
        int width = image.getWidth();
        int height = image.getHeight();

        ImmutableImage immutable = ImmutableImage.fromAwt(image);
        if (!shouldResize(width, height)) {
            log.debug(IMAGE_OPTIMIZER_SKIP_RESIZE, filename);
            return immutable;
        }

        int[] resized = calculateResizedDimensions(width, height);
        return immutable.scaleTo(resized[0], resized[1]);
    }

    /**
     * 긴 변이 DEFAULT_IMAGE_WIDTH를 초과하면 리사이징 필요
     */
    private boolean shouldResize(final int width, final int height) {
        return Math.max(width, height) > DEFAULT_IMAGE_WIDTH;
    }

    /**
     * 비율 유지하며 리사이징할 크기 계산
     */
    private int[] calculateResizedDimensions(final int width, final int height) {
        int maxDim = Math.max(width, height);
        double scale = (double) DEFAULT_IMAGE_WIDTH / maxDim;
        int newWidth = Math.max((int) (width * scale), 3);
        int newHeight = Math.max((int) (height * scale), 3);
        return new int[]{newWidth, newHeight};
    }

    /**
     * ImmutableImage를 WebP로 인코딩하고 InputStream 반환
     */
    private InputStream encodeAsStream(final ImmutableImage image) throws IOException {
        WebpWriter writer = WebpWriter.DEFAULT
                .withQ(WEBP_QUALITY)
                .withM(WEBP_COMPRESSION_METHOD)
                .withZ(WEBP_COMPRESSION_LEVEL);

        byte[] bytes = image.bytes(writer);
        return new ByteArrayInputStream(bytes);
    }
}
