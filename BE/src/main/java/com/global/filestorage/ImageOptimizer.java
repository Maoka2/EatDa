package com.global.filestorage;

import static com.global.constants.ErrorCode.IMAGE_PROCESSING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.DEFAULT_IMAGE_WIDTH;
import static com.global.filestorage.constants.FileStorageConstants.EXCEPTION_DECODING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.FORMAT_WEBP;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_DECODING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.IMAGE_OPTIMIZER_UNEXPECTED_ERROR;
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
 * 이미지 최적화 컴포넌트 - 리사이징 및 WebP 포맷 변환
 */
@Slf4j
@Component
public class ImageOptimizer {

    /**
     * 이미지를 리사이징하고 WebP 형식으로 변환합니다.
     *
     * @param file 원본 MultipartFile 이미지
     * @return WebP 포맷으로 변환된 이미지의 InputStream
     */
    public InputStream optimize(final MultipartFile file) {
        try {
            BufferedImage original = decode(file);             // 이미지 디코딩
            ImmutableImage resized = resize(original);             // 리사이징 후
            byte[] webpBytes = encodeToWebp(resized);             // WebP 변환

            return new ByteArrayInputStream(webpBytes);
        } catch (IOException e) {
            log.error(IMAGE_OPTIMIZER_UNEXPECTED_ERROR, FORMAT_WEBP, file.getOriginalFilename(), e.getMessage());
            throw new GlobalException(IMAGE_PROCESSING_FAILED,
                    file.getOriginalFilename() + " : " + e.getMessage(), e);
        }
    }


    /**
     * MultipartFile에서 BufferedImage 디코딩
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
     * BufferedImage → ImmutableImage로 리사이징 변환
     */
    private ImmutableImage resize(final BufferedImage image) {
        int width = image.getWidth();
        if (width <= DEFAULT_IMAGE_WIDTH) {
            return ImmutableImage.fromAwt(image); // 리사이징 생략
        }
        return ImmutableImage.fromAwt(image).scaleToWidth(DEFAULT_IMAGE_WIDTH);
    }

    /**
     * ImmutableImage → WebP 인코딩
     */
    private byte[] encodeToWebp(final ImmutableImage image) throws IOException {
        WebpWriter webpWriter = WebpWriter.DEFAULT
                .withQ(WEBP_QUALITY)
                .withM(WEBP_COMPRESSION_METHOD)
                .withZ(WEBP_COMPRESSION_LEVEL);

        return image.bytes(webpWriter);
    }
}
