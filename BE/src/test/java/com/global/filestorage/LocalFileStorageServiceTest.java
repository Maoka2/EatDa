package com.global.filestorage;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.global.config.FileStorageProperties;
import com.global.exception.GlobalException;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
import org.apache.commons.io.FileUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class LocalFileStorageServiceTest {

    private static final String TEST_IMAGE_ROOT = "build/test-images";
    private static final String TEST_VIDEO_ROOT = "build/test-videos";

    private LocalFileStorageService service;

    @BeforeEach
    void setUp() {
        FileStorageProperties props = new FileStorageProperties();
        // reflection 방식으로 필드 설정
        try {
            Field imageRootField = FileStorageProperties.class.getDeclaredField("imageRoot");
            Field videoRootField = FileStorageProperties.class.getDeclaredField("videoRoot");
            imageRootField.setAccessible(true);
            videoRootField.setAccessible(true);
            imageRootField.set(props, TEST_IMAGE_ROOT);
            videoRootField.set(props, TEST_VIDEO_ROOT);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        service = new LocalFileStorageService(props);
    }

    @AfterEach
    void cleanup() throws IOException {
        FileUtils.deleteDirectory(new File(TEST_IMAGE_ROOT));
        FileUtils.deleteDirectory(new File(TEST_VIDEO_ROOT));
    }

    @Test
    void 이미지_저장이_성공적으로_이뤄진다() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file",
                "test.jpg",
                "image/jpeg",
                "image-content".getBytes());

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
                "application/octet-stream", // MIME 매핑 안됨
                "content".getBytes());

        GlobalException exception = assertThrows(GlobalException.class,
                () -> service.storeImage(file, "menus/1", "foo"));

        assertEquals("INVALID_FILE_TYPE", exception.getErrorCode().getCode());
    }

    @Test
    void 중첩된_상대경로에서도_이미지_저장이_정상적으로_이뤄진다() throws IOException {
        String nestedPath = "menus/2025/08/04";
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "nested.jpg",
                "image/jpeg",
                "nested-image".getBytes()
        );

        String savedPath = service.storeImage(file, nestedPath, "nested.jpg");

        assertTrue(Files.exists(new File(savedPath).toPath()));
    }

    @Test
    void 동일한_이름_다른_확장자라도_충돌없이_저장된다() throws IOException {
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

        String path1 = service.storeImage(pngFile, "menus/1", "sample.png");
        String path2 = service.storeImage(jpgFile, "menus/1", "sample.jpg");

        assertTrue(Files.exists(new File(path1).toPath()));
        assertTrue(Files.exists(new File(path2).toPath()));
        assertTrue(new File(path1).length() > 0);
        assertTrue(new File(path2).length() > 0);
        assertNotEquals(path1, path2);
    }

    @Test
    void 파일저장_실패시_GlobalException으로_포장된다() throws IOException {
        MultipartFile mockFile = mock(MultipartFile.class);
        when(mockFile.getContentType()).thenReturn("image/jpeg");
        when(mockFile.getOriginalFilename()).thenReturn("error.jpg");
        doThrow(new IOException("Disk full")).when(mockFile).transferTo(any(File.class));

        GlobalException exception = assertThrows(GlobalException.class,
                () -> service.storeImage(mockFile, "menus/1", "error.jpg"));

        assertEquals("FILE_UPLOAD_ERROR", exception.getErrorCode().getCode());
        assertEquals("error.jpg", exception.getDetails());
        assertInstanceOf(IOException.class, exception.getCause());
    }

    @Test
    void 대문자_확장자는_소문자로_정상_변환되어_저장된다() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file",
                "IMAGE.JPG",
                "image/jpeg",
                "image-content".getBytes());

        String path = service.storeImage(file, "menus/upper-case", "IMAGE.JPG");

        File savedFile = new File(path);
        assertTrue(savedFile.exists());
        assertTrue(path.endsWith(".jpg")); // 소문자 확장자 확인
    }
}
