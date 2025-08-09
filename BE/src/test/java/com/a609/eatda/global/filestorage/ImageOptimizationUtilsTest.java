package com.a609.eatda.global.filestorage;

import static com.global.constants.ErrorCode.INVALID_FILE_TYPE;
import static com.global.filestorage.constants.FileStorageConstants.DEFAULT_IMAGE_WIDTH;
import static com.global.utils.ImageOptimizationUtils.optimize;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import com.global.exception.GlobalException;
import com.sksamuel.scrimage.ImmutableImage;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Objects;
import javax.imageio.ImageIO;
import org.apache.commons.io.IOUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;


class ImageOptimizationUtilsTest {

    @ParameterizedTest(name = "이미지 파일({0}) → WebP 변환 및 리사이징 검증")
    @ValueSource(strings = {
            "cute.jpg",
            "cute.webp",
            "sleep.jpg",
            "mongle.png"
    })
    void 이미지파일들을_webp로_변환한다(String fileName) throws Exception {
        MockMultipartFile multipartFile = loadTestImage(fileName);

        InputStream result = optimize(multipartFile, true);
        byte[] webpBytes = toByteArray(result);

        assertThat(webpBytes).isNotEmpty();

        BufferedImage buffered = ImageIO.read(new ByteArrayInputStream(webpBytes));
        assertThat(buffered).isNull();

        ImmutableImage webpImg = ImmutableImage.loader().fromBytes(webpBytes);
        int imageMaxLength = Math.max(webpImg.width, webpImg.height);
        assertThat(imageMaxLength).isEqualTo(DEFAULT_IMAGE_WIDTH);
    }

    @Test
    void 작은_이미지는_리사이징_없이_webp로_변환된다() throws Exception {
        MockMultipartFile multipartFile = loadTestImage("small.jpg");

        InputStream result = optimize(multipartFile, true);
        byte[] webpBytes = toByteArray(result);

        assertThat(webpBytes).isNotEmpty();

        ImmutableImage webpImage = ImmutableImage.loader().fromBytes(webpBytes);
        int maxLength = Math.max(webpImage.width, webpImage.height);
        assertThat(maxLength).isLessThanOrEqualTo(DEFAULT_IMAGE_WIDTH);
    }

    @Test
    void 작은_webp는_리사이징_및_인코딩을_생략한다() throws Exception {
        MockMultipartFile multipartFile = loadTestImage("small.webp", "image/webp");
        byte[] originalBytes = toByteArray(multipartFile.getInputStream());

        InputStream result = optimize(multipartFile, true);
        byte[] optimizedBytes = toByteArray(result);

        assertThat(optimizedBytes).isEqualTo(originalBytes);
    }

    @Test
    void 이미지가_아닌_파일은_decode_단계에서_예외를_던진다() throws IOException {
        InputStream inputStream = new ByteArrayInputStream("이건 진짜 이미지가 아닙니다.".getBytes());

        MockMultipartFile fakeJpg = new MockMultipartFile(
                "file", "fake.jpg", "image/jpeg", inputStream);

        assertThatThrownBy(() -> optimize(fakeJpg, true))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining(INVALID_FILE_TYPE.getMessage());
    }

    @Test
    void ImageIO_read_도중_IOException이_발생하면_GlobalException으로_래핑된다() {
        //@formatter:off
        MultipartFile faultyMultipartFile = new MultipartFile() {
            @Override public String getOriginalFilename() { return "faulty.jpg"; }
            @Override public String getContentType() { return "image/jpeg"; }
            @Override public InputStream getInputStream() throws IOException {
                throw new IOException("강제로 발생시킨 IOException");
            }
            @Override public String getName() { return null; }
            @Override public boolean isEmpty() { return false; }
            @Override public long getSize() { return 0; }
            @Override public byte[] getBytes() { return new byte[0]; }
            @Override public void transferTo(File dest) { }
        };
        //@formatter:on

        assertThatThrownBy(() -> optimize(faultyMultipartFile, true))
                .isInstanceOf(GlobalException.class)
                .hasMessageContaining(INVALID_FILE_TYPE.getMessage());
    }

    @Test
    void 리사이징_시_이미지_비율이_유지된다() throws Exception {
        URL resource = getClass().getResource("/test-images/sleep.jpg");
        File file = new File(Objects.requireNonNull(resource).toURI());
        BufferedImage original = ImageIO.read(new FileInputStream(file));
        double originalRatio = (double) original.getWidth() / original.getHeight();

        MockMultipartFile multipartFile = loadTestImage("sleep.jpg");

        InputStream result = optimize(multipartFile, true);
        byte[] resultBytes = toByteArray(result);
        ImmutableImage resizedImage = ImmutableImage.loader().fromBytes(resultBytes);

        double resizedRatio = (double) resizedImage.width / resizedImage.height;

        assertThat(resizedRatio).isCloseTo(originalRatio, within(0.01));
    }

    // ========== 유틸 메서드 ==========

    private MockMultipartFile loadTestImage(String name) throws IOException, URISyntaxException {
        return loadTestImage(name, "image/" + getExtension(name));
    }

    private MockMultipartFile loadTestImage(String name, String contentType) throws IOException, URISyntaxException {
        URL resource = getClass().getResource("/test-images/" + name);
        File file = new File(Objects.requireNonNull(resource).toURI());
        return new MockMultipartFile("file", file.getName(), contentType, new FileInputStream(file));
    }

    private byte[] toByteArray(InputStream input) throws IOException {
        return IOUtils.toByteArray(input);
    }

    private String getExtension(String fileName) {
        String ext = fileName.substring(fileName.lastIndexOf('.') + 1);
        return ext.equalsIgnoreCase("jpg") ? "jpeg" : ext.toLowerCase();
    }
}
