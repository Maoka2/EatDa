package com.a609.eatda.global.filestorage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mockStatic;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import com.global.filestorage.LocalFileStorageService;
import com.global.utils.ImageOptimizationUtils;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.mock.web.MockMultipartFile;

class LocalFileStorageServiceTest {

    private LocalFileStorageService service;

    @BeforeEach
    void setUp() {
        FileStorageProperties props = new FileStorageProperties();
        props.setBaseDir("build");      // 테스트용 베이스 디렉토리

        service = new LocalFileStorageService(props);
    }

    @AfterEach
    void cleanup() throws IOException {
        FileUtils.deleteDirectory(new File(service.getProperties().getImageRoot()));
        FileUtils.deleteDirectory(new File(service.getProperties().getVideoRoot()));
    }

    @Test
    void 이미지_저장이_성공적으로_이뤄진다() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file",
                "test.jpg",
                "image/jpeg",
                "image-content".getBytes());

        // try-with-resources 블록으로 static 메서드를 모킹
        try (MockedStatic<ImageOptimizationUtils> mockedStatic = mockStatic(ImageOptimizationUtils.class)) {
            mockedStatic
                    .when(() -> ImageOptimizationUtils.optimize(file, true))
                    .thenReturn(new ByteArrayInputStream("image-content".getBytes()));

            String path = service.storeImage(file, "menus/1", "test.jpg", true);
            assertTrue(Files.exists(new File(path).toPath()));
        }
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
                "file", "foo", "application/octet-stream", "content".getBytes()
        );

        GlobalException exception = assertThrows(GlobalException.class,
                () -> service.storeImage(file, "menus/1", "foo", true));

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
        try (MockedStatic<ImageOptimizationUtils> mocked = mockStatic(ImageOptimizationUtils.class)) {
            mocked.when(() -> ImageOptimizationUtils.optimize(file, true))
                    .thenReturn(new java.io.ByteArrayInputStream("nested-image".getBytes()));

            String savedPath = service.storeImage(file, nestedPath, "nested.jpg", true);
            assertTrue(Files.exists(new File(savedPath).toPath()));
        }
    }

    @Test
    void 동일한_이름_다른_확장자라도_충돌없이_저장된다() throws Exception {
        MockMultipartFile pngFile = new MockMultipartFile(
                "file", "sample.png", "image/png", "png-content".getBytes()
        );
        MockMultipartFile jpgFile = new MockMultipartFile(
                "file", "sample.jpg", "image/jpeg", "jpg-content".getBytes()
        );

        try (MockedStatic<ImageOptimizationUtils> mocked = mockStatic(ImageOptimizationUtils.class)) {
            mocked.when(() -> ImageOptimizationUtils.optimize(pngFile, true))
                    .thenReturn(new ByteArrayInputStream("png-content".getBytes()));
            mocked.when(() -> ImageOptimizationUtils.optimize(jpgFile, true))
                    .thenReturn(new ByteArrayInputStream("jpg-content".getBytes()));

            String path1 = service.storeImage(pngFile, "menus/1", "sample.png", true);
            String path2 = service.storeImage(jpgFile, "menus/1", "sample.jpg", true);

            assertTrue(Files.exists(new File(path1).toPath()));
            assertTrue(Files.exists(new File(path2).toPath()));
            assertTrue(new File(path1).length() > 0);
            assertTrue(new File(path2).length() > 0);

            // 둘 다 webp로 저장되지만, 파일명(UUID)이 달라야 함
            assertTrue(path1.endsWith(".webp"));
            assertTrue(path2.endsWith(".webp"));
            assertNotEquals(path1, path2);
        }
    }

    @Test
    void jpeg_파일은_webp로_변환되어_webp_확장자로_저장된다() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "image.JPG", "image/jpeg", "image-content".getBytes()
        );

        try (MockedStatic<ImageOptimizationUtils> mocked = mockStatic(ImageOptimizationUtils.class)) {
            mocked.when(() -> ImageOptimizationUtils.optimize(file, true))
                    .thenReturn(new ByteArrayInputStream("image-content".getBytes()));

            String path = service.storeImage(file, "menus/test", "image.JPG", true);

            File savedFile = new File(path);
            assertTrue(savedFile.exists());
            assertTrue(path.endsWith(".webp"));
        }
    }
}
