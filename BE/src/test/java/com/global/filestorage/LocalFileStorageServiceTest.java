package com.global.filestorage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class LocalFileStorageServiceTest {

    private static final String TEST_IMAGE_ROOT = "build/test-images";
    private static final String TEST_VIDEO_ROOT = "build/test-videos";

    private LocalFileStorageService service;
    private ImageOptimizer mockImageOptimizer;

    @BeforeEach
    void setUp() throws Exception {
        FileStorageProperties props = new FileStorageProperties();
        Field imageRootField = FileStorageProperties.class.getDeclaredField("imageRoot");
        Field videoRootField = FileStorageProperties.class.getDeclaredField("videoRoot");
        imageRootField.setAccessible(true);
        videoRootField.setAccessible(true);
        imageRootField.set(props, TEST_IMAGE_ROOT);
        videoRootField.set(props, TEST_VIDEO_ROOT);

        // ImageOptimizer를 Mock 으로 생성
        mockImageOptimizer = mock(ImageOptimizer.class);
        service = new LocalFileStorageService(props, mockImageOptimizer);
    }

    @AfterEach
    void cleanup() throws IOException {
        FileUtils.deleteDirectory(new File(TEST_IMAGE_ROOT));
        FileUtils.deleteDirectory(new File(TEST_VIDEO_ROOT));
    }

    @Test
    void 이미지_저장이_성공적으로_이뤄진다() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file",
                "test.jpg",
                "image/jpeg",
                "image-content".getBytes());

        // mock optimize 동작: 그대로 스트림 리턴
        when(mockImageOptimizer.optimize(file)).thenReturn(
                new java.io.ByteArrayInputStream("image-content".getBytes()));

        String path = service.storeImage(file, "menus/1", "test.jpg");
        assertTrue(Files.exists(new File(path).toPath()));
    }

    @Test
    void 비디오_저장이_성공적으로_이뤄진다() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file",
                "test.mp4",
                "video/mp4",
                "video-content".getBytes());

        String path = service.storeVideo(file, "reviews/5", "test.mp4");
        assertTrue(Files.exists(new File(path).toPath()));
    }

    @Test
    void 확장자가_없는_경우_예외가_발생한다() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "foo",
                "application/octet-stream",
                "content".getBytes());

        when(mockImageOptimizer.optimize(file))
                .thenReturn(new ByteArrayInputStream("dummy".getBytes()));

        GlobalException exception = assertThrows(GlobalException.class,
                () -> service.storeImage(file, "menus/1", "foo"));

        assertEquals("INVALID_FILE_TYPE", exception.getErrorCode().getCode());
    }

    @Test
    void 중첩된_상대경로에서도_이미지_저장이_정상적으로_이뤄진다() throws Exception {
        String nestedPath = "menus/2025/08/04";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nested.jpg",
                "image/jpeg",
                "nested-image".getBytes()
        );

        when(mockImageOptimizer.optimize(file))
                .thenReturn(new java.io.ByteArrayInputStream("nested-image".getBytes()));

        String savedPath = service.storeImage(file, nestedPath, "nested.jpg");
        assertTrue(Files.exists(new File(savedPath).toPath()));
    }

    @Test
    void 동일한_이름_다른_확장자라도_충돌없이_저장된다() throws Exception {
        MockMultipartFile pngFile = new MockMultipartFile(
                "file",
                "sample.png",
                "image/png",
                "png-content".getBytes()
        );
        MockMultipartFile jpgFile = new MockMultipartFile(
                "file",
                "sample.jpg",
                "image/jpeg",
                "jpg-content".getBytes()
        );

        when(mockImageOptimizer.optimize(pngFile))
                .thenReturn(new java.io.ByteArrayInputStream("png-content".getBytes()));
        when(mockImageOptimizer.optimize(jpgFile))
                .thenReturn(new java.io.ByteArrayInputStream("jpg-content".getBytes()));

        String path1 = service.storeImage(pngFile, "menus/1", "sample.png");
        String path2 = service.storeImage(jpgFile, "menus/1", "sample.jpg");

        assertTrue(Files.exists(new File(path1).toPath()));
        assertTrue(Files.exists(new File(path2).toPath()));
        assertTrue(new File(path1).length() > 0);
        assertTrue(new File(path2).length() > 0);
        assertNotEquals(path1, path2);
    }

    @Test
    void jpeg_파일은_webp로_변환되어_webp_확장자로_저장된다() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file",
                "image.JPG", // 대문자 확장자
                "image/jpeg",
                "image-content".getBytes());

        when(mockImageOptimizer.optimize(file))
                .thenReturn(new ByteArrayInputStream("image-content".getBytes()));

        String path = service.storeImage(file, "menus/test", "image.JPG");

        File savedFile = new File(path);

        assertTrue(savedFile.exists());
        assertTrue(path.endsWith(".webp"));
    }
}
