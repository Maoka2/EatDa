package com.global.filestorage;

import static com.global.constants.ErrorCode.VIDEO_PROCESSING_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.AUDIO_CODEC;
import static com.global.filestorage.constants.FileStorageConstants.DEFAULT_VIDEO_HEIGHT;
import static com.global.filestorage.constants.FileStorageConstants.EXCEPTION_VIDEO_FFMPEG_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.FFMPEG_CRF;
import static com.global.filestorage.constants.FileStorageConstants.FFMPEG_PRESET;
import static com.global.filestorage.constants.FileStorageConstants.TEMP_FILE_EXTENSION_MP4;
import static com.global.filestorage.constants.FileStorageConstants.TEMP_FILE_EXTENSION_TMP;
import static com.global.filestorage.constants.FileStorageConstants.TEMP_VIDEO_INPUT_PREFIX;
import static com.global.filestorage.constants.FileStorageConstants.TEMP_VIDEO_OUTPUT_PREFIX;
import static com.global.filestorage.constants.FileStorageConstants.VIDEO_CODEC;
import static com.global.filestorage.constants.FileStorageConstants.VIDEO_OPTIMIZER_FFMPEG_FAILED;
import static com.global.filestorage.constants.FileStorageConstants.VIDEO_OPTIMIZER_FFMPEG_LOG;
import static com.global.filestorage.constants.FileStorageConstants.VIDEO_OPTIMIZER_UNEXPECTED_ERROR;

import com.global.exception.GlobalException;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * 비디오 최적화 컴포넌트 - 업로드된 비디오에 대해 리사이징 및 인코딩 수행
 */
@Slf4j
@Component
public class VideoOptimizer {

    /**
     * 비디오 최적화 메인 진입점
     */
    public InputStream optimize(final MultipartFile file) {
        File tempInput = null;
        File tempOutput = null;
        try {
            tempInput = File.createTempFile(TEMP_VIDEO_INPUT_PREFIX, TEMP_FILE_EXTENSION_TMP);
            file.transferTo(tempInput);
            tempInput.deleteOnExit(); // 정리 예약

            tempOutput = File.createTempFile(TEMP_VIDEO_OUTPUT_PREFIX, TEMP_FILE_EXTENSION_MP4);
            tempOutput.deleteOnExit(); // 정리 예약

            transcodeWithFfmpeg(tempInput, tempOutput);

            return new FileInputStream(tempOutput);
        } catch (Exception e) {
            log.error(VIDEO_OPTIMIZER_UNEXPECTED_ERROR, file.getOriginalFilename(), e.getMessage());
            throw new GlobalException(VIDEO_PROCESSING_FAILED, file.getOriginalFilename(), e);
        } finally {
            // 임시 파일 삭제 보장 (이미 deleteOnExit 등록됨, 추가로 명시 삭제도 가능)
            if (!Objects.isNull(tempInput) && tempInput.exists()) {
                tempInput.delete();
            }
            // tempOutput 은 stream 반환 후 삭제되면 안 됨 (deleteOnExit 만 적용)
        }
    }

    /**
     * FFmpeg 를 사용하여 비디오 인코딩 수행
     */
    private void transcodeWithFfmpeg(File input, File output) throws IOException, InterruptedException {
        Process process = getProcess(input, output);

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug(VIDEO_OPTIMIZER_FFMPEG_LOG, line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0 || !output.exists()) {
            log.error(VIDEO_OPTIMIZER_FFMPEG_FAILED, exitCode, output.getAbsolutePath());
            throw new GlobalException(VIDEO_PROCESSING_FAILED,
                    String.format(EXCEPTION_VIDEO_FFMPEG_FAILED, exitCode, output.getAbsolutePath()));
        }
    }

    private Process getProcess(final File input, final File output) throws IOException {
        String[] command = {
                "ffmpeg",
                "-y",
                "-i", input.getAbsolutePath(),
                "-vf", "scale=-2:" + DEFAULT_VIDEO_HEIGHT,
                "-c:v", VIDEO_CODEC,
                "-preset", FFMPEG_PRESET,
                "-crf", FFMPEG_CRF,
                "-c:a", AUDIO_CODEC,
                output.getAbsolutePath()
        };

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.redirectErrorStream(true);
        return pb.start();
    }
}
