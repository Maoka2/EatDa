package com.global.utils;

import static com.global.constants.ErrorCode.IMAGE_PROCESSING_FAILED;
import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;
import static com.global.constants.Messages.UTILITY_CLASS_ERROR;
import static com.global.filestorage.constants.FileStorageConstants.*;

import com.global.exception.GlobalException;
import com.sksamuel.scrimage.ImmutableImage;
import com.sksamuel.scrimage.webp.WebpWriter;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Objects;
import javax.imageio.ImageIO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
public final class ImageOptimizationUtils {

    // 유틸리티 클래스의 인스턴스화를 방지
    private ImageOptimizationUtils() {
        throw new UnsupportedOperationException(UTILITY_CLASS_ERROR.message());
    }

    // 지원하는 MIME 타입 → 이미지 포맷 매핑
    private static final Map<String, String> SUPPORTED_MIME_TO_FORMAT = Map.of(
            "image/jpeg", "jpeg",
            "image/png", "png",
            "image/webp", "webp"
    );

    /**
     * 이미지 최적화 메인 메서드
     *
     * @param file 업로드된 이미지 파일
     * @param convertToWebp true면 WebP로 변환, false면 원본 포맷 유지
     * @return 최적화된 이미지 InputStream
     */
    public static InputStream optimize(final MultipartFile file, final boolean convertToWebp) {
        try {
            // 이미지 디코딩 및 정보 추출
            BufferedImage original = decode(file);
            int width = original.getWidth();
            int height = original.getHeight();

            // 리사이징된 ImmutableImage 생성
            ImmutableImage image = prepareImage(original, file.getOriginalFilename());

            // WebP로 변환할지 여부에 따라 처리
            if (convertToWebp) {
                return convertToWebp(file, image, width, height);
            }

            // 원본 포맷으로 저장
            return convertToOriginalFormat(file, image);

        } catch (IOException e) {
            // 예외 발생 시 로깅 후 GlobalException으로 래핑
            String errorFormat = convertToWebp ? FORMAT_WEBP : "ORIGINAL";
            log.error(IMAGE_OPTIMIZER_UNEXPECTED_ERROR, errorFormat, file.getOriginalFilename(), e.getMessage());
            throw new GlobalException(IMAGE_PROCESSING_FAILED, file.getOriginalFilename() + " : " + e.getMessage(), e);
        }
    }

    // WebP 변환 처리
    private static InputStream convertToWebp(MultipartFile file, ImmutableImage image, int width, int height) throws IOException {
        // 이미 WebP이고 크기가 작으면 변환 스킵
        if (isWebp(file) && width <= DEFAULT_IMAGE_WIDTH && height <= DEFAULT_IMAGE_WIDTH) {
            log.debug(IMAGE_OPTIMIZER_SKIP_WEBP_SAME_SIZE, file.getOriginalFilename());
            return file.getInputStream();
        }
        // WebP로 인코딩
        return encodeAsWebp(image);
    }

    // 원본 포맷(jpeg, png 등)으로 인코딩
    private static InputStream convertToOriginalFormat(MultipartFile file, ImmutableImage image) throws IOException {
        String format = resolveFormat(file);
        return encodeAsFormat(image, format);
    }

    // MultipartFile → BufferedImage 디코딩
    private static BufferedImage decode(final MultipartFile file) throws IOException {
        try (InputStream input = file.getInputStream()) {
            return ImmutableImage.loader().fromStream(input).awt();
        } catch (Exception e) {
            log.error(IMAGE_OPTIMIZER_DECODING_FAILED, e.getMessage());
            throw new GlobalException(INVALID_FILE_TYPE, file.getOriginalFilename());
        }
    }

    // WebP 포맷 여부 확인
    private static boolean isWebp(final MultipartFile file) {
        return MIME_TYPE_WEBP.equalsIgnoreCase(file.getContentType());
    }

    // 리사이징 여부 확인 및 이미지 축소 처리
    private static ImmutableImage prepareImage(final BufferedImage image, final String filename) {
        int width = image.getWidth();
        int height = image.getHeight();
        ImmutableImage immutable = ImmutableImage.fromAwt(image);

        // 리사이징 불필요 시 원본 유지
        if (Math.max(width, height) <= DEFAULT_IMAGE_WIDTH) {
            log.debug(IMAGE_OPTIMIZER_SKIP_RESIZE, filename);
            return immutable;
        }

        // 비율 유지하며 리사이징
        double scale = (double) DEFAULT_IMAGE_WIDTH / Math.max(width, height);
        int newWidth = Math.max((int) (width * scale), 3);
        int newHeight = Math.max((int) (height * scale), 3);

        return immutable.scaleTo(newWidth, newHeight);
    }

    // WebP 포맷으로 이미지 인코딩
    private static InputStream encodeAsWebp(final ImmutableImage image) throws IOException {
        byte[] bytes = image.bytes(WebpWriter.DEFAULT
                .withQ(WEBP_QUALITY)
                .withM(WEBP_COMPRESSION_METHOD)
                .withZ(WEBP_COMPRESSION_LEVEL));
        return new ByteArrayInputStream(bytes);
    }

    // jpeg, png 포맷으로 이미지 인코딩
    private static InputStream encodeAsFormat(final ImmutableImage image, final String format) throws IOException {
        BufferedImage bufferedImage = image.awt();
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            if (!ImageIO.write(bufferedImage, format.toLowerCase(), outputStream)) {
                throw new GlobalException(INVALID_FILE_TYPE, format);
            }
            return new ByteArrayInputStream(outputStream.toByteArray());
        }
    }

    // MIME 타입에 따른 저장 포맷 확인
    private static String resolveFormat(final MultipartFile file) {
        String mime = file.getContentType();
        String format = SUPPORTED_MIME_TO_FORMAT.get(mime);
        if (Objects.isNull(format) || format.equals("webp")) {
            throw new GlobalException(IMAGE_PROCESSING_FAILED, mime);
        }
        return format;
    }
}
