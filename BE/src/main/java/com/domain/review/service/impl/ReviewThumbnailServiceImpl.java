package com.domain.review.service.impl;

import com.domain.review.service.ReviewThumbnailService;
import com.global.constants.ErrorCode;
import com.global.exception.ApiException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
public class ReviewThumbnailServiceImpl implements ReviewThumbnailService {

    private static final String FFMPEG = "ffmpeg";
    private static final String THUMBNAIL_PATH = "thumbnail";
    private static final String EXTENSION = ".jpg";
    private static final int WIDTH = 720;
    private static final int JPEG_QUALITY = 3;
    private static final long NETWORK_TIMEOUT_MICROS = 10_000_000L;

    /**
     * 0초 프레임을 JPEG로 추출해서 EC2 로컬 디스크에 저장
     *
     * @param videoUrl 입력 비디오 URL (http/https)
     * @param fileName 저장 파일명
     * @return 저장된 경로
     */
    @Override
    public Path extractThumbnail(final String videoUrl, final String filePath, final String fileName) {
        validateURL(videoUrl);

        Path out = Path.of(filePath, THUMBNAIL_PATH, fileName + EXTENSION);

        try {
            Files.createDirectories(out.getParent());
        } catch (IOException e) {
            throw new ApiException(ErrorCode.THUMBNAIL_PATH_ERROR, out);
        }

        List<String> cmd = List.of(
                FFMPEG,
                "-y",                                                   //  파일이 있으면 덮어쓰기
                "-hide_banner",
                "-loglevel", "error",
                "-nostdin",
                "-rw_timeout", String.valueOf(NETWORK_TIMEOUT_MICROS),  // 네트워크 10초(마이크로초)
                "-ss", "0",                                             // 0초 프레임
                "-i", videoUrl,                                         // 입력
                "-frames:v", "1",                                       // 한 프레임만
                "-vf", "scale=" + WIDTH + ":-1",                        // 가로 고정, 세로 비율 유지
                "-q:v", String.valueOf(JPEG_QUALITY),                   // JPEG 품질 (작은 값일 수록 고화질)
                "-f", "mjpeg",                                          // 명시적으로 JPEG 컨테이너
                out.toAbsolutePath().toString()                         // 파일로 바로 저장
        );

        run(cmd);
        return out;
    }

    private void run(final List<String> command) {
        try {
            Process proc = new ProcessBuilder(command)
                    .redirectErrorStream(true)
                    .start();
            int code = proc.waitFor();
            if (code != 0) {
                throw new ApiException(ErrorCode.THUMBNAIL_GENERATE_ERROR);
            }
        } catch (Exception e) {
            throw new ApiException(ErrorCode.THUMBNAIL_GENERATE_ERROR);
        }
    }

    private void validateURL(final String url) {
        if (Objects.isNull(url) || url.isBlank()) {
            throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND);
        }
        if (!(url.startsWith("http://") || url.startsWith("https://"))) {
            throw new ApiException(ErrorCode.PROTOCOL_FORMAT_ERROR, url);
        }
    }
}
